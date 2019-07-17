const {
    app,
    BrowserWindow,
    Menu,
    MenuItem,
    Tray,
    shell
} = require('electron');
//ipc主进程
const ipc = require('electron').ipcMain;
//set storage
const storage = require('electron-json-storage');
const path = require('path');

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock){
    app.exit();
}

//global settings
global.indebug = true; //debug trigger
global.isOS64 = true; //OS flag
global.firstStart = false; //first start flag
global.uuid = ""; //uuid storage

//auto-update
const {
    autoUpdater
} = require('electron-updater');
let feedUrl = ``;

//import other window
aboutWindow = require('./app/about');
editWindow = require('./app/edit');
recycleWindow = require('./app/recyclebin');
settingsWindow = require('./app/settings');
newnoteWindow = require('./app/newnote');
decryptionWindow = require('./app/decryption');
desktopWidget = require('./app/widget');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;
var tray;

function createWindow() {
    // 创建浏览器窗口。
    var conf = {
        width: 1280,
        height: 800,
        minWidth: 480,
        minHeight: 600,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    };
    //标题栏的选用
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    win = new BrowserWindow(conf);

    if (indebug) {
        win.webContents.openDevTools();
    }
    var settings;
    storage.get('settings', function(err, data) {
        if (err) {
            //获取callback回传的json
            console.error(err);
        }
        settings = data;
        if (typeof settings != 'undefined') {
            switch (settings.autoUpdateChannel) {
                case "0":
                    if (isOS64) {
                        feedUrl = `http://update.backrunner.top/fastnote/${process.platform}/x64`;
                    } else {
                        feedUrl = `http://update.backrunner.top/fastnote/${process.platform}`;
                    }
                    break;
                case "100":
                    if (isOS64) {
                        feedUrl = `http://update.backrunner.top/fastnote/pre-release/${process.platform}/x64`;
                    } else {
                        feedUrl = `http://update.backrunner.top/fastnote/pre-release/${process.platform}`;
                    }
                    break;
                default:
                    if (isOS64) {
                        feedUrl = `http://update.backrunner.top/fastnote/${process.platform}/x64`;
                    } else {
                        feedUrl = `http://update.backrunner.top/fastnote/${process.platform}`;
                    }
                    break;
            }
        } else {
            feedUrl = `http://update.backrunner.top/fastnote/${process.platform}`;
        }
        let viewpath = path.resolve(__dirname, './public/index.html');
        win.loadFile(viewpath);
    });

    //uuid recevier
    ipc.on('set-uuid', function(sender, data) {
        global.uuid = data;
    });
    ipc.on('main-window-ready', function(sender, data) {
        //show main window
        win.show();
    });
    //bind restore note event
    ipc.on('restore-note', function(sender, data) {
        win.webContents.send('restore-note', data);
    });
    //open about window
    ipc.on('openAboutWindow', () => {
        aboutWindow();
    });
    ipc.on('openRecycleWindow', () => {
        recycleWindow.create();
    });
    //open edit window
    ipc.on('openEditWindow', (sender, data) => {
        editWindow.showWindow(data);
    });
    //open settings window
    ipc.on('openSettingsWindow', () => {
        settingsWindow();
    });
    //open newnote window
    ipc.on('openNewnoteWindow', (sender, data) => {
        newnoteWindow.create(data);
    });
    //open decryption window
    ipc.on('openDecryptionWindow', (sender, data) => {
        decryptionWindow.show(data);
    });
    ipc.on('createDesktopWidget', (sender, data) => {
        desktopWidget.create(data);
    });
    ipc.on('reloadMainWindow', (sender, data) => {
        win.webContents.send('before-reload');
        win.reload();
        checkForUpdates();
    });
    //when recycle close edit
    ipc.on('recycle-note', function(sender, data) {
        let editWins = editWindow.getWins();
        for (let i = 0; i < editWins.length; i++) {
            if (typeof editWins[i] != 'undefined' && editWins[i] != null) {
                editWins[i].webContents.send('message', {
                    type: 'note-recycled',
                    data: data
                });
            }
        }
        let widgets = desktopWidget.getWindows();
        for (let i = 0; i < widgets.length; i++) {
            if (typeof widgets[i] != 'undefined' && widgets[i] != null) {
                widgets[i].webContents.send('note-recycled');
            }
        }
    });

    //backup recovered
    ipc.on('backup-recover-completed', function() {
        //转送消息给主窗口
        win.webContents.send('backup-recover-completed');
    });

    //分类有修改
    ipc.on('category_added', (sender, data) => {
        let editWins = editWindow.getWins();
        for (let i = 0; i < editWins.length; i++) {
            if (typeof editWins[i] != 'undefined' && editWins[i] != null) {
                editWins[i].webContents.send('message', {
                    type: 'category-added',
                    data: data
                });
            }
        }
        let newnoteWins = newnoteWindow.getWins();
        for (let i = 0; i < newnoteWins.length; i++) {
            if (typeof newnoteWins[i] != 'undefined' && newnoteWins[i] != null) {
                newnoteWins[i].webContents.send('category-added', data);
            }
        }
    });
    ipc.on('category_removed', (sender, data) => {
        let editWins = editWindow.getWins();
        for (let i = 0; i < editWins.length; i++) {
            if (typeof editWins[i] != 'undefined' && editWins[i] != null) {
                editWins[i].webContents.send('message', {
                    type: 'category-removed',
                    data: data
                });
            }
        }
        let newnoteWins = newnoteWindow.getWins();
        for (let i = 0; i < newnoteWins.length; i++) {
            if (typeof newnoteWins[i] != 'undefined' && newnoteWins[i] != null) {
                newnoteWins[i].webContents.send('category-removed', data);
            }
        }
    });
    ipc.on('category_rename', (sender, data) => {
        let editWins = editWindow.getWins();
        for (let i = 0; i < editWins.length; i++) {
            if (typeof editWins[i] != 'undefined' && editWins[i] != null) {
                editWins[i].webContents.send('message', {
                    type: 'category-rename',
                    data: data
                });
            }
        }
        let newnoteWins = newnoteWindow.getWins();
        for (let i = 0; i < newnoteWins.length; i++) {
            if (typeof newnoteWins[i] != 'undefined' && newnoteWins[i] != null) {
                newnoteWins[i].webContents.send('category-rename', data);
            }
        }
    });

    //always on top
    ipc.on('main-window-alwaysontop', () => {
        console.log(1);
        if (win.isAlwaysOnTop()) {
            win.setAlwaysOnTop(false);
            win.webContents.send('win-alwaysontop', false);
        } else {
            win.setAlwaysOnTop(true);
            win.webContents.send('win-alwaysontop', true);
        }
    });

    ipc.on('cancel-encryption', function(sender, data) {
        win.webContents.send('cancel-encryption', data);
    });

    //quit now
    ipc.on('app-quitNow', () => {
        app.exit();
    });

    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        win = null;
    });

    //getfocus
    win.on('ready-to-show', () => {
        checkForUpdates();
        //bind update event
        editWindow.bindEditEvent(function(data) {
            win.webContents.send('update-edit-note', data);
            desktopWidget.updateEditNote(data);
        });
    });

    //锁屏
    win.on('minimize', () => {
        var windows = BrowserWindow.getAllWindows();
        for (let i = 0; i < windows.length; i++) {
            if (!windows[i].isMinimized()) {
                return;
            }
        }
        for (let i = 0; i < windows.length; i++) {
            windows[i].webContents.send('enable-lockscreen-minimize');
        }
    });
    win.on('blur', () => {
        var windows = BrowserWindow.getAllWindows();
        if (BrowserWindow.getFocusedWindow() == null) {
            for (var i = 0; i < windows.length; i++) {
                windows[i].webContents.send('enable-lockscreen-blur');
            }
        }
    });
}

ipc.on('disable-lockscreen', () => {
    var windows = BrowserWindow.getAllWindows();
    for (var i = 0; i < windows.length; i++) {
        windows[i].webContents.send('disable-lockscreen');
    }
});

//捕捉新建便签窗口的消息
ipc.on('newnotewin-save', (sender, data) => {
    win.webContents.send('newnotewin-save', data);
});

//创建托盘
function createTray() {
    let trayIco = path.resolve(__dirname, './public/static/images/tray.ico');
    tray = new Tray(trayIco);
    let contextMenu = Menu.buildFromTemplate([{
        label: '退出',
        click: () => {
            app.exit();
        }
    }]);
    if(win != null){
        contextMenu.insert(0, new MenuItem({
            label: '重新载入',
            click: ()=>{
                win.webContents.send('tray-reload');
            }
        }));
    }
    tray.setToolTip('Fastnote');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
        if (win == null) {
            createWindow();
        } else {
            win.focus();
        }
    });
}

//自动更新事件定义
let sendUpdateMessage = (message, data) => {
    win.webContents.send('update-message', {
        message,
        data
    });
};

let checkForUpdates = () => {
    autoUpdater.setFeedURL(feedUrl);
    autoUpdater.autoDownload = false;

    ipc.on('downloadNow', function() {
        autoUpdater.downloadUpdate();
    });

    autoUpdater.on('error', function(message) {
        sendUpdateMessage('error', message);
    });
    autoUpdater.on('checking-for-update', function(message) {
        sendUpdateMessage('checking-for-update', message);
    });
    autoUpdater.on('update-available', function(message) {
        sendUpdateMessage('update-available', message);
    });
    autoUpdater.on('update-not-available', function(message) {
        sendUpdateMessage('update-not-available', message);
    });

    // 更新下载进度事件
    autoUpdater.on('download-progress', function(progressObj) {
        sendUpdateMessage('downloadProgress', progressObj);
    });
    autoUpdater.on('update-downloaded', () => {
        sendUpdateMessage('update-downloaded');
    });

    //执行自动更新检查
    autoUpdater.checkForUpdates();
};

//打开外部链接事件监听
ipc.on('openExternalURL', (e, msg) => {
    shell.openExternal(msg);
});

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
        createWindow();
    }
});

app.on('ready', () => {
    createWindow();
    createTray();
});

app.on('second-instance', ()=>{
    if (win){
        if (win.isMinimized()){
            win.restore();
        }
        win.focus();
    }
});

//窗口全部关闭的时候仍然保留托盘
app.on('window-all-closed', (e) => {
    e.preventDefault();
});
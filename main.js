const {
    app,
    BrowserWindow,
    Menu,
    MenuItem,
    Tray,
    shell
} = require('electron');
// ipc主进程
const ipc = require('electron').ipcMain;
// set storage
const storage = require('electron-json-storage');
const path = require('path');

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock){
    app.exit();
}

// global settings
global.indebug = true; //debug trigger
global.isOS64 = true; //OS flag
global.firstStart = false; //first start flag
global.uuid = ""; //uuid storage

// auto-update
const {
    autoUpdater
} = require('electron-updater');
let feedUrl = ``;

// import other window
const aboutWindow = require('./app/about');
const editWindow = require('./app/edit');
const recycleWindow = require('./app/recyclebin');
const settingsWindow = require('./app/settings');
const newnoteWindow = require('./app/newnote');
const decryptionWindow = require('./app/decryption');
const desktopWidget = require('./app/widget');
const cloudWindow = require('./app/cloud/cloudWindow');

// global variables
let win;
let tray;

app.on('ready', async () => {
    // do create
    createTray();
    await createWindow();
});

async function createWindow() {
    // 创建浏览器窗口。
    let conf = {
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

    var settings;
    storage.get('settings' + (global.indebug ? '_dev' : ''), async function (err, data) {
        if (err) {
            //获取callback回传的json
            console.error(err);
        }
        settings = data;
        if (settings) {
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
            // hotfix
            global.hotfix = require('./utils/hotfix');
            global.hotfix.state = settings.hotfix;
            if (!global.hotfix.state) {
                // 初始值
                global.hotfix.state = 'after';
            }
            global.hotfix.state = 'close';
            if (global.hotfix.state !== 'close') {
                // set timer
                if (global.hotfix.state === 'wait') {
                    await global.hotfix.init(global.indebug);
                } else {
                    global.hotfix.init(global.indebug);
                }
                global.pathPrefix = `${app.getAppPath()}/node_modules/`;
            }
        } else {
            feedUrl = `http://update.backrunner.top/fastnote/${process.platform}`;
        }

        let viewpath;
        if (global.hotfix && global.hotfix.state !== 'close') {
            viewpath = global.hotfix.buildPath('index.html');
        } else {
            viewpath = path.resolve(__dirname, './public/index.html');
        }

        win.loadFile(viewpath);
    });

    // uuid recevier
    ipc.on('set-uuid', function(sender, data) {
        global.uuid = data;
    });
    ipc.on('main-window-ready', function(sender, data) {
        // show main window
        win.show();
    });
    // bind restore note event
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
        editWindow.show(data);
    });
    //open settings window
    ipc.on('openSettingsWindow', () => {
        settingsWindow.show();
    });
    //open newnote window
    ipc.on('openNewnoteWindow', (sender, data) => {
        newnoteWindow.create(data);
    });
    //open decryption window
    ipc.on('openDecryptionWindow', (sender, data) => {
        decryptionWindow.show(data);
    });
    //open login window
    ipc.on('openLoginWindow', ()=>{
        cloudWindow.createLoginWindow();
    });
    //open register window
    ipc.on('openRegisterWindow', ()=>{
        cloudWindow.createRegisterWindow();
    });
    //create desktop widget
    ipc.on('createDesktopWidget', (sender, data) => {
        desktopWidget.create(data);
    });
    ipc.on('reloadMainWindow', () => {
        win.webContents.send('before-reload');
        win.reload();
    });
    ipc.on('reloadWindowAfterReset', () => {
        // 完全重置
        // 尝试重载主窗体
        if (win) {
            win.webContents.send('before-reload');
            win.reload();
        }
        // 尝试重载回收站
        recycleWindow.reload();
        // 关闭所有编辑的窗体
        editWindow.closeAll();
        // 设置窗体重新获取焦点
        if (settingsWindow.get()) {
            settingsWindow.getFocus();
        }
        checkForUpdates();
    });
    // when recycle close edit
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

    // *** 备份相关 ***

    // 便签已恢复
    ipc.on('backup-recover-completed', () => {
        //转送消息给主窗口
        win.webContents.send('backup-recover-completed');
    });

    // ****************

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
        if (win.isAlwaysOnTop()) {
            win.setAlwaysOnTop(false);
            win.webContents.send('win-alwaysontop', false);
        } else {
            win.setAlwaysOnTop(true);
            win.webContents.send('win-alwaysontop', true);
        }
    });

    ipc.on('cloud-login-success', (sender, data)=>{
        win.webContents.send('cloud-login-success', data);
    });

    ipc.on('cloud-register-success', (sender, data)=>{
        win.webContents.send('cloud-register-success', data);
    });

    ipc.on('cancel-encryption', function(sender, data) {
        win.webContents.send('cancel-encryption', data);
    });

    //quit now
    ipc.on('app-quitNow', () => {
        app.exit();
    });

    // *** 窗体关闭 ***

    win.on('close', (e) => {
        // 设置窗口打开的时候关闭主窗体，则一并关闭设置窗体
        if (settingsWindow.get()) {
            setttingsWindow.close();
        }
    });

    win.on('closed', () => {
        // 把win置空
        win = null;
        // 更换托盘菜单
        if (tray) {
            let contextMenu = createContextMenu('destoryed');
            tray.setContextMenu(contextMenu);
        }
    });

    // ****************

    //getfocus
    win.on('ready-to-show', () => {
        checkForUpdates();
        // 更换托盘菜单
        if (tray) {
            let contextMenu = createContextMenu('created');
            tray.setContextMenu(contextMenu);
        }
        // bind update event
        editWindow.bindEditEvent(function(data) {
            win.webContents.send('update-edit-note', data);
            desktopWidget.updateEditNote(data);
        });
    });

    // 锁屏
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

// 捕捉新建便签窗口的消息
ipc.on('newnotewin-save', (sender, data) => {
    win.webContents.send('newnotewin-save', data);
});

// get hotfix changed info
ipc.on('hotfix-changed', (sender, data) => {
    global.hotfix.state = data;
    if (data !== 'close') {
        global.pathPrefix = `${app.getAppPath()}/node_modules/`;
    } else {
        global.pathPrefix = null;
    }
});

function openWindow() {
    if (!win) {
        createWindow();
    } else {
        if (win.isMinimized()){
            win.restore();
        }
        win.focus();
    }
}

//创建托盘
function createTray() {
    let trayIco = path.resolve(__dirname, './public/static/images/tray.ico');
    tray = new Tray(trayIco);
    tray.setToolTip('Fastnote');
    let contextMenu = createContextMenu('created');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
        openWindow();
    });
}

function createContextMenu(mode) {
    let contextMenu;
    // 窗口已经启动时的菜单
    if (mode == 'created') {
        contextMenu = Menu.buildFromTemplate([{
            label: '退出',
            click: () => {
                app.exit();
            }
        }]);
        contextMenu.insert(0, new MenuItem({
            label: '重新载入',
            click: ()=>{
                if (win != null) {
                    if (win.isMinimized()) {
                        win.restore();
                        win.focus();
                    }
                    win.webContents.send('tray-reload');
                }
            }
        }));
    } else if (mode == 'destoryed') {
        contextMenu = Menu.buildFromTemplate([{
            label: '退出',
            click: () => {
                app.exit();
            }
        }]);
        contextMenu.insert(0, new MenuItem({
            label: '显示',
            click: ()=>{
                if (!win) {
                    createWindow();
                } else {
                    if (win.isMinimized()) {
                        win.restore();
                        win.focus();
                    }
                }
            }
        }));
    }
    return contextMenu;
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
    if (!win) {
        createWindow();
    }
});

app.on('second-instance', ()=>{
    if (win != null){
        if (win.isMinimized()){
            win.restore();
        }
        win.focus();
    } else {
        createWindow();
        win.focus();
    }
});

//窗口全部关闭的时候仍然保留托盘
app.on('window-all-closed', (e) => {
    e.preventDefault();
});
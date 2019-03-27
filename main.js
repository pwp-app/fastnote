const {
  BrowserWindow
} = require('electron');
const app = require('electron').app;
//ipc主进程
const ipc = require('electron').ipcMain;
//set storage
const storage = require('electron-json-storage');

//获取shell
const {
  shell
} = require('electron');

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

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
  // 创建浏览器窗口。
  var conf = {
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    show: false,
    transparent: true
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
  storage.get('settings', function (err, data) {
    if (err) {
      //获取callback回传的json
      console.error(err);
    }
    settings = data;
    if (typeof settings != 'undefined') {
      switch (settings.autoUpdateChannel) {
        case "0":
          if (isOS64){
            feedUrl = `http://update.backrunner.top/fastnote/${process.platform}/x64`;
          } else {
            feedUrl = `http://update.backrunner.top/fastnote/${process.platform}`;
          }
          break;
        case "100":
          if (isOS64){
            feedUrl = `http://update.backrunner.top/fastnote/pre-release/${process.platform}/x64`;
          } else {
            feedUrl = `http://update.backrunner.top/fastnote/pre-release/${process.platform}`;
          }
          break;
        default:
          if (isOS64){
            feedUrl = `http://update.backrunner.top/fastnote/${process.platform}/x64`;
          } else {
            feedUrl = `http://update.backrunner.top/fastnote/${process.platform}`;
          }
          break;
      }
    } else {
      feedUrl = `http://update.backrunner.top/fastnote/${process.platform}`;
    }
    // 加载应用的 index.html。
    win.loadFile('public/index.html');
  });

  //uuid recevier
  ipc.on('set-uuid', function (sender, data) {
    global.uuid = data;
  });
  ipc.on('main-window-ready', function (sender, data) {
    //show main window
    win.show();
  });
  //bind restore note event
  ipc.on('restore-note', function (sender, data) {
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
  ipc.on('openEditWindow', function (sender, data) {
    editWindow.showWindow(data);
  });
  ipc.on('openSettingsWindow', () => {
    settingsWindow();
  });

  ipc.on('reloadMainWindow', function (sender, data) {
    win.reload();
    if (typeof settings != undefined) {
      if (settings.autoUpdateStatus) {
        checkForUpdates();
      }
    }
  });
  //when recycle close edit
  ipc.on('recycle-note', function (sender, data) {
    var editWins = editWindow.getWins();
    for (var i = 0; i < editWins.length; i++) {
      if (typeof editWins[i] != undefined && editWins[i] != null) {
        editWins[i].webContents.send('message', {
          type: 'note-recycled',
          data: data
        });
      }
    }
  });

  //backup recovered
  ipc.on('backup-recover-completed', function(){
    //转送消息给主窗口
    win.webContents.send('backup-recover-completed');
  });

  //quit now
  ipc.on('app-quitNow', () => {
    app.quit();
  });


  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    win = null;
    app.quit();
  })
  //getfocus
  win.on('ready-to-show', () => {
    if (typeof settings != 'undefined') {
      if (settings.autoUpdateStatus) {
        checkForUpdates();
      }
    }
    //bind update event
    editWindow.bindEditEvent(function (data) {
      win.webContents.send('update-edit-note', data);
    });
  });
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow);

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  app.quit();
});

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

  ipc.on('downloadNow', function () {
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('error', function (message) {
    sendUpdateMessage('error', message);
  });
  autoUpdater.on('checking-for-update', function (message) {
    sendUpdateMessage('checking-for-update', message);
  });
  autoUpdater.on('update-available', function (message) {
    sendUpdateMessage('update-available', message);
  });
  autoUpdater.on('update-not-available', function (message) {
    sendUpdateMessage('update-not-available', message);
  });

  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    sendUpdateMessage('downloadProgress', progressObj);
  })
  autoUpdater.on('update-downloaded', () => {
    sendUpdateMessage('update-downloaded');
  });

  //执行自动更新检查
  autoUpdater.checkForUpdates();
};

//打开外部链接事件监听
let openExternalURL = () => {
  ipc.on('openExternalURL', (e, msg) => {
    shell.openExternal(msg);
  })
}

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
    createWindow();
  }
});

//event
openExternalURL();
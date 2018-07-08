const {
  BrowserWindow
} = require('electron');
const app = require('electron').app;
//ipc主进程
const ipc = require('electron').ipcMain;

//获取shell
const {shell} = require('electron');

const indebug = true;

//auto-update
const {
  autoUpdater
} = require('electron-updater');
const feedUrl = `http://update.backrunner.top/fastnote/${process.platform}`;

//import other window
aboutWindow = require('./app/about');

//import const
global.Const = require('./app/const.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
  // 创建浏览器窗口。
  var conf = {
    width: 1280,
    height: 800,
    resizable: false,
    maximazable: false,
    show: false
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
  // 然后加载应用的 index.html。
  win.loadFile('views/index.html');

  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    win = null;
    app.quit();
  })
  //getfocus
  win.on('ready-to-show', () => {
    win.focus();
    win.show();    
    checkForUpdates();  
    ipc.on('openAboutWindow',()=>{
      aboutWindow();
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
  win.webContents.send('message', {
    message,
    data
  });
};

let checkForUpdates = () => {
  autoUpdater.setFeedURL(feedUrl);

  autoUpdater.on('error', function (message) {
    sendUpdateMessage('error', message)
    console.error('autoupdate error:' + message);
  });
  autoUpdater.on('checking-for-update', function (message) {
    sendUpdateMessage('checking-for-update', message)
    console.log('checking update...');
  });
  autoUpdater.on('update-available', function (message) {
    sendUpdateMessage('update-available', message)
  });
  autoUpdater.on('update-not-available', function (message) {
    sendUpdateMessage('update-not-available', message)
  });

  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    sendUpdateMessage('downloadProgress', progressObj)
  })
  autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
    ipc.on('updateNow', (e, arg) => {
      //some code here to handle event
      autoUpdater.quitAndInstall();
    })
    sendUpdateMessage('isUpdateNow');
  });

  //执行自动更新检查
  autoUpdater.checkForUpdates();
};

//打开外部链接事件监听
let openOutsideURL = () =>{
  ipc.on('openOutsideURL',(e,msg) => {
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

openOutsideURL();
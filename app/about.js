let win_about;

const {
    BrowserWindow
} = require('electron');
const app = require('electron').app;
//ipc主进程
const ipc = require('electron').ipcMain;

//获取shell
const {
    shell
} = require('electron');

function createAboutWindow() {
    var conf = {
        width: 600,
        height: 320,
        resizable: false,
        maximazable: false,
        show: false
    };
    //标题栏的选用
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;
    win_about = new BrowserWindow(conf);
    win_about.on('closed', () => {
        win_about = null;
    })
}
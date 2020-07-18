let win_about = null;

const {
    BrowserWindow
} = require('electron');

const ipc = require('electron').ipcMain;
const app = require('electron').app;
const path = require('path');

function createAboutWindow() {
    var conf = {
        width: 600,
        height: 320,
        resizable: false,
        maximazable: false,
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

    win_about = new BrowserWindow(conf);

    let viewpath;
    if (global.hotfix && global.hotfix.state !== 'close') {
        viewpath = global.hotfix.buildPath('about.html');
    } else {
        viewpath = path.resolve(__dirname, '../public/about.html');
    }
    win_about.loadFile(viewpath);

    win_about.on('closed', () => {
        win_about = null;
    });
    win_about.on('ready-to-show', () => {
        ipc.once('about-window-ready',()=>{
            win_about.show();
        });
    });
}

ipc.on('reloadAboutWindow',function(sender, data){
    if (win_about != null){
        win_about.reload();
    }
});

function showAboutWindow() {
    if (win_about != null) {
        if (win_about.isMinimized()) {
            win_about.restore();
        }
        win_about.focus();
    } else {
        createAboutWindow();
    }
}

module.exports = showAboutWindow;
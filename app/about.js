let win_about = null;

const {
    BrowserWindow
} = require('electron');

const app = require('electron').app;

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

    win_about.loadFile('../view/about.html');

    win_about.webContents.openDevTools();

    win_about.on('closed', () => {
        win_about = null;
    })
    win_about.on('ready-to-show', () => {
        win_about.focus();
        win_about.show();
    });
}

function showAboutWindow(){
    if (win_about !== null){
        if (win_about.isMinimized()){
            win_about.restore();
            win_about.focus();
        }
    } else {
        createAboutWindow();
    }
}

module.exports = showAboutWindow;
let win_settings = null;

const {
    BrowserWindow
} = require('electron');

const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

function createAboutWindow() {
    var conf = {
        width: 680,
        height: 435,
        resizable: false,
        maximazable: false,
        show: false
    };
    //标题栏的选用
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    win_settings = new BrowserWindow(conf);

    var viewpath = path.resolve(__dirname, '../views/settings.html');
    win_settings.loadFile(viewpath);

    if (indebug)
        win_settings.webContents.openDevTools();

    win_settings.on('closed', () => {
        win_settings = null;
    })
    win_settings.on('winSettings-ready', () => {
        win_settings.focus();
        win_settings.show();
    });
}

function showSettingsWindow() {
    if (win_settings !== null) {
        if (win_settings.isMinimized()) {
            win_settings.restore();
        }
        win_settings.focus();
    } else {
        createAboutWindow();
    }
}

ipc.on('reloadSettingsWindow',function(sender, data){
    win_settings.reload();
});

module.exports = showSettingsWindow;
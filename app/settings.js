
let win_settings = null;

const {
    BrowserWindow
} = require('electron');

const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

function createSettingsWindow() {
    var conf = {
        width: 680,
        height: 530,
        resizable: false,
        maximazable: false,
        minHeight: 0,
        useContentSize: true,
        show: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true
        }
    };
    //标题栏的选用
    if (process.platform == 'darwin')
        conf.titleBarStyle = 'hiddenInset';
    else
        conf.frame = false;

    win_settings = new BrowserWindow(conf);

    var viewpath = path.resolve(__dirname, '../public/settings.html');
    win_settings.loadFile(viewpath);

    ipc.on('settings-window-heightChange', function(sender, height){
        win_settings.setContentSize(680, height);
    });

    win_settings.on('closed', () => {
        win_settings = null;
    });

    win_settings.on('ready-to-show', ()=>{
        ipc.on('settings-window-ready', () => {
            win_settings.show();
        });
    });
}

function showSettingsWindow() {
    if (win_settings != null) {
        if (win_settings.isMinimized()) {
            win_settings.restore();
        }
        win_settings.focus();
    } else {
        createSettingsWindow();
    }
}

ipc.on('reloadSettingsWindow',function(sender, data){
    win_settings.reload();
});

module.exports = showSettingsWindow;
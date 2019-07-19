let win_login = null;

const {
    BrowserWindow
} = require('electron');

//ipc主进程
const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

function createLoginWindow(){
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

    win_login = new BrowserWindow(conf);

    var viewpath = path.resolve(__dirname, '../../../public/cloud/login.html');
    win_login.loadFile(viewpath);

    win_login.on('closed', () => {
        win_login = null;
    });

    win_login.on('ready-to-show', ()=>{
        //ipc.once('login-window-ready',()=>{
            win_login.show();
        //});
    });
}

ipc.on('reloadLoginWindow', ()=>{
    if (win_login!=null){
        win_login.reload();
    }
});

const loginWindow = {
    createWindow: ()=>{
        if (win_login != null){
            if (win_login.isMinimized()){
                win_login.restore();
            }
            win_login.focus();
        } else {
            createLoginWindow();
        }
    }
};

module.exports = loginWindow;
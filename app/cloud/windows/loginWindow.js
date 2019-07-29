let win_login = null;
let status = null;

const {
    BrowserWindow
} = require('electron');

//ipc主进程
const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

function createLoginWindow() {
    var conf = {
        width: 600,
        height: 320,
        //resizable: false,
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

    let viewpath = path.resolve(__dirname, '../../../public/cloud/login.html');
    win_login.loadFile(viewpath);

    win_login.on('closed', () => {
        win_login = null;
    });

    win_login.on('ready-to-show', () => {
        ipc.once('login-window-ready', () => {
            win_login.show();
        });
    });
}

function createRegisterWindow() {
    var conf = {
        width: 600,
        height: 380,
        //resizable: false,
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

    let viewpath = path.resolve(__dirname, '../../../public/cloud/register.html');
    win_login.loadFile(viewpath);

    win_login.on('closed', () => {
        win_login = null;
    });

    win_login.on('ready-to-show', () => {
        ipc.once('login-window-ready', () => {
            win_login.show();
        });
    });
}

ipc.on('height-change', (sender, data)=>{
    if (win_login != null){
        win_login.setSize(widget.getSize()[0], data);
    }
});

ipc.on('change-to-login',(sender,data)=>{
    if (typeof data != 'undefined'){
        this.changeToLogin();
        win_login.webContents.send('page-changed', data);
    }
});

ipc.on('reloadLoginWindow', () => {
    if (win_login != null) {
        win_login.reload();
    }
});

const loginWindow = {
    createLoginWindow: () => {
        if (win_login != null) {
            if (win_login.isMinimized()) {
                win_login.restore();
            }
            win_login.focus();
            if (status != 'login') {
                let viewpath = path.resolve(__dirname, '../../../public/cloud/login.html');
                win_login.loadFile(viewpath);
                win_login.setSize(widget.getSize()[0], 320);
            }
        } else {
            createLoginWindow();
            status = 'login';
        }
    },
    createRegisterWindow: () => {
        if (win_login != null) {
            if (win_login.isMinimized()) {
                win_login.restore();
            }
            win_login.focus();
            if (status != 'register') {
                let viewpath = path.resolve(__dirname, '../../../public/cloud/register.html');
                win_login.loadFile(viewpath);
                win_login.setSize(widget.getSize()[0], 380);
            }
        } else {
            createRegisterWindow();
            status = 'register';
        }
    },
    changeToLogin: ()=>{
        if (status == 'register') {
            let viewpath = path.resolve(__dirname, '../../../public/cloud/register.html');
            win_login.loadFile(viewpath);
            win_login.setSize(widget.getSize()[0], 320);
        } else {
            if (win_login.isMinimized()) {
                win_login.restore();
            }
            win_login.focus();
        }
    },
    changeToRegister: () => {
        if (status == 'login') {
            let viewpath = path.resolve(__dirname, '../../../public/cloud/register.html');
            win_login.loadFile(viewpath);
            win_login.setSize(widget.getSize()[0], 380);
        } else {
            if (win_login.isMinimized()) {
                win_login.restore();
            }
            win_login.focus();
        }
    }
};

module.exports = loginWindow;
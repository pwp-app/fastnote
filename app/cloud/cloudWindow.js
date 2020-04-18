let win_login = null;
let status = null;

const {
    BrowserWindow
} = require('electron');

// ipc主进程
const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

// consts
const loginWindowHeight = 320;
const registerWindowHeight = 480;

function createLoginWindow() {
    var conf = {
        width: 600,
        height: loginWindowHeight,
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

    let viewpath = global.hotfix.buildPath('cloud/login.html');
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
        height: registerWindowHeight,
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

    let viewpath = global.hotfix.buildPath('cloud/register.html');
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
        win_login.setSize(win_login.getSize()[0], data);
    }
});

ipc.on('switch-to-register', (sender, data)=>{
    loginWindow.switchToRegister();
});

ipc.on('switch-to-login',(sender,data)=>{
    if (typeof data != 'undefined'){
        loginWindow.switchToLogin();
        win_login.webContents.send('page-changed', data);
    }
});

ipc.on('reloadLoginWindow', () => {
    if (win_login != null) {
        win_login.reload();
    }
});

const cloudWindow = {
    createLoginWindow: () => {
        if (win_login != null) {
            if (win_login.isMinimized()) {
                win_login.restore();
            }
            win_login.focus();
            if (status != 'login') {
                let viewpath = global.hotfix.buildPath('cloud/login.html');
                win_login.loadFile(viewpath);
                win_login.setSize(win_login.getSize()[0], loginWindowHeight);
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
                let viewpath = global.hotfix.buildPath('cloud/register.html');
                win_login.loadFile(viewpath);
                win_login.setSize(win_login.getSize()[0], registerWindowHeight);
            }
        } else {
            createRegisterWindow();
            status = 'register';
        }
    },
    switchToLogin: ()=>{
        if (status == 'register') {
            let viewpath = global.hotfix.buildPath('cloud/register.html');
            win_login.loadFile(viewpath);
            win_login.setSize(win_login.getSize()[0], loginWindowHeight);
        } else {
            if (win_login.isMinimized()) {
                win_login.restore();
            }
            win_login.focus();
        }
    },
    switchToRegister: () => {
        if (status == 'login') {
            let viewpath = path.resolve(__dirname, '../../../public/cloud/register.html');
            win_login.loadFile(viewpath);
            win_login.setSize(win_login.getSize()[0], registerWindowHeight);
        } else {
            if (win_login.isMinimized()) {
                win_login.restore();
            }
            win_login.focus();
        }
    }
};

module.exports = cloudWindow;
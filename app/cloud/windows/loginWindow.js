let win_login = null;

const {
    BrowserWindow
} = require('electron');

//ipc主进程
const ipc = require('electron').ipcMain;

const app = require('electron').app;
const path = require('path');

function createLoginWindow(){
    
}

const loginWindow = {
    createWindow: createLoginWindow()
};

module.exports = loginWindow;
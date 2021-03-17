let win_login = null;
let status = null;

const { BrowserWindow } = require('electron');

// ipc主进程
const ipc = require('electron').ipcMain;
const path = require('path');

// consts
const loginWindowSize = {
  w: 600,
  h: 324,
};
const registerWindowSize = {
  w: 640,
  h: 526,
};

function createLoginWindow() {
  let conf = {
    width: loginWindowSize.w,
    height: loginWindowSize.h,
    resizable: false,
    maximazable: false,
    show: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  };
  //标题栏的选用
  if (process.platform == 'darwin') conf.titleBarStyle = 'hiddenInset';
  else conf.frame = false;

  win_login = new BrowserWindow(conf);

  let viewpath;
  if (global.hotfix && global.hotfix.state !== 'close') {
    viewpath = global.hotfix.buildPath('cloudLogin.html');
  } else {
    viewpath = path.resolve(__dirname, '../../public/cloudLogin.html');
  }
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
  let conf = {
    width: registerWindowSize.w,
    height: registerWindowSize.h,
    resizable: false,
    maximazable: false,
    show: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  };
  //标题栏的选用
  if (process.platform == 'darwin') conf.titleBarStyle = 'hiddenInset';
  else conf.frame = false;

  win_login = new BrowserWindow(conf);

  let viewpath = global.hotfix.buildPath('cloudRegister.html');
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

ipc.on('height-change', (sender, data) => {
  if (win_login) {
    win_login.setSize(win_login.getSize()[0], data);
  }
});

ipc.on('switch-to-register', (sender, data) => {
  cloudWindow.switchToRegister();
  win_login.webContents.send('page-changed');
});

ipc.on('switch-to-login', (sender, data) => {
  if (data) {
    cloudWindow.switchToLogin(data);
  }
});

ipc.on('cloud-login-need-captcha', () => {
  win_login.setSize(loginWindowSize.w, loginWindowSize.h + 52);
});

ipc.on('reloadLoginWindow', () => {
  if (win_login) {
    win_login.reload();
  }
});

const cloudWindow = {
  createLoginWindow: () => {
    if (win_login) {
      if (win_login.isMinimized()) {
        win_login.restore();
      }
      win_login.focus();
      if (status != 'login') {
        let viewpath = global.hotfix.buildPath('cloudLogin.html');
        win_login.loadFile(viewpath);
        win_login.setSize(loginWindowSize.w, loginWindowSize.h);
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
      if (status !== 'register') {
        let viewpath = global.hotfix.buildPath('cloudRegister.html');
        win_login.loadFile(viewpath);
        win_login.setSize(registerWindowSize.w, registerWindowSize.h);
      }
    } else {
      createRegisterWindow();
      status = 'register';
    }
  },
  switchToLogin: (data) => {
    if (status === 'register') {
      let viewpath = global.hotfix.buildPath('cloudLogin.html');
      win_login.loadFile(viewpath);
      win_login.setSize(loginWindowSize.w, loginWindowSize.h);
    } else {
      if (win_login.isMinimized()) {
        win_login.restore();
      }
      win_login.focus();
    }
    if (data) {
      setTimeout(() => {
        win_login.webContents.send('page-changed', data);
      }, 500);
    }
  },
  switchToRegister: () => {
    if (status === 'login') {
      let viewpath = global.hotfix.buildPath('cloudRegister.html');
      win_login.loadFile(viewpath);
      win_login.setSize(registerWindowSize.w, registerWindowSize.h);
    } else {
      if (win_login.isMinimized()) {
        win_login.restore();
      }
      win_login.focus();
    }
  },
};

module.exports = cloudWindow;

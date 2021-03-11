let win_settings = null;

const { BrowserWindow } = require('electron');

const ipc = require('electron').ipcMain;
const path = require('path');

function createSettingsWindow() {
  let conf = {
    width: 680,
    height: 592,
    resizable: false,
    maximazable: false,
    useContentSize: true,
    show: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  };
  //标题栏的选用
  if (process.platform == 'darwin') conf.titleBarStyle = 'hiddenInset';
  else conf.frame = false;

  win_settings = new BrowserWindow(conf);

  let viewpath;
  if (global.hotfix && global.hotfix.state !== 'close') {
    viewpath = global.hotfix.buildPath('settings.html');
  } else {
    viewpath = path.resolve(__dirname, '../public/settings.html');
  }
  win_settings.loadFile(viewpath);

  ipc.on('settings-window-heightChange', function (sender, height) {
    win_settings.setContentSize(680, height);
  });

  win_settings.on('closed', () => {
    win_settings = null;
  });

  win_settings.on('ready-to-show', () => {
    ipc.on('settings-window-ready', () => {
      win_settings.show();
    });
  });
}

ipc.on('reloadSettingsWindow', function (sender, data) {
  win_settings.reload();
});

const settingsWindow = {
  show: () => {
    if (win_settings) {
      if (win_settings.isMinimized()) {
        win_settings.restore();
      }
      win_settings.focus();
    } else {
      createSettingsWindow();
    }
  },
  get: () => {
    return win_settings;
  },
  getFocus: () => {
    if (win_settings) {
      if (win_settings.isMinimized()) {
        win_settings.restore();
      }
      win_settings.focus();
    }
  },
};

module.exports = settingsWindow;

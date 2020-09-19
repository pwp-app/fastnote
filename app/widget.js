let widgets = [];
let widgets_noteid = [];

const { BrowserWindow } = require('electron');

const electron = require('electron');
const ipc = require('electron').ipcMain;
const path = require('path');

// 获得目标高度的算法
function merge(intervals) {
    if (intervals.length == 0) {
        return intervals;
    }
    intervals.sort((a, b) => a[0] - b[0]);
    let res = [];
    res.push(
        intervals.reduce((acc, cur) => {
            if (acc[1] >= cur[0]) {
                if (acc[1] < cur[1]) {
                    acc[1] = cur[1];
                }
                return acc;
            } else {
                res.push(acc);
                return cur;
            }
        })
    );
    return res;
}

function getTarget(screenWidth, screenHeight, x_limit) {
    // 极端情况，堆不下了
    if (screenWidth - x_limit < 478) {
        return [0, 18];
    }
    let ranges = [];
    for (let widget of widgets) {
        const bounds = widget.getBounds();
        if (bounds.x < screenWidth - x_limit - 478 || bounds.x > screenWidth - x_limit - 18) {
            continue;
        }
        const start = bounds.y;
        const end = bounds.y + bounds.height;
        ranges.push([start, end]);
    }
    if (ranges.length < 1) {
        return [x_limit, 18];
    }
    // 对ranges进行合并
    ranges = merge(ranges);
    // 检查顶部有没有空隙
    if (ranges[0][0] > 300) {
        return [x_limit, 18];
    }
    // 检查中间有没有空隙
    for (let i = 0; i < ranges.length - 1; i++) {
        if (ranges[i+1][0] - ranges[i][1] > 380) {
            return [x_limit, ranges[i][1] + 8];
        }
    }
    // 检查底部有没有空隙
    if (ranges[ranges.length - 1][1] < screenHeight - 318) {
        return [x_limit, ranges[ranges.length - 1][1] + 18];
    }
    return getTarget(screenWidth, screenHeight, x_limit + 468);
}

function createWidget(data) {
    const screenSize = electron.screen.getPrimaryDisplay().size;
    const screenWidth = screenSize.width;
    const screenHeight = screenSize.height;

    const target = getTarget(screenWidth, screenHeight, 0);

    const conf = {
        x: screenWidth - target[0] - 478,
        y: target[1],
        width: 460,
        height: 280,
        minWidth: 320,
        minHeight: 86,
        show: false,
        resizable: true,
        transparent: true,
        skipTaskbar: true,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
        },
    };
    if (process.platform == 'darwin') conf.titleBarStyle = 'hiddenInset';
    else conf.frame = false;

    let widget = new BrowserWindow(conf);
    widgets.push(widget);
    widgets_noteid.push(data.note.id);

    let viewpath;
    if (global.hotfix && global.hotfix.state !== 'close') {
        viewpath = global.hotfix.buildPath('desktopWidget.html');
    } else {
        viewpath = path.resolve(__dirname, '../public/desktopWidget.html');
    }
    widget.loadFile(viewpath);

    widget.on('closed', () => {
        const index = widgets.indexOf(widget);
        widgets.splice(index, 1);
        widgets_noteid.splice(index, 1);
        widget = null;
    });

    widget.on('ready-to-show', () => {
        ipc.once('widget-window-ready', () => {
            widget.show();
        });
        ipc.once('widget-heightChange', (sender, height) => {
            widget.setSize(widget.getSize()[0], height);
        });
        ipc.once('widget-setMaxHeight', (sender, height) => {
            widget.setMaximumSize(screenWidth, height);
        });
        widget.webContents.send('init', data.note);
    });
}

ipc.on('reloadAllWidgets', () => {
    for (let i = 0; i < widgets.length; i++) {
        if (typeof widgets[i] != 'undefined' && widgets[i] != null) {
            widgets[i].webContents.send('readyToReload');
        }
    }
});

ipc.on('widget-reload-ready', (e, data) => {
    e.sender.reload();
    e.sender.once('did-finish-load', () => {
        e.sender.send('init', data);
    });
});

ipc.on('closeAllWidgets', () => {
    for (let i = 0; i < widgets.length; i++) {
        if (typeof widgets[i] != 'undefined' && widgets[i] != null) {
            widgets[i].close();
        }
    }
    widgets = [];
    widgets_noteid = [];
});

const DesktopWidget = {
    getWindows: () => {
        return widgets;
    },
    getNoteIds: () => {
        return widgets_noteid;
    },
    create: (data) => {
        let index = widgets_noteid.indexOf(data.note.id);
        if (index != -1) {
            widgets[index].focus();
        } else {
            createWidget(data);
        }
    },
    updateEditNote: (data) => {
        let note = data.note;
        let index = widgets_noteid.indexOf(note.id);
        if (index >= 0) {
            if (typeof widgets[index] != 'undefined' && widgets[index] != null) {
                widgets[index].webContents.send('update-edit-note', data.note);
            }
        }
    },
};

module.exports = DesktopWidget;

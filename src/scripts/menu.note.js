var menu_note_template = [{
        label: '排序方式',
        submenu: [{
                id: 'cb_sort_id',
                label: 'ID',
                type: 'checkbox',
                click: function () {
                    sort_mode = 'id';
                    var sortModeJson = {
                        mode: sort_mode
                    };
                    storage.set('sortMode', sortModeJson);
                    refreshNoteList();
                }
            },
            {
                id: 'cb_sort_updateDate',
                label: '更新日期',
                type: 'checkbox',
                click: function () {
                    sort_mode = 'updateDate';
                    var sortModeJson = {
                        mode: sort_mode
                    };
                    storage.set('sortMode', sortModeJson);
                    refreshNoteList();
                }
            }
        ]
    },
    {
        type: 'separator'
    },
    {
        label: '复制',
        click: function () {
            for (var i = 0; i < notes.length; i++) {
                if (notes[i].id == noteid_clicked) {
                    copyToClipboard(notes[i].text.replace(/(\r\n)|(\n)/g,"\r"), {
                        success: function () {
                            displayInfobar('success', '内容已复制到剪贴板');
                        },
                        error: function () {
                            displayInfobar('success', '复制内容时出现错误');
                        }
                    });
                    return;
                }
            }
            noteid_clicked = -1;
        }
    },
    {
        label: '编辑',
        click: function () {
            for (var i = 0; i < notes.length; i++) {
                if (notes[i].id == noteid_clicked) {
                    var rawtext;
                    if ($('#note_'+noteid_clicked+' .note-content .note-password').length>0){
                        rawtext = $('#note_'+noteid_clicked).attr('data-decrypted');
                    }
                    ipcRenderer.send("openEditWindow", {
                        note: notes[i],
                        rawtext: rawtext
                    });
                    return;
                }
            }
            noteid_clicked = -1;
        }
    },
    {
        label: '删除',
        click: function () {
            putToRecyclebin(noteid_clicked);
            noteid_clicked = -1;
        }
    }
];

var menu_note_hasPassword_template = [{
        label: '排序方式',
        submenu: [{
                id: 'cb_sort_id',
                label: 'ID',
                type: 'checkbox',
                click: function () {
                    sort_mode = 'id';
                    var sortModeJson = {
                        mode: sort_mode
                    };
                    storage.set('sortMode', sortModeJson);
                    refreshNoteList();
                }
            },
            {
                id: 'cb_sort_updateDate',
                label: '更新日期',
                type: 'checkbox',
                click: function () {
                    sort_mode = 'updateDate';
                    var sortModeJson = {
                        mode: sort_mode
                    };
                    storage.set('sortMode', sortModeJson);
                    refreshNoteList();
                }
            },
        ]
    },
    {
        type: 'separator'
    },
    {
        label: '取消加密',
        click: function () {
            let password = $('#note_password_'+noteid_clicked).attr('data-password');
            ipcRenderer.send('openDecryptionWindow', {
                id: noteid_clicked,
                password: password
            });
        }
    },
];

function popup_menu_note(isForceTop, hasPassword) {
    var menu_note;
    //如果是加密便签，则不显示复制
    if (!hasPassword) {
        menu_note = Menu.buildFromTemplate(menu_note_template);
        if (isForceTop) {
            //当前便签是置顶
            menu_note.insert(3, new MenuItem({
                label: '取消置顶',
                click: function () {
                    operateForceTopNote(noteid_clicked, false);
                }
            }));
        } else {
            menu_note.insert(3, new MenuItem({
                label: '置顶',
                click: function () {
                    operateForceTopNote(noteid_clicked, true);
                }
            }));
        }
    } else {
        menu_note = Menu.buildFromTemplate(menu_note_hasPassword_template);
        if (isForceTop) {
            //当前便签是置顶
            menu_note.append(new MenuItem({
                label: '取消置顶',
                click: function () {
                    operateForceTopNote(noteid_clicked, false);
                }
            }));
        } else {
            menu_note.append(new MenuItem({
                label: '置顶',
                click: function () {
                    operateForceTopNote(noteid_clicked, true);
                }
            }));
        }
    }
    //设置排序选项
    var sortMenuItem;
    switch (sort_mode) {
        case 'id':
            sortMenuItem = menu_note.getMenuItemById('cb_sort_id');
            sortMenuItem.checked = true;
            break;
        case 'updateDate':
            sortMenuItem = menu_note.getMenuItemById('cb_sort_updateDate');
            sortMenuItem.checked = true;
            break;
    }
    menu_note.on('menu-will-close', (event, args) => {
        $('.note-wrapper').removeClass('note-selected');
    });
    menu_note.popup(remote.getCurrentWindow());
}

//多选状态
var menu_note_multiSelected_template = [
    {
        type: 'separator'
    },
    {
        label: '取消',
        click: function () {
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    }
];

function popup_menu_note_multiSelected(hasForceTop, hasNotForceTop) {
    var menu_note_multiSelected = Menu.buildFromTemplate(menu_note_multiSelected_template);
    menu_note_multiSelected.on('menu-will-close', (event, args) => {
        $('.note-wrapper').removeClass('note-selected');
        if (selectModeEnabled) {
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    });
    if (!(notes_selected.length<1 && notes_selected_withencrypted.length>0)){
        menu_note_multiSelected.insert(0, new MenuItem({
            label: '删除选中',
            click: function () {
                $('.note-wrapper').removeClass('note-selected');
                selectModeEnabled = false;
                $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                    $('.toast-multiselected').removeClass('toast-active');
                });
                putNotesToRecyclebin(notes_selected, function (res) {
                    if (res) {
                        displayInfobar('success', '便签已放入回收站');
                    } else {
                        displayInfobar('error', '将便签放入回收站时出现错误');
                    }
                });
            }
        }));
        menu_note_multiSelected.insert(1, new MenuItem({
            label: '编辑选中',
            click: function () {
                $('.note-wrapper').removeClass('note-selected');
                selectModeEnabled = false;
                $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                    $('.toast-multiselected').removeClass('toast-active');
                });
                try {
                    for (var i = 0; i < notes_selected.length; i++) {
                        for (var j = 0; j < notes.length; j++) {
                            if (notes[j].id == notes_selected[i]) {
                                var rawtext;
                                if ($('#note_'+notes_selected[i]+' .note-content .note-password').length>0){
                                    rawtext = $('#note_'+notes_selected[i]).attr('data-decrypted');
                                }
                                ipcRenderer.send("openEditWindow", {
                                    note: notes[j],
                                    rawtext: rawtext
                                });
                                break;
                            }
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        }));
    }
    //存在置顶便签，插入取消置顶项，反之插入置顶选中
    if (hasForceTop) {
        menu_note_multiSelected.insert(0, new MenuItem({
            label: '取消置顶',
            click: function () {
                operateForceTopNotes(notes_selected_withencrypted, false);
            }
        }));
    }
    if (hasNotForceTop) {
        menu_note_multiSelected.insert(1, new MenuItem({
            label: '置顶选中',
            click: function () {
                operateForceTopNotes(notes_selected_withencrypted, true);
            }
        }));
    }
    menu_note_multiSelected.popup(remote.getCurrentWindow());
}
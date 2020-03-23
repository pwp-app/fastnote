function popup_menu_recyclebin() {
    var menu_recyclebin = new Menu();
    menu_recyclebin.append(new MenuItem({
        label: i18n[current_i18n].sortby,
        submenu: [{
                id: 'cb_sort_id',
                label: 'ID',
                type: 'checkbox',
                click: function () {
                    sort_mode = 'id';
                    var sortModeJson = {
                        mode: sort_mode
                    };
                    storage.set('sortMode_recyclebin', sortModeJson);
                    refreshNoteList();
                }
            },
            {
                id: 'cb_sort_updateDate',
                label: i18n[current_i18n].updatetime,
                type: 'checkbox',
                click: function () {
                    sort_mode = 'updateDate';
                    var sortModeJson = {
                        mode: sort_mode
                    };
                    storage.set('sortMode_recyclebin', sortModeJson);
                    refreshNoteList();
                }
            }
        ]
    }));
    menu_recyclebin.append(new MenuItem({
        type: 'separator'
    }));
    menu_recyclebin.append(new MenuItem({
        label: i18n[current_i18n].restore,
        click: function () {
            restoreNote(noteid_clicked);
            noteid_clicked = -1;
        }
    }));
    menu_recyclebin.append(new MenuItem({
        label: i18n[current_i18n].delete_completely,
        click: function () {
            deleteNote(noteid_clicked);
            noteid_clicked = -1;
        }
    }));
    menu_recyclebin.append(new MenuItem({
        label: i18n[current_i18n].empty_recyclebin,
        click: function () {
            dialog.showMessageBox({
                type: "warning",
                buttons: [i18n[current_i18n].button_no, i18n[current_i18n].button_yes],
                defaultId: 0,
                title: i18n[current_i18n].confirm_operation,
                message: i18n[current_i18n].empty_recyclebin_message,
                detail: i18n[current_i18n].empty_recyclebin_detail
            }).then(res => {
                if (res.response == 1) {
                    for (var i = 0; i < notes.length; i++) {
                        deleteNoteByObj(notes[i], false);
                    }
                    displayInfobar('success', i18n[current_i18n].empty_recyclebin_success);
                }
                noteid_clicked = -1;
            });
        }
    }));

    menu_recyclebin.on('menu-will-close', (event, args) => {
        $('#note_' + noteid_clicked).parent().removeClass('note-selected');
    });
    var sortMenuItem;
    switch (sort_mode) {
        case 'id':
            sortMenuItem = menu_recyclebin.getMenuItemById('cb_sort_id');
            sortMenuItem.checked = true;
            break;
        case 'updateDate':
            sortMenuItem = menu_recyclebin.getMenuItemById('cb_sort_updateDate');
            sortMenuItem.checked = true;
            break;
    }
    menu_recyclebin.popup(remote.getCurrentWindow());
}

function popup_menu_recyclebin_multiSelected() {
    var menu_recyclebin_multiselected = new Menu();
    menu_recyclebin_multiselected.append(new MenuItem({
        label: i18n[current_i18n].restore_all,
        click: function () {
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                $('.toast-multiselected').removeClass('toast-active');
            });
            restoreNotes(notes_selected, function (res) {
                if (res) {
                    displayInfobar('success', i18n[current_i18n].restore_notes_success);
                } else {
                    displayInfobar('error', i18n[current_i18n].restore_notes_error);
                }
            });
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    }));
    menu_recyclebin_multiselected.append(new MenuItem({
        label: i18n[current_i18n].delete_all,
        click: function () {
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                $('.toast-multiselected').removeClass('toast-active');
            });
            deleteNotes(notes_selected, function (res) {
                if (res) {
                    displayInfobar('success', i18n[current_i18n].delete_all_success);
                } else {
                    displayInfobar('error', i18n[current_i18n].delete_all_error);
                }
            });
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    }));
    menu_recyclebin_multiselected.append(new MenuItem({
        label: i18n[current_i18n].select_all,
        click: function () {
            selectModeEnabled = true;
            notes_selected = [];
            notes.forEach(note => {
                notes_selected.push(note.id);
            });
            $('.note-wrapper').addClass('note-selected');
            $('#toast-multiselected-text').html(i18n[current_i18n].selected_left + notes_selected.length + i18n[current_i18n].selected_right);
        }
    }));
    menu_recyclebin_multiselected.append(new MenuItem({
        label: i18n[current_i18n].cancel,
        click: function () {
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster', function () {
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    }));

    menu_recyclebin_multiselected.popup(remote.getCurrentWindow());
}
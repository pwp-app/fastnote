var menu_recyclebin_template = [
    {
        label: '排序方式',
        submenu: [
            {
                id: 'cb_sort_id',
                label: 'ID',
                type: 'checkbox',
                click: function(){
                    sort_mode = 'id';
                    var sortModeJson = {
                        mode:sort_mode
                    };
                    storage.set('sortMode_recyclebin',sortModeJson);
                    refreshNoteList();
                }
            },
            {
                id: 'cb_sort_updateDate',
                label: '更新日期',
                type: 'checkbox',
                click: function(){
                    sort_mode = 'updateDate';
                    var sortModeJson = {
                        mode:sort_mode
                    };
                    storage.set('sortMode_recyclebin',sortModeJson);
                    refreshNoteList();
                }
            }
        ]
    },
    {
        type: 'separator'
    },
    {
        label: '还原',
        click: function () {
            restoreNote(noteid_clicked);
            noteid_clicked = -1;
        }
    },
    {
        label: '彻底删除',
        click: function () {
            deleteNote(noteid_clicked);
            noteid_clicked = -1;
        }
    },
];

function popup_menu_recyclebin(){
    var menu_recyclebin = Menu.buildFromTemplate(menu_recyclebin_template);
    menu_recyclebin.on('menu-will-close',(event,args)=>{
        $('#note_' + noteid_clicked).parent().removeClass('note-selected');
    });
    var sortMenuItem;
    switch(sort_mode){
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

var menu_recyclebin_multiSelected_template = [
    {
        label: '全部还原',
        click: function(){
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
                $('.toast-multiselected').removeClass('toast-active');
            });
            restoreNotes(notes_selected, function(res){
                if(res){
                    displayInfobar('success', '便签均已还原');
                } else {
                    displayInfobar('error', '还原便签时出现错误');
                }
            });
        }
    },
    {
        label: '全部彻底删除',
        click: function(){
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
                $('.toast-multiselected').removeClass('toast-active');
            });
            deleteNotes(notes_selected,function(res){
                if(res){
                    displayInfobar('success', '便签均已删除');
                } else {
                    displayInfobar('error', '删除便签时出现错误');
                }
            });
        }
    },
    {
        label: '取消',
        click: function(){
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    }
];

function popup_menu_recyclebin_multiSelected(){
    var menu_recyclebin_multiselected = Menu.buildFromTemplate(menu_recyclebin_multiSelected_template);
    menu_recyclebin_multiselected.on('menu-will-close', (event, args) => {
        $('.note-wrapper').removeClass('note-selected');
        if (selectModeEnabled){
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    });
    menu_recyclebin_multiselected.popup(remote.getCurrentWindow());
}
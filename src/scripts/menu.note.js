var menu_note_template = [
    {
        label: '复制',
        click: function () {
            for (var i = 0; i < notes.length; i++) {
                if (notes[i].id == noteid_clicked) {
                    var note = notes[i];
                    note.text = note.text.replace(/(<br\/>)/gi, "\r");
                    copyToClipboard(note.text, {
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
                    var note = notes[i];
                    note.text = note.text.replace(/<br\/>/g, "\n")
                    ipcRenderer.send("openEditWindow", notes[i]);
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

function popup_menu_note(isForceTop){
    var menu_note = Menu.buildFromTemplate(menu_note_template);
    if (isForceTop){
        //当前便签是置顶
        menu_note.insert(1, new MenuItem({
            label: '取消置顶',
            click: function(){

            }
        }));
    } else {
        menu_note.insert(1, new MenuItem({
            label: '置顶',
            click: function(){

            }
        }));
    }
    menu_note.on('menu-will-close',(event, args)=>{
        $('.note-wrapper').removeClass('note-selected');
    });
    menu_note.popup(remote.getCurrentWindow());
}

//多选状态
var menu_note_multiSelected_template = [
    {
        label: '删除选中',
        click: function () {
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
                $('.toast-multiselected').removeClass('toast-active');
            });
            putNotesToRecyclebin(notes_selected, function (res) {
                if (res){
                    displayInfobar('success', '选中的便签均已放入回收站');
                } else {
                    displayInfobar('error', '将便签放入回收站时出现错误');
                }
            });
        }
    },{
        label: '编辑选中',
        click: function () {
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
                $('.toast-multiselected').removeClass('toast-active');
            });
            try{
                for (var i=0;i<notes_selected.length;i++){
                    for (var j = 0; j < notes.length; j++) {
                        if (notes[j].id == notes_selected[i]) {
                            var note = notes[j];
                            note.text = note.text.replace(/<br\/>/g, "\n")
                            ipcRenderer.send("openEditWindow", notes[j]);
                            continue;
                        }
                    }
                }
            } catch (err){
                console.log(err);
            }
        }
    },
    {
        type:'separator'
    },
    {
        label: '取消',
        click: function () {
            $('.note-wrapper').removeClass('note-selected');
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    }
];

function popup_menu_note_multiSelected(isForceTop){
    var menu_note_multiSelected = Menu.buildFromTemplate(menu_note_multiSelected_template);
    menu_note_multiSelected.on('menu-will-close', (event, args) => {
        $('.note-wrapper').removeClass('note-selected');
        if (selectModeEnabled){
            selectModeEnabled = false;
            $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
                $('.toast-multiselected').removeClass('toast-active');
            });
        }
    });
    menu_note_multiSelected.popup(remote.getCurrentWindow());
}

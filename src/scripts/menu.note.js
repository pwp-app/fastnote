let menu_note = new Menu();
menu_note.append(new MenuItem({
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
}));
menu_note.append(new MenuItem({
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
}));
menu_note.append(new MenuItem({
    label: '删除',
    click: function () {
        putToRecyclebin(noteid_clicked);
        noteid_clicked = -1;
    }
}));
menu_note.on('menu-will-close',(event, args)=>{
    $('#note_' + noteid_clicked).parent().removeClass('note-selected');
});

//多选状态
let menu_note_multiSelected = new Menu();
menu_note_multiSelected.append(new MenuItem({
    label: '删除',
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
}));
menu_note_multiSelected.append(new MenuItem({
    label: '取消',
    click: function () {
        $('.note-wrapper').removeClass('note-selected');
        selectModeEnabled = false;
        $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
            $('.toast-multiselected').removeClass('toast-active');
        });
    }
}));
menu_note_multiSelected.on('menu-will-close', (event, args) => {
    $('.note-wrapper').removeClass('note-selected');
    selectModeEnabled = false;
    $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
        $('.toast-multiselected').removeClass('toast-active');
    });
});
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
menu_note.on('menu-will-close',(event,args)=>{
    $('#note_' + noteid_clicked).parent().removeClass('note-selected');
});
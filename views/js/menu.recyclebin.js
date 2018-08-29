let menu_recyclebin = new Menu();
menu_recyclebin.append(new MenuItem({
    label: '还原',
    click: function () {
        restoreNote(noteid_clicked);
        noteid_clicked = -1;
    }
}));
menu_recyclebin.append(new MenuItem({
    label: '彻底删除',
    click: function () {
        deleteNote(noteid_clicked);
        noteid_clicked = -1;
    }
}));
menu_recyclebin.on('menu-will-close',(event,args)=>{
    $('#note_' + noteid_clicked).parent().removeClass('note-selected');
});
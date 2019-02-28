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

let menu_recyclebin_multiselected = new Menu();
menu_recyclebin_multiselected.append(new MenuItem({
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
}));
menu_recyclebin_multiselected.append(new MenuItem({
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
}));
menu_recyclebin_multiselected.append(new MenuItem({
    label: '取消',
    click: function(){
        $('.note-wrapper').removeClass('note-selected');
        selectModeEnabled = false;
        $('.toast-multiselected').animateCss('fadeOutRight faster',function(){
            $('.toast-multiselected').removeClass('toast-active');
        });
    }
}));
var menu_textarea_selected_template = [
    {
        label: '复制',
        role: 'copy'
    },
    {
        label: '剪切',
        role: 'cut'
    },
    {
        label: '粘贴',
        role: 'paste'
    }
];
function popup_menu_textarea_selected(){
    var menu_textarea_selected = Menu.buildFromTemplate(menu_textarea_selected_template);
    menu_textarea_selected.popup(remote.getCurrentWindow());
}

var menu_textarea_empty_template = [
    {
        label: '粘贴',
        role: 'paste'
    }
];
function popup_menu_textarea_empty(){
    var menu_textarea_empty = Menu.buildFromTemplate(menu_textarea_empty_template);
    menu_textarea_empty.popup(remote.getCurrentWindow());
}


var menu_textarea_template = [
    {
        label: '粘贴',
        role: 'paste'
    },
    {
        label: '全选',
        role: 'selectAll'
    }
];
function popup_menu_textarea(){
    var menu_textarea = Menu.buildFromTemplate(menu_textarea_template);
    menu_textarea.popup(remote.getCurrentWindow());
}
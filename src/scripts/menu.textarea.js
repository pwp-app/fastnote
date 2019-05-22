function popup_menu_textarea_selected(){
    var menu_textarea_selected = new Menu();
    menu_textarea_selected.append(new MenuItem({
        label: i18n[current_i18n]['copy'],
        role: 'copy'
    }));
    menu_textarea_selected.append(new MenuItem({
        label: i18n[current_i18n]['cut'],
        role: 'cut'
    }));
    menu_textarea_selected.append(new MenuItem({
        label: i18n[current_i18n]['paste'],
        role: 'paste'
    }));
    menu_textarea_selected.popup(remote.getCurrentWindow());
}

function popup_menu_textarea_empty(){
    var menu_textarea_empty = new Menu();
    menu_textarea_empty.append(new MenuItem({
        label: i18n[current_i18n]['paste'],
        role: 'paste'
    }));
    menu_textarea_empty.popup(remote.getCurrentWindow());
}

function popup_menu_textarea(){
    var menu_textarea = new Menu();
    menu_textarea.append(new MenuItem({
        label: i18n[current_i18n]['paste'],
        role: 'paste'
    }));
    menu_textarea.append(new MenuItem({
        label: i18n[current_i18n]['select_all'],
        role: 'selectAll'
    }));
    menu_textarea.popup(remote.getCurrentWindow());
}
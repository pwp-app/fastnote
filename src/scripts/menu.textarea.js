let menu_textarea_selected = new Menu();
menu_textarea_selected.append(new MenuItem({
    label: '复制',
    role: 'copy'
}));
menu_textarea_selected.append(new MenuItem({
    label: '剪切',
    role: 'cut'
}));
menu_textarea_selected.append(new MenuItem({
    label: '粘贴',
    role: 'paste'
}));

let menu_textarea_empty = new Menu();
menu_textarea_empty.append(new MenuItem({
    label: '粘贴',
    role: 'paste'
}));

let menu_textarea = new Menu();
menu_textarea.append(new MenuItem({
    label: '粘贴',
    role: 'paste'
}));
menu_textarea.append(new MenuItem({
    label: '全选',
    role: 'selectAll'
}));
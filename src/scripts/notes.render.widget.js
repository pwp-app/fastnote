var reg = require('./static/notes.render.reg');

marked.setOptions({
    renderer: new marked.Renderer(),
    headerIds: false,
    pedantic: false,
    tables: false,
    gfm: true,
    breaks: true,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    xhtml: false,
    silent: true,
});

function renderNoteForWidget(note) {
    let html = '<div class="widget-note-content note-text">';
    let text;
    if (note.markdown) {
        text = marked(note.text);
    } else {
        text = $('#filter-x').text(note.text).html().replace(/ /g, '&nbsp;');
        text = '<p>' + text.replace(/\n/gi, '<br>');
    }
    text = insert_spacing(text, 0.15);
    if (!note.markdown) {
        html += text.replace(reg.url, function (result) {
            return '<a href="' + result + '">' + result + '</a>';
        });
    } else {
        html += text + '</p>';
    }
    html += '</div>';
    $('.widget-note').append(html);

    // do after render
    $(document).ready(() => {
        setTimeout(() => {
            let height = document.body.scrollHeight;
            if (height < 300) {
                ipcRenderer.send('widget-heightChange', height);
            } else {
                ipcRenderer.send('widget-heightChange', 300);
            }
            ipcRenderer.send('widget-setMaxHeight', height);
            $('.widget-note-content').css('height', 'calc(100vh - 59px)');
        }, 50);
    });
}

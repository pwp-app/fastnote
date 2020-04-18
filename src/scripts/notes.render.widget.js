var reg = require('./static/notes.render.reg');

function renderNoteForWidget(note){
    let html = '<div class="note-text"><p>';
    let text = $("#filter-x").text(note.text).html().replace(/ /g, '&nbsp;');
    if (typeof note.markdown != "undefined" && note.markdown){
        text = text.replace(reg.h5,'<noteh5>$1</noteh5>').replace(reg.h4,'<noteh4>$1</noteh4>').replace(reg.h3,'<noteh3>$1</noteh3>').replace(reg.h2,'<noteh2>$1</noteh2>').replace(reg.h1,'<noteh1>$1</noteh1>').replace(reg.hr,'\n</p><hr><p>')
            .replace(reg.strong, '<strong>$2</strong>').replace(reg.em, '<em>$2</em>').replace(reg.link, '<a href="$5">$2</a>');
    }
    text = text.replace(/\n/gi,'<br>');
    text = insert_spacing(text, 0.15);
    if (!note.markdown){
        html += text.replace(reg.url, function (result) {
            return '<a href="' + result + '">' + result + '</a>';
        });
    } else {
        html += text;
    }
    html += '</p></div>';
    $('.widget-note-content').append(html);
}
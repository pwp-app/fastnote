var mk_strong = /(\*\*)(.*)(\*\*)/gi;
var mk_em = /(\*)(.*)(\*)/gi;
var mk_link = /(\[)(.*)(\])(\()(.*)(\))/gi;
var mk_hr = /(\n\s*(-\s*){3,}\s*\n)|(\n\s*(\*\s*){3,}\s*\n)|(\n\s*(_\s*){3,}\s*\n)/gi;
var mk_h1 = /#&nbsp;(.+)/gi;
var mk_h2 = /##&nbsp;(.+)/gi;
var mk_h3 = /###&nbsp;(.+)/gi;
var mk_h4 = /####&nbsp;(.+)/gi;
var mk_h5 = /#####&nbsp;(.+)/gi;
var reg_url = /(?!(href="))(http|ftp|https|mailto):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/gi;

function renderNoteForWidget(note){
    let html = '<div class="note-text"><p>';
    let text = $("#filter-x").text(note.text).html().replace(/ /g, '&nbsp;');
    if (typeof note.markdown != "undefined" && note.markdown){
        text = text.replace(mk_h5,'<noteh5>$1</noteh5>').replace(mk_h4,'<noteh4>$1</noteh4>').replace(mk_h3,'<noteh3>$1</noteh3>').replace(mk_h2,'<noteh2>$1</noteh2>').replace(mk_h1,'<noteh1>$1</noteh1>').replace(mk_hr,'\n</p><hr><p>')
            .replace(mk_strong, '<strong>$2</strong>').replace(mk_em, '<em>$2</em>').replace(mk_link, '<a href="$5">$2</a>');
    }
    text = text.replace(/\n/gi,'<br>');
    text = insert_spacing(text, 0.15);
    if (!note.markdown){
        html += text.replace(reg_url, function (result) {
            return '<a href="' + result + '">' + result + '</a>';
        });
    } else {
        html += text;
    }
    html += '</p></div>';
    $('.widget-note-content').append(html);
}
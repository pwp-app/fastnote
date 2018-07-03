let textarea = $('#note-text');
let fs = require('fs');
let time = require('./tools/time.js');

if (!fs.existsSync('./notes/')){
    fs.mkdir('./notes/');
}

//绑定textarea的事件
textarea.keyup(function (e) {
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && e.keyCode == 13) {
        var text = textarea.val();
        if (text.trim() != null && text.trim()!="")
            saveNote(text.trim());
    }
});

//保存note为json
function saveNote(notetext) {
    var note = {
        time: time.getCurrentTime(),
        rawtime:time.getRawCurrentTime(),
        timezone: time.getTimeZone(),
        text: notetext
    }
    var json = JSON.stringify(note);
    fs.writeFile('./notes/' + time.getRawCurrentTime() + '.json', json, 'utf-8', function (err, data) {
        if (err) {
            console.log(data);
        } else {
            textarea.val('');
        }
    });
}
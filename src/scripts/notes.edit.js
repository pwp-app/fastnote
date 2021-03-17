var fs = require('fs');

// import storage location
const remote = require('electron').remote;
const app = remote.app;

var storagePath = app.getPath('userData');

var notesEdit = {
    // 保存编辑的Note
    saveEditNote: function (data, callback) {
        const note = data.note;
        const time = moment();
        const rawtime = time.format('YYYYMMDDHHmmss');
        // 保存路径
        let path;
        // 检查offset
        if (note.offset > 0) {
            path = storagePath + (inDebug ? '/devTemp' : '') + '/notes/' + note.rawtime + '.' + note.offset + '.json';
        } else {
            path = storagePath + (inDebug ? '/devTemp' : '') + '/notes/' + note.rawtime + '.json';
        }
        // replace char
        // set time
        note.updatetime = moment().format('YYYY年MM月DD日 HH:mm:ss');
        note.updaterawtime = rawtime;
        if (note.category === 'notalloc') {
            note.category = null;
        }
        // set needSync
        note.needSync = true;
        // get json
        const json = JSON.stringify(note);
        fs.writeFile(path, json, 'utf-8', function (err, data) {
            if (err) {
                displayInfobar('error', i18n[current_i18n]['edit_error']);
                return;
            }
        });
        // callback
        if (typeof callback === 'function') {
            callback(data);
        }
    },
};

module.exports = notesEdit;

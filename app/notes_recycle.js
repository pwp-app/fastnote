//删除note
function deleteNote(id) {
    notes.every(function (note, i) {
        if (note.id == id) {
            var path;
            //检查offset
            if (note.offset > 0) {
                path = storagePath + '/notes/' + note.rawtime + '.' + note.offset + '.json';
            } else {
                path = storagePath + '/notes/' + note.rawtime + '.json';
            }
            if (fs.existsSync(path)) {
                //删除文件
                fs.unlink(path, function (err) {
                    if (err) {
                        //文件删除失败
                        displayInfobar('error', '文件删除失败');
                        console.error(err);
                        readNoteFiles();
                    } else {
                        //删除成功
                        deleteNoteFromArr(id);
                        //动画
                        $('#note_' + id).animateCss('fadeOutLeft', function () {
                            $('#note_' + id).remove(); //动画结束后删除div
                            if (notes.length <= 0) {
                                showNoteEmpty_Anim();
                            }
                        })
                        displayInfobar('success', '删除成功');
                    }
                })
            } else {
                displayInfobar('error', '找不到文件，无法删除');
                readNoteFiles();
            }
            return false;
        } else {
            return true;
        }
    });
}
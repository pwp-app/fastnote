let fs = require('fs');

var storagePath = app.getPath('userData');

$('#btn-resetNotes').click(function(){
    dialog.showMessageBox({
        type:"warning",
        buttons:['取消','确认'],
        defaultId:0,
        title:'确认操作',
        message:'确定要重置便签吗？该操作将不可撤回。',
        detail:'所有已保存的便签、回收站内的便签将全部清除，重置后便签序号从0开始重新计算。'
    }, function(response){
        if (response == 1){
            storage.remove('notesid'+(global.indebug?'_dev':''), function(error){
                if (error){
                    console.error(error);
                    dialog.showMessageBox({
                        type:"error",
                        title:'错误',
                        message:'重置便签时遇到了错误。',
                        detail:error
                    });
                } else {
                    deleteall(storagePath  + (global.indebug?'/devTemp':'')+ '/notes');
                    //通知其他窗体重新载入
                    ipcRenderer.send('reloadMainWindow');
                    ipcRenderer.send('reloadRecycleWindow');
                    ipcRenderer.send('closeAllEditWindow');
                    reloadNotesId();
                    dialog.showMessageBox({
                        type:"info",
                        title:'完成',
                        message:'便签已完全重置。'
                    });
                }
            });
        }
    });
});

//删除目录、子目录、目录下的所有文件
function deleteall(path) {
	var files = [];
	if(fs.existsSync(path)) {
		files = fs.readdirSync(path);
		files.forEach(function(file, index) {
			var curPath = path + "/" + file;
			if(fs.statSync(curPath).isDirectory()) { // recurse
				deleteall(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}
var isBackupDialogOpened = false;

function backupNotes() {
    if (!isBackupDialogOpened) {
        isBackupDialogOpened = true;
        let filePath = dialog.showSaveDialogSync({
            title: "备份便签",
            defaultPath: "fastnote-backup-" + moment().format("YYYYMMDDHHmmss") + ".fnbak",
            buttonlabel: "保存备份",
            filters: [
                {
                    name: "Fastnote 备份",
                    extensions: ["fnbak"]
                }
            ]
        });
        // 拒绝空值
        if (!filePath || filePath.length < 0) {
            backupNotesErrorBox("请选择保存路径");
            return;
        }
        isBackupDialogOpened = false;
        //保存备份
        try {
            let t = _backupNotes(filePath);
            if (typeof t == "string") {
                //备份失败
                backupNotesErrorBox(t);
            } else if (typeof t == "boolean") {
                //备份成功
                dialog.showMessageBoxSync({
                    type: "info",
                    title: "备份成功",
                    message: "便签已经备份成功，请妥善保管好您的备份文件。",
                    buttons: ["好的"]
                });
                setLastBackupTime();
            } else if (typeof t == "object") {
                var failed = "";
                t.failedNotes.forEach(function(filePath) {
                    failed = failed + filePath + "\n";
                });
                dialog.showMessageBoxSync({
                    type: "info",
                    title: "备份成功",
                    message: "便签部分备份成功，" + t.failedNotes.length + "个便签在备份时出现错误。",
                    detail: "以下是出错的文件：\n" + failed,
                    buttons: ["确认"]
                });
                setLastBackupTime();
            }
        } catch (err) {
            console.error("Saving backup error.");
            console.error(err);
            backupNotesErrorBox(err);
        }
    }
}

//设置最后一次备份的时间
function setLastBackupTime() {
    var lasttime = {
        lasttime: time.getCurrentTime()
    };
    storage.set("lastBackupTime", lasttime);
}

//执行备份
function _backupNotes(backup_filename) {
    var notes_backup = [];
    var notes_backup_failed = []; // 备份失败的notes
    if (!fs.existsSync(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/")) {
        return "便签目录不存在。";
    }
    let files;
    try {
        files = fs.readdirSync(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/");
    } catch {
        return "目录读取错误。";
    }
    // 判断空值
    if (!files) {
        return "目录读取错误。";
    }
    // 当前note的数目
    var notes_count = 0;
    files.forEach(function(file) {
        let file_stat;
        try {
            file_stat = fs.statSync(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/" + file);
        } catch (err) {
            return;
        }
        if (file_stat && !file_stat.isDirectory()) {
            notes_count++; // 计数
            let data;
            try {
                data = fs.readFileSync(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/" + file, "utf-8");
            } catch (err) {
                notes_backup_failed.push(file);
                return;
            }
            // 判断空值
            if (!data) {
                notes_backup_failed.push(file);
                return;
            }
            // 解析读取到的内容
            var note = JSON.parse(data);
            // 构造备份便签对向并推入内容到数组
            notes_backup.push({
                filename: file,
                content: data,
                updatetime: typeof note.updaterawtime != "undefined" ? note.updaterawtime : note.rawtime,
                check: sha256(file + data, "fastnote") //计算校验哈希
            });
        }
    });
    if (notes_count < 1) {
        return "没有可以备份的便签。";
    }
    // 检测分类文件是否存在
    let categories = '';
    if (fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/categories.json')) {
        try {
            categories = fs.readFileSync(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/categories.json');
        } catch {}
    }
    // 写入备份到文件
    let backup = {
        notes: notes_backup,
        categories: {
            content: categories,
            check: sha256(JSON.stringify(categories), "fastnote")
        }
    };
    const backup_string = b64.encode(JSON.stringify(backup));
    try {
        fs.writeFileSync(backup_filename, backup_string, "utf8");
    } catch (err) {
        return "写入备份文件时发生错误。";
    }
    // 判断是不是没有出错
    if (notes_backup_failed.length < 1) {
        return true;
    } else {
        return notes_backup_failed;
    }
}

function backupNotesErrorBox(err) {
    if (typeof err == "string") {
        dialog.showMessageBoxSync({
            title: "备份错误",
            type: "error",
            message: "在保存便签时出现错误。",
            detail: err
        });
    } else {
        dialog.showMessageBoxSync({
            title: "备份错误",
            type: "error",
            message: "在保存便签时出现未知错误。"
        });
    }
}

let isImportDialogOpened = false;

function importNotes() {
    if (!isImportDialogOpened) {
        isImportDialogOpened = true;
        let openPath = dialog.showOpenDialogSync({
            title: "导入便签备份",
            buttonlabel: "导入",
            filters: [
                {
                    name: "Fastnote 备份",
                    extensions: ["fnbak"]
                },
                {
                    name: "所有文件",
                    extensions: ["*"]
                }
            ],
            properties: ["openFile"]
        });
        isImportDialogOpened = false;
        if (openPath.length < 1) {
            dialog.showMessageBoxSync({
                title: "打开文件错误",
                type: "error",
                buttons: ["确定"],
                message: "打开文件时出现错误"
            });
            return;
        }
        openPath = openPath[0];
        let ret = dialog.showMessageBoxSync({
            title: "恢复备份",
            type: "warning",
            buttons: ["确定", "取消"],
            defaultId: 0,
            cancelId: 1,
            message: "确定要导入这个备份吗？",
            detail: "备份文件路径: " + openPath
        });
        if (ret == 0) {
            // 确认导入
            let data = fs.readFileSync(openPath);
            if (!data || data.length < 1) {
                importNotesErrorBox("读取备份文件失败");
            }
            // 检测便签目录是否是存在的
            const notes_directory = storagePath + (global.indebug ? "/devTemp" : "") + "/notes/";
            if (!fs.existsSync(notes_directory)) {
                try {
                    fs.mkdirSync(notes_directory);
                } catch {
                    importNotesErrorBox("创建便签目录时出现错误");
                    return;
                }
            }
            // 读取备份文件
            var encoded_data = data.toString();
            backup = JSON.parse(b64.decode(encoded_data));
            // 执行恢复备份
            recoverNotes(backup.notes);
            // 分类备份有意义时执行恢复
            if (backup.categories.content) {
                recoverCategories(backup.categories.content);
            }
        }
    }
}

function recoverNotes(notes) {
    //计数变量
    var recover_count = 0;
    var recover_failed_count = 0;
    var recover_failed_files = [];

    notes.forEach(backup => {
        // 文件校验
        var check = sha256(backup.filename + backup.content, "fastnote");
        if (check != backup.check) {
            recover_count++;
            recover_failed_count++;
            recover_failed_files.push({
                filename: backup.filename,
                err: 0
            });
            recoverBackupCompleted(recover_count, notes.length, recover_failed_count, recover_failed_files);
            return;
        }
        // 先判断文件是否存在
        if (fs.existsSync(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/" + backup.filename)) {
            // 获取修改时间
            let note_data;
            try {
                note_data = fs.readFileSync(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/" + backup.filename);
            } catch {
                recover_count++;
                recover_failed_count++;
                recover_failed_files.push({
                    filename: backup.filename,
                    err: 1
                });
                recoverBackupCompleted(recover_count, notes.length, recover_failed_count, recover_failed_files);
                return;
            }
            // 拒绝空值
            if (!note_data) {
                recover_count++;
                recover_failed_count++;
                recover_failed_files.push({
                    filename: backup.filename,
                    err: 1
                });
                recoverBackupCompleted(recover_count, notes.length, recover_failed_count, recover_failed_files);
                return;
            }
            var note = JSON.parse(note_data);
            var mtime = typeof note.updaterawtime != "undefined" ? note.updaterawtime : note.rawtime;
            // 检查修改时间
            if (backup.updateTime > mtime) {
                // 备份文件较新，直接覆盖
                fs.writeFile(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/" + backup.filename, backup.content, err => {
                    recover_count++;
                    if (err) {
                        recover_failed_count++;
                        recover_failed_files.push({
                            filename: backup.filename,
                            err: 2
                        });
                    }
                    recoverBackupCompleted(recover_count, notes.length, recover_failed_count, recover_failed_files);
                });
            } else {
                // 备份文件较旧，询问
                let ret = dialog.showMessageBoxSync({
                    title: "恢复备份",
                    type: "warning",
                    message: "检测到已经存在的更新的便签文件，是否覆盖？",
                    detail: "当前文件：" + backup.filename + "\n便签创建时间:" + note.time + (typeof note.updatetime != "undefined" ? "\n便签更新时间：" + note.updatetime : "") + "\n便签内容: " + (note.text.length > 20 ? note.text.substring(0, 20) + "..." : note.text),
                    defaultId: 1,
                    cancelId: 1,
                    buttons: ["覆盖", "跳过"]
                });
                switch (ret) {
                    case 0:
                        fs.writeFile(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/" + backup.filename, backup.content, err => {
                            recover_count++;
                            if (err) {
                                recover_failed_count++;
                                recover_failed_files.push({
                                    filename: backup.filename,
                                    err: 2
                                });
                            }
                            recoverBackupCompleted(recover_count, notes.length, recover_failed_count, recover_failed_files);
                        });
                        break;
                    case 1:
                        recover_count++;
                        return;
                }
            }
        } else {
            // 便签文件不存在，直接写入
            fs.writeFile(storagePath + (global.indebug ? "/devTemp" : "") + "/notes/" + backup.filename, backup.content, err => {
                recover_count++;
                if (err) {
                    recover_failed_count++;
                    recover_failed_files.push({
                        filename: backup.filename,
                        err: 2
                    });
                }
                recoverBackupCompleted(recover_count, notes.length, recover_failed_count, recover_failed_files);
            });
        }
    });
}

function recoverCategories(data) {
    if (sha256(JSON.stringify(data), 'fastnote') != data.check) {
        dialog.showMessageBoxSync({
            title: "恢复错误",
            type: "warning",
            message: "便签分类内容未通过安全校验，请在便签备份结束后手动重置分类。",
            buttons: ["确认"]
        });
        return;
    }
    // 通过校验，发送给主窗体
    ipcRenderer.send('backup-recover-categories', data.content);
}

function recoverBackupCompleted(recover_count, backups_length, recover_failed_count, recover_failed_files) {
    if (recover_count < backups_length) {
        return;
    }
    //备份恢复执行结束
    ipcRenderer.send("backup-recover-completed");
    //判断是否存在失败的恢复
    if (recover_failed_count > 0) {
        //构造错误信息
        var detail = "";
        recover_failed_files.forEach(fail => {
            detail = detail + filename + ": ";
            switch (err) {
                case 0:
                    detail = detail + "校验错误";
                    break;
                case 1:
                    detail = detail + "读取已存在的便签时发生错误";
                    break;
                case 2:
                    detail = detail + "写入出错";
                    break;
            }
            detail = detail + "\n";
        });
        dialog.showMessageBoxSync({
            title: "备份恢复完成",
            type: "info",
            message: "备份恢复完成，部分便签恢复失败。",
            buttons: ["确认"],
            detail: detail
        });
    } else {
        dialog.showMessageBoxSync({
            title: "备份恢复完成",
            type: "info",
            message: "备份已全部恢复完成。",
            buttons: ["确认"]
        });
    }
}

function importNotesErrorBox(err) {
    if (typeof err == "string") {
        dialog.showMessageBoxSync({
            title: "备份恢复错误",
            type: "error",
            message: "在导入便签时出现错误。",
            buttons: "确定",
            detail: err
        });
    } else {
        dialog.showMessageBoxSync({
            title: "备份恢复错误",
            type: "error",
            message: "在保存便签时出现未知错误。",
            buttons: "确定"
        });
    }
}

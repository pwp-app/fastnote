$(function () {
  const html = `
  <div class="container-devconsole">
    <div class="devconsole">
      <input class="brcontrol-input" id="input-devconsole" type="text">
    </div>
  </div>
  `;
  $('body').append(html);
  const consoleInput = $('#input-devconsole');
  consoleInput.on('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = consoleInput.val();
      processConsoleCmd(input);
      consoleInput.val('');
    }
  });
});

const cmdMap = {
  'reload': devReloadWindow,
  'reloadwindow': devReloadWindow,
  'noteinfo': devDisplayNoteInfo,
  'clearsync': devClearSync,
  'marksync': devMarkSync,
  'firesync': devFireSync,
  'dosync': devFireSync,
  'pushcategory': pushCategories,
  'pushcategories': pushCategories,
  'delelecategory': deleteCategory,
};

function processConsoleCmd(input) {
  const parts = input.split(' ');
  let [cmd, ...args] = parts;
  cmd = cmd.toLowerCase();
  const func = cmdMap[cmd];
  if (func && typeof func === 'function') {
    func(args);
  } else {
    displayInfobar.warn('Invalid command');
  }
}

// 重载窗口
function devReloadWindow() {
  reloadAllWindows();
}

// 显示note的信息
function devDisplayNoteInfo(args) {
  args.forEach((arg) => {
    if (noteMap[arg]) {
      alert(JSON.stringify(noteMap[arg], null, '  '));
    }
  });
}

// 手动设置某些便签需要sync
function devMarkSync(args) {
  args.forEach((arg) => {
    if (arg.startsWith('#')) {
      arg = arg.substr(1);
    }
    const note = noteMap[arg];
    if (note) {
      note.needSync = true;
    }
    saveNoteByObj(note);
  });
  displayInfobar.success('Command executed');
}

// 手动触发同步
function devFireSync(args) {
  if (args && Array.isArray(args)) {
    devMarkSync(args);
  }
  doSync();
  displayInfobar.success('Command executed');
}

// 清除便签的sync相关属性
function devClearSync(args) {
  args.forEach((arg) => {
    if (arg.startsWith('#')) {
      arg = arg.substr(1);
    }
    const note = noteMap[arg];
    if (note) {
      delete note.needSync;
      delete note.syncId;
    }
    saveNoteByObj(note);
  });
  displayInfobar.success('Command executed');
}

// 分类操作
function deleteCategory(args) {
  args.forEach((arg) => {
    const idx = categories.findIndex(item => item.name === arg);
    if (idx >= 0) {
      categories.splice(idx, 1);
    }
    saveCategories();
  });
  displayInfobar.success('Command executed');
}
// 依赖引入
const moment = require('moment');
var pako = require('pako');

// 全局变量
var noteRecycledLog;

// 执行同步流程的主方法
async function doSync() {
  if (!cloud_token) {
    // 两个token都没有，直接return
    if (!cloud_refresh_token) {
      return;
    }
    // 有refresh token，尝试刷新
    const res = await doRefreshToken();
    if (!res) {
      return;
    }
  }
  const lastSync = await getLastSync() || '2020-01-01 00:00:00';
  if (!noteRecycledLog) {
    noteRecycledLog = await getRecycledLog();
  }
  // 获取diff数据
  const diff = await fetchDiff(lastSync);
  if (!diff) {
    return;
  }
  // 处理diff数据
  await processDiff(diff);
  // 执行同步
  const updated = await pushNoSyncNotes();
  if (!updated) {
    return;
  }
  // 处理同步返回数据
  processUpdated(updated);
  // 保存最后的sync日期
  saveLastSync();
}

function getLastSync() {
  return new Promise((resolve) => {
    storage.get('last-sync-time', (err, res) => {
      if (err) {
        console.log('[Cloud] Cannot get last sync time.');
        return resolve(null);
      };
      resolve(res.str);
    });
  });
}

function saveLastSync() {
  return new Promise((resolve) => {
    const time = {
      str: moment().format('YYYY-MM-DD HH:mm:ss'),
    };
    storage.set('last-sync-time', time, (err) => {
      if (err) {
        return resolve(false);
      }
      resolve(true);
    });
  });
}

function fetchDiff(lastSync) {
  return new Promise((resolve) => {
    $.ajax({
      url: `${cloud_apibase}/sync/diff`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cloud_token}`,
      },
      data: {
        lastSync,
      },
      success: (res) => {
        if (!res) {
          console.error('[Cloud] Cannot resolve diff response.');
          return resolve(null);
        }
        const { success, data } = res;
        if (!success) {
          console.error('[Cloud] Fetch diff data failed.');
          return resolve(null);
        }
        resolve(data);
      },
      error: () => {
        console.error('[Cloud] Fetch diff info error.');
        resolve(null);
      }
    });
  });
}

async function processDiff(diff) {
  const { notes } = diff;
  const { needAnimate: needCreateAnim } = await processDiffNotes(notes);
  // 处理deleted
  const { deleted } = diff;
  processDiffDeleted(deleted);
  // 重新渲染
  refreshNoteList(() => {
    // 动画效果
    for (const id of needCreateAnim) {
      $(`#note_${id}`).animateCss('fadeInRight faster');
    }
    // 处理分类
    checkCategoryCount();
    pushCategories();
  });
}

// 处理diff
async function processDiffNotes(diffNotes) {
  if (!diffNotes || !Array.isArray(diffNotes)) {
    console.warn('[Cloud] Diff notes data is not right.');
    return;
  }
  const needAnimate = [];
  if (!noteRecycledLog) {
    noteRecycledLog = await getRecycledLog();
  }
  const localRecycled = Object.keys(noteRecycledLog);
  diffNotes.forEach((item) => {
    const note = JSON.parse(pako.ungzip(item.content, { to: 'string' }));
    if (!note.syncId) {
      note.syncId = item.syncId;
    }
    note.needSync = false;
    // 时间变量
    const remoteTime = note.updaterawtime || note.rawtime;
    const remoteTimeObj = moment(remoteTime, 'YYYYMMDDHHmmss');
    // 判断本地是否删除
    if (
      localRecycled.includes(stored.syncId) &&
      remoteTimeObj.valueOf() > localRecycled[stored.syncId]
    ) {
      // 本地已删除但是远程未删除，且比本地更新
      const ret = dialog.showMessageBoxSync({
        title: '便签同步冲突',
        type: 'warning',
        message: '云端便签在本地已删除且比本地便签更新，请选择一个操作以解决冲突',
        defaultId: 0,
        cancelId: 0,
        buttons: ['保留该便签并使用云端版本', '删除'],
      });
      // 覆盖也需要删除
      deleteNoteFile(stored);
      deleteNoteFromArr(stored.id);
      if (ret === 0) {
        addNoteObjToArray(note);
        saveNoteByObj(note);
      }
    }
    // 判断是否要替换原有的内容
    const stored = noteMap[note.id];
    if (!stored) {
      // 本地没有这个便签，直接加入
      addNoteObjToArray(note);
      saveNoteByObj(note);
      needAnimate.push(note.id);
      return;
    }
    // 本地存在这个便签
    if (stored.syncId) {
      if (stored.syncId !== note.syncId) {
        // 两边syncId不一致，把服务器端的作为新便签加入列表
        addExistedNoteAsNew(note);
        needAnimate.push(note.id);
        stored.needSync = true;
        return;
      }
      // 本地内容同步过，以服务器内容为准
      const storedTime = stored.updaterawtime || stored.rawtime;
      const storedTimeObj = moment(storedTime, 'YYYYMMDDHHmmss');
      if (remoteTimeObj.valueOf() > storedTimeObj.valueOf()) {
        // 服务器上的更新，覆盖本地内容
        deleteNoteFile(stored);
        deleteNoteFromArr(stored.id);
        addNoteObjToArray(note);
        saveNoteByObj(note);
      } else {
        // 服务器上的更旧
        stored.needSync = true;
        saveNoteByObj(stored);
      }
    } else {
      // 本地内容没有同步过，当前便签可能产生冲突
      const ret = dialog.showMessageBoxSync({
        title: '便签同步冲突',
        type: 'warning',
        message: '云端已有便签和本地未同步过的便签存在ID冲突，请选择一个操作',
        defaultId: 0,
        cancelId: 0,
        buttons: ['保留现有便签，云端便签作为新便签插入', '覆盖现有便签'],
      });
      if (ret === 0) {
        addExistedNoteAsNew(note);
      }
      if (ret === 1) {
        deleteNoteFile(stored);
        deleteNoteFromArr(stored.id);
        addNoteObjToArray(note);
        saveNoteByObj(note);
      }
    }
  });
  return { needAnimate };
}

// 处理diff的删除部分
function processDiffDeleted(diffDeleted) {
  if (!diffDeleted || !Array.isArray(diffDeleted)) {
    console.warn('[Cloud] Diff deleted data is not right.');
    return;
  }
  diffDeleted.forEach((item) => {
    const { syncId, createdAt } = item;
    if (noteRecycledLog[syncId]) {
      // 本地已删除，状态和远程一致，无需处理
      delete noteRecycledLog[syncId];
      return;
    }
    // 本地未删除
    const index = notes.findIndex(note => note.syncId === syncId);
    const note = notes[index];
    const time = note.updaterawtime || note.rawtime;
    if (moment(time, 'YYYYMMDDHHmmss').valueOf() > moment(createdAt).valueOf()) {
      // 本地有修改
      note.needSync = true;
      return;
    }
    // 本地未删除且无修改
    moveFileToRecycled(note);
    deleteNoteFromArrByIdx(index);
  });
}

// 把远程已有的便签当作新便签插入本地
function addExistedNoteAsNew(note) {
  // 改变noteId
  note.id = notesid;
  note.needSync = true;
  notesid++;
  saveNotesId();
  // 加入数组并保存至本地
  addNoteObjToArray(note);
  saveNoteByObj(note);
}

// 把所有没有更新的便签提交到服务器
function pushNoSyncNotes() {
  return new Promise((resolve) => {
    // 构建需要写入远程的notes
    const syncNoteData = [];
    notes.forEach((note) => {
      const { syncId, needSync } = note;
      if (!syncId || needSync) {
        const { id, syncId } = note;
        syncNoteData.push({
          id,
          syncId: syncId || null,
          content: pako.gzip(JSON.stringify(note), { to: 'string' }),
        });
      }
    });
    // 构建deleted
    const deleted = Object.keys(noteRecycledLog);
    // 判断是否要发请求
    if (syncNoteData.length < 1 && deleted.length < 1) {
      console.warn('[Cloud] No need to send update request.');
      return;
    }
    $.ajax({
      url: `${cloud_apibase}/sync/update`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloud_token}`,
      },
      data: {
        notes: JSON.stringify(syncNoteData),
        deleted,
      },
      success: (res) => {
        if (!res) {
          // 没有返回内容
          console.error('[Cloud] Update executed but no response.');
          return resolve(null);
        }
        const { success, data } = res;
        if (!success || !data) {
          console.error('[Cloud] Update executed but failed.');
          return resolve(null);
        }
        // 已经同步到远程，本地的删除记录无需继续保留
        noteRecycledLog = {};
        saveRecycledLog();
        // 返回内容
        resolve(data);
      },
      error: () => {
        console.error('[Cloud] Failed to execute update.');
        resolve(null);
      }
    });
  });
}

// 处理返回的更新信息
function parseSyncIdMap(updated) {
  const map = {};
  updated.forEach((item) => {
    const { id, syncId } = item;
    map[id] = syncId;
  });
  return map;
}
function processUpdated(updated) {
  const syncIdMap = parseSyncIdMap(updated);
  notes.forEach((note) => {
    const syncId = syncIdMap[note.id];
    if (syncId && !note.syncId) {
      note.syncId = syncId;
    }
    note.needSync = false;
    // 写入note
    saveNoteByObj(note);
  });
}

// 删除记录
async function recordRecycleBehaviour(note) {
  if (!noteRecycledLog) {
    noteRecycledLog = await getRecycledLog();
  }
  // 没有syncId的不需要同步远端
  const { syncId } = note;
  if (!syncId) {
    return;
  }
  // 有syncId，记录
  noteRecycledLog[syncId] = moment().valueOf();
  await saveRecycledLog();
}
async function recordRestoreBehaviour(note) {
  if (!noteRecycledLog) {
    noteRecycledLog = await getRecycledLog();
  }
  const { syncId } = note;
  if (!syncId) {
    return;
  }
  note.needSync = true;
  delete noteRecycledLog(syncId);
  await saveRecycledLog();
}
function getRecycledLog() {
  return new Promise((resolve) => {
    storage.get('recycled-log', (err, res) => {
      if (err) {
        console.error('[Cloud] Cannot get recycled log.');
        return resolve(null);
      }
      resolve(res || {});
    });
  });
}
function saveRecycledLog() {
  return new Promise((resolve) => {
    storage.set('recycled-log', noteRecycledLog, (err) => {
      if (err) {
        return resolve(false);
      }
      resolve(true);
    });
  });
}

// 同步分类信息
function pushCategories() {
  if (!categories) {
    return;
  }
  $.ajax({
    url: `${cloud_apibase}/sync/updateCategories`,
    type: 'POST',
    headers: {
      Authorization: `Bearer ${cloud_token}`,
    },
    data: {
      categories: pako.gzip(JSON.stringify(categories), { to: 'string' }),
    },
    dataType: 'JSON',
    success: (res) => {
      if (!res) {
        console.error('[Cloud] Push categories failed.');
        return;
      }
      const { success } = res;
      if (!success) {
        console.error('[Cloud] Push categories failed.');
      }
    },
    error: (err) => {
      console.error('[Cloud] Push categories error: ', err);
    }
  });
}
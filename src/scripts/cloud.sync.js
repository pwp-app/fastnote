const pako = require('pako');

// 执行同步流程的主方法
function doSync() {
  
}

function fetchDiff() {
  return new Promise((resolve) => {
    $.ajax({
      url: `${cloud_apibase}/sync/diff`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cloud_token}`,
      },
      success: (res) => {
        if (!res.data) {
          console.error('[Cloud] Cannot resolve diff data.');
          return resolve(null);
        }
        const { success, data } = res.data;
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

// 处理diff
function processDiff() {

}

// 把所有没有更新的便签提交到服务器
function pushNoSyncNotes() {
  return new Promise((resolve) => {
    const needSync = [];
    notes.forEach((note) => {
      if (!note.syncId || note.needSync) {
        const { id } = note;
        needSync.push({
          id,
          content: pako.deflate(JSON.stringify(note), { to: 'string' }),
        });
      }
    });
    $.ajax({
      url: `${cloud_apibase}/sync/update`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloud_token}`,
      },
      data: {
        notes: JSON.stringify(needSync),
      },
      success: (res) => {
        if (!res.data) {
          // 没有返回内容
          console.error('[Cloud] Update executed but no response.');
          return resolve(null);
        }
        const { success, data } = res;
        if (!success || !data) {
          console.error('[Cloud] Update executed but failed.');
          return resolve(null);
        }
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

// 根据返回的更新信息处理
function processUpdate() {
  
}
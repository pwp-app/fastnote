var fs = require('fs');
var remote = require('electron').remote;
var app = remote.app;
var storagePath = app.getPath('userData');

var categories = [];
var current_category;

var notalloc_count = 0;

global.indebug = remote.getGlobal('indebug');

// ** 类 **
class Category {
  constructor(name, count) {
    this.name = name;
    this.count = count;
  }
}

// ** 立即执行 **

readCategoriesFile();
readCurrentCategory();

// 读取
function readCurrentCategory() {
  const current_category_file = storagePath + (global.indebug ? '/devTemp' : '') + '/storage/current_category.json';
  if (fs.existsSync(current_category_file)) {
    try {
      const stored = fs.readFileSync(current_category_file, 'utf-8');
      current_category = JSON.parse(stored).category;
    } catch (err) {
      console.error('Read current category error: ', err);
      return;
    }
  } else {
    current_category = 'all';
  }
}

function saveCurrentCategory() {
  var data = {
    category: current_category
  };
  fs.writeFile(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/current_category.json', JSON.stringify(data), 'utf-8', function(err) {
    if (err) {
      console.error(err);
    }
  });
}

function readCategoriesFile() {
  const categories_file = storagePath + (global.indebug ? '/devTemp' : '') + '/storage/categories.json';
  if (fs.existsSync(categories_file)) {
    fs.readFile(categories_file, 'utf-8', function(err, data) {
      if (err) {
        console.error(err);
        return;
      }
      categories = JSON.parse(data);
      $(function() {
        renderCategoryList();
        renderCategorySelect();
        renderSystemCategoryCount();
        renderCustomCategoryCount();
      });
    });
  }
}

function checkCategoryCount(retry = false) {
  let custom_total = 0;
  categories.forEach((category) => {
    custom_total += category.count;
  });
  if (notalloc_count + custom_total !== notes.length) {
    if (!retry) {
      recountNotes();
      return checkCategoryCount(retry = true);
    }
    return false;
  }
  console.log('Category count check passed.');
  return true;
}

// 重新计算note的数量
function recountNotes(retry = false) {
  let count_obj = {};
  // 清点notes
  notes.forEach((note) => {
    const { category } = note;
    if (category && category !== 'notalloc') {
      if (!count_obj[category]) {
        count_obj[category] = 1;
        return;
      }
      count_obj[category] += 1;
    } else {
      if (!count_obj.notalloc) {
        count_obj.notalloc = 1;
        return;
      }
      count_obj.notalloc += 1;
    }
  });
  // 覆盖categories的设置
  categories.forEach((category) => {
    const { name } = category;
    if (count_obj[name]) {
      category.count = count_obj[name];
    }
  });
  notalloc_count = count_obj.notalloc;
  // 重新校验正确性
  let custom_total = 0;
  categories.forEach((category) => {
    custom_total += category.count;
  });
  console.log('[Category] Category verify total after fix: ' + (notalloc_count + custom_total));
  if (notalloc_count + custom_total === notes.length) {
    console.log('[Category] Category count is reset to correct values.');
    saveCategories();
    renderSystemCategoryCount();
    renderCustomCategoryCount();
  } else {
    // 尝试扫描便签修复分类文件
    if (!retry) {
      console.error('[Category] Category count error, try to fix missing categories.');
      fixMissingCategories().then((res) => {
        // 修复成功后重新渲染一次
        if (res) {
          recountNotes(retry = true);
          renderCategoryList();
          renderCategorySelect();
        }
      });
    } else {
      console.error('[Category] Category count error, cannot fix after missing categories check.');
    }
  }
}

// 尝试修复缺失的分类
function fixMissingCategories() {
  return new Promise((resolve, reject) => {
    let flag_changed = false;
    let founded_missing = [];
    // 普通遍历的性能更高
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].category) {
        // 如果已经修复过了就没必要再处理
        if (founded_missing.includes(notes[i].category)) {
          continue;
        }
        let flag_found = false;
        for (let j = 0; i < categories.length; j++) {
          if (categories[j].name === notes[i].category) {
            flag_found = true;
            break;
          }
        }
        if (!flag_found) {
          // 未找到说明是缺失的分类
          putCategoryToArr(notes[i].category, 0);
          founded_missing.push(notes[i].category);
          flag_changed = true;
        }
      }
    }
    // 分类内容改变了即存在缺失并已修复
    resolve(flag_changed);
  });
}

//放置新的Category到数组
function putCategoryToArr(name, count = 0) {
  categories.push(new Category(name, count));
}

function existCategory(name) {
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].name == name) {
      return true;
    }
  }
  return false;
}

function indexOfCategory(name) {
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].name == name) {
      return i;
    }
  }
  return false;
}

function getCountOfCategory(name) {
  if (name === 'notalloc') {
    return notalloc_count;
  } else if (name === 'all') {
    return notes.length;
  } else {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].name === name) {
        return categories[i].count;
      }
    }
    return false;
  }
}

function removeCategoryFromArr(name) {
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].name === name) {
      categories.splice(i, 1);
    }
  }
}

function setNotesCategory(name, category) {
  let index;
  if (category) {
    index = indexOfCategory(name);
  }
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].category === name) {
			notes[i].category = category;
			notes[i].needSync = true;
      saveNoteByObj(notes[i]);
      if (!category) {
        notalloc_count++;
      } else {
        if (index >= 0) {
          categories[index].count++;
        }
      }
    }
  }
  // 保存分类
  saveCategories();
  // 重新渲染计数
  renderSystemCategoryCount();
  renderCustomCategoryCount();
}

function saveCategories() {
  if (!fs.existsSync(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/')) {
    fs.mkdirSync(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/');
  }
  var json = JSON.stringify(categories);
  fs.writeFile(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/categories.json', json, 'utf-8', function(err, data) {
    if (err) {
      console.error(err);
    }
  });
}

function renderCategoryToList(index, name, count, animate = false) {
  var html = '<li data-name="' + name + '" draggable="true"><div id="category-custom-' + name + '"><div class="category-item-name"><span>' + name + '</span><input class="category-edit-input" type="text" value="' + name + '" data-index="' + index + '"></div><div class="category-item-count"><span>' + count + '</span></div><div class="category-item-delbtn"><i class="fa fa-minus-circle" aria-hidden="true"></i></div></div></li>';
  $('.category-menu-custom').append(html);
  // 如果是编辑模式下添加的，样式和编辑模式统一
  if (categoryEditMode) {
    $('#category-custom-' + name + ' .category-item-count').hide();
    $('#category-custom-' + name + ' .category-item-delbtn').show();
    $('#category-custom-' + name).parent().css('-webkit-user-drag', 'auto');
    $('#category-custom-' + name).parent().css('-webkit-user-select', 'auto');
  }
  if (animate) {
    $('#category-custom-' + name).animateCss('fadeIn morefaster');
  }
}

function renderCategoryToSelect(name) {
  let html = '<option value="' + name + '">' + name + '</option>';
  $('#select-note-category').append(html);
}

function renderCategoryList() {
  $('.category-menu-custom').html(''); //先清空
  for (let i = 0; i < categories.length; i++) {
    renderCategoryToList(i, categories[i].name, categories[i].count);
  }
  renderCurrentCategory();
}

function renderCategorySelect() {
  $('#select-note-category').html('<option value="notalloc" data-lang="notalloc">未分类</option>');
  for (let i = 0; i < categories.length; i++) {
    renderCategoryToSelect(categories[i].name);
  }
}

function renderCurrentCategory() {
  switch (current_category) {
    case 'all':
      $('#category-system-' + current_category).addClass('category-selected');
      $('.bottombar-category-name').html('');
      $('#newnote-info-item-category').show(); // 当前分类为所有便签时创建便签的分类可选
      break;
    case 'notalloc':
      $('#category-system-' + current_category).addClass('category-selected');
      $('.bottombar-category-name').html('未分类');
      $('#newnote-info-item-category').hide();
      break;
    default:
      $('#category-custom-' + current_category).addClass('category-selected');
      $('.bottombar-category-name').html(current_category);
      $('#select-note-category').val(current_category);
      $('#newnote-info-item-category').hide(); // 当前分类为其他分类时创建便签的分类不可选
      break;
  }
}

function addCategoryCount(name, render = false, save = false) {
  if (typeof name === 'undefined' || name == null || name === 'notalloc') {
    notalloc_count++;
    renderSystemCategoryCount();
    return;
  }
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].name == name) {
      categories[i].count = categories[i].count + 1;
      if (render) {
        $('#category-custom-' + categories[i].name + ' .category-item-count span').html(categories[i].count); //渲染到UI上
        renderSystemCategoryCount();
      }
      if (save) {
        saveCategories();
      }
      return;
    }
  }
}

function minorCategoryCount(name, checkEmpty = true, render = false, save = false) {
  if (!name || name === 'notalloc') {
    notalloc_count--;
    renderSystemCategoryCount();
    if (checkEmpty) {
      if (current_category === 'notalloc') {
        checkCategoryEmpty();
      }
    }
    return;
  }
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].name === name) {
      categories[i].count = categories[i].count - 1;
      if (render) {
        $('#category-custom-' + categories[i].name + ' .category-item-count span').html(categories[i].count); //渲染到UI上
        renderSystemCategoryCount();
      }
      if (checkEmpty) {
        checkCategoryEmpty();
      }
      if (save) {
        saveCategories();
      }
      return;
    }
  }
}

function checkCategoryEmpty() {
  if (current_category === 'all' || notes.length < 1) {
    return;
  }
  if (getCountOfCategory(current_category) < 1) {
    if ($('#note-empty-category').css('display') == 'none') {
      $('#note-empty-category').show();
      $('#note-empty-category').animateCss('fadeIn faster');
    }
  }
}

function renderSystemCategoryCount() {
  if (notes) {
    $('#category-count-all').html(notes.length);
  }
  $('#category-count-notalloc').html(notalloc_count);
}

function renderCustomCategoryCount() {
  for (let i = 0; i < categories.length; i++) {
    $('#category-custom-' + categories[i].name + ' .category-item-count span').html(categories[i].count);
  }
}
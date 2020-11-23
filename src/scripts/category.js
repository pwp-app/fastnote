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

function recountNotes() {
  const map = {};
  notes.forEach((note) => {
    let { category } = note;
    if (!category) {
      category = 'notalloc';
    }
    if (!map[category]) {
      map[category] = 1;
    } else {
      map[category] += 1;
    }
  });
  categories.forEach((item) => {
    const { name } = item;
    if (!map[name] && name !== 'notalloc' && name !== 'all') {
      map[name] = 0;
    }
  });
  const list = [];
  let total = 0;
  let keys = Object.keys(map);
  keys.sort();
  keys.forEach((key) => {
    total += map[key];
    if (key === 'notalloc') {
      notalloc_count = map[key];
      return;
    }
    list.push(new Category(key, map[key]));
  });
  if (total === notes.length) {
    console.info('[Category] Categories count has been fixed.')
    categories = list;
    saveCategories();
    renderCategoryList();
    renderCategorySelect();
  }
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
  const json = JSON.stringify(categories);
  fs.writeFile(storagePath + (global.indebug ? '/devTemp' : '') + '/storage/categories.json', json, 'utf-8', function(err, data) {
    if (err) {
      console.error(err);
    }
    if (hasLogon) {
      pushCategories();
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
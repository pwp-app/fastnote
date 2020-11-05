function getFormData(keys) {
  const map = {};
  keys.forEach((key) => {
    map[key] = $(`#input-${key.toLowerCase()}`).val();
  });
  return map;
}

function validateValues(map, rules) {
  let res = true;
  Object.keys(map).forEach((key) => {
    const rule = rules[key];
    if (!rule) {
      return;
    }
    if (rule.required) {
      if (!map[key]) {
        addInvalid(key);
        res = false;
        return;
      }
    }
    if (rule.max) {
      const value = map[key];
      if (typeof value === 'string' && value.length > rule.max) {
        addInvalid(key);
        res = false;
        return;
      }
      if (typeof value === 'number' && value > rule.max) {
        addInvalid(key);
        res = false;
        return;
      }
    }
    if (rule.min) {
      const value = map[key];
      if (typeof value === 'string' && value.length < rule.min) {
        addInvalid(key);
        res = false;
        return;
      }
      if (typeof value === 'number' && value < rule.min) {
        addInvalid(key);
        res = false;
        return;
      }
    }
    if (rule.custom && typeof rule.custon === 'function') {
      const res = rule.validate(map[key], map);
      if (!res) {
        res = false;
        return;
      }
    }
  });
  return res;
}

function addInvalid(key) {
  const el = $(`#input-${key}`);
  if (!el.hasClass('br-invalid')) {
    el.addClass('br-invalid');
  }
}
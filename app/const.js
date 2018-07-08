const app = require('electron').app,
      pkg = require('../package.json'),
      appPath = app.getAppPath();

module.exports = {
    name:pkg.name,
    version: pkg.version,
    path: appPath
};
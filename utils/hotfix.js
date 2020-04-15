const fs = require('fs');
const feed = `http://hotfix.backrunner.top/fastnote/`;

// global version
let appVersion;
// path
let manifestPath;
let asarPath;

const hotfix = {
    init(indebug, userDataPath, version) {
        if (!userDataPath || !version) {
            return false;
        }
        appVersion = version;
        manifestPath = `${userDataPath}/hotfix${indebug ? '_dev': ''}/manifest.json`;
        this.loadCheck();
    },
    loadCheck() {
    }
};

module.exports = hotfix;
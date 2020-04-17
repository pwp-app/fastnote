const { app, net } = require('electron');
const appVersion = app.getVersion();

const fs = require('fs');
const FileValidation = require('./fileValidation');

// path
let feed;
let dirPath;
let manifestPath;
let asarPath;
let hotfixBuild;

const hotfix = {
    init(indebug, userDataPath) {
        if (!userDataPath) {
            return false;
        }
        feed = `http://hotfix.backrunner.top/fastnote/${appVersion}`;
        dirPath = `${userDataPath}/hotfix${indebug ? '_dev': ''}/`;
        // 检查dirpath是否存在
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        manifestPath = `${userDataPath}/hotfix${indebug ? '_dev': ''}/manifest.json`;
        return this.loadCheck();
    },
    async loadCheck() {
        // 检查热更新manifest是否存在
        if (!fs.existsSync(manifestPath)) {
            return false;
        }
        // 存在，则读入
        let manifest;
        try {
            manifest = fs.readFileSync(manifestPath);
        } catch (e) {
            manifest = null;
            console.error('Hotfix manifest read error.');
        }
        // 读入失败，返回
        if (!manifest) {
            return false;
        }
        manifest = JSON.parse(manifest);
        hotfixBuild = manifest.build;
        // 比较应用版本
        if (manifest.version != appVersion) {
            // 热更版本和应用不符
            if (this.deletePatch()) {
                this.onlineCheck();
            }
            return false;
        }
        // 应用版本符合，抽出resource名称
        asarPath = `${userDataPath}/hotfix${indebug ? '_dev': ''}/${manifest.resource}`;
        // 检查asar是否存在
        if (!fs.existsSync(asarPath)) {
            // 不存在，视为热更新损坏，需要删除之后重新检测
            if (this.deletePatch()) {
                this.onlineCheck();
            }
            return;
        }
        // 存在，校验hash
        let hash = await FileValidation.sha256(asarPath);
        if (hash != manifest.check) {
            // 校验不正确，视为已经损坏了，删除后重新检测热更新
            if (this.deletePatch()) {
                this.onlineCheck();
            }
            return;
        }
        // 在线检测，检查是否有更新的、同一版本的热更可以下载
        this.onlineCheck();
    },
    async onlineCheck() {
        let manifest = await this.downloadManifest();
        if (!manifest) {
            return false;
        }
    },
    downloadManifest() {
        return new Promise((resolve, reject) => {
            const request = net.request(`${feed}/manifest.json`);
            request.on('response', (response) => {
                if (response.statusCode != 200) {
                    return resolve(null);
                }
                response.on('data', (chunk) => {
                    console.log('chunk');
                });
                response.on('end', () => {
                    console.log('end');
                });
            });
        });
    },
    deleteAsar() {
        if (asarPath && fs.existsSync(asarPath)) {
            if (!fs.unlinkSync(asarPath)) {
                return false;
            }
        }
        return true;
    },
    deletePatch() {
        if (manifestPath && fs.existsSync(manifestPath)) {
            if (!fs.unlinkSync(manifestPath)){
                return false;
            }
        }
        if (asarPath && fs.existsSync(asarPath)) {
            if (!fs.unlinkSync(asarPath)) {
                return false;
            }
        }
        return true;
    }
};

module.exports = hotfix;
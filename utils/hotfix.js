const { app } = require('electron');
const appVersion = app.getVersion();

const fs = require('fs');
const path = require('path');
const request = require('request');
const FileValidation = require('./fileValidation');

// path
let feed;
let userDataPath = app.getPath('userData');
let dirPath;
let manifestPath;
let asarPath;

const hotfix = {
    hotfixBuild: null,
    isRevoke: false,
    init(indebug) {
        feed = `http://hotfix.backrunner.top/fastnote/${appVersion}`;
        dirPath = `${userDataPath}/hotfix${indebug ? '_dev': ''}`;
        // 检查dirpath是否存在
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        manifestPath = `${dirPath}/manifest.json`;
        return this.loadCheck();
    },
    async loadCheck() {
        // 检查热更新manifest是否存在
        if (!fs.existsSync(manifestPath)) {
            console.info('Hotfix manifest does not existed.');
            this.onlineCheck();
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
        // 读入失败，视为热更新损坏，重新检查
        if (!manifest) {
            if (this.deletePatch()) {
                this.onlineCheck();
            }
            return false;
        }
        manifest = JSON.parse(manifest);
        this.hotfixBuild = manifest.build;
        this.isRevoke = manifest.revoke;
        // 比较应用版本
        if (manifest.version !== appVersion) {
            // 热更版本和应用不符
            if (this.deletePatch()) {
                this.onlineCheck();
            }
            return false;
        }
        if (manifest.revoke) {
            asarPath = null;
            this.onlineCheck();
            return;
        }
        // 应用版本符合，抽出resource名称
        asarPath = `${dirPath}/${manifest.resource}`;
        // 检查asar是否存在
        if (!fs.existsSync(asarPath)) {
            // 不存在，视为热更新损坏，需要删除之后重新检测
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
        // 线上hotfix版本不一致或build不一致，忽略
        if (manifest.version !== appVersion) {
            return false;
        }
        if (manifest.build <= this.hotfixBuild) {
            return false;
        }
        // 撤包
        if (manifest.revoke) {
            // 删除现有的内容防止被加载
            this.deletePatch();
            fs.writeFileSync(manifestPath, JSON.stringify(manifest));
            asarPath = null;
            return false;
        }
        // 下载asar资源
        let resourceRet = await this.downloadResource(manifest);
        if (!resourceRet) {
            // 发生下载错误，忽略
            return false;
        }
        // 下载事件完成
        let resourcePath = `${dirPath}/${manifest.resource}`;
        let cachePath = resourcePath.replace('.asar', '.download');
        // 下载完成但没有下载到东西也会返回true，要再对文件做检测，不存在则跳出这一次任务
        if (!fs.existsSync(cachePath)) {
            return false;
        }
        let hash = await FileValidation.sha256(cachePath);
        if (hash !== manifest.check) {
            // 文件校验失败，视为下载失败，删除文件并忽略
            if (fs.existsSync(cachePath)) {
                fs.unlinkSync(cachePath);
            }
            return false;
        }
        // 文件检查无误，写入新的manifest，更新全局asarPath
        fs.renameSync(cachePath, resourcePath);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest));
        asarPath = `${dirPath}/${manifest.resource}`;
        return true;
    },
    downloadManifest() {
        return new Promise((resolve, reject) => {
            request.get(`${feed}/manifest.json`, (err, res, body) => {
                if (err || res.statusCode != 200) {
                    console.error('Cannot download manifest file.');
                    return resolve(null);
                }
                resolve(JSON.parse(body));
            });
        });
    },
    downloadResource(manifest) {
        return new Promise((resolve, reject) => {
            request.get(`${feed}/${manifest.resource}`)
                .on('error', () => {
                    console.error('Hotfix resource download failed.');
                    resolve(false);
                })
                .on('close', () => {
                    console.info('Hotfix download completed');
                    resolve(true);
                })
                .pipe(fs.createWriteStream(`${dirPath}/${manifest.resource.replace('.asar', '.download')}`));
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
            console.info('Start deleting hotfix manifest file.');
            if (!fs.unlinkSync(manifestPath)){
                return false;
            }
        }
        if (asarPath && fs.existsSync(asarPath)) {
            console.info('Start deleting hotfix resource file.');
            if (!fs.unlinkSync(asarPath)) {
                return false;
            }
        }
        return true;
    },
    buildPath(page) {
        return asarPath ? path.resolve(asarPath, page) : path.resolve(__dirname, `../public/${page}`);
    }
};

module.exports = hotfix;
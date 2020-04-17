const fs = require('fs');
const crypto = require('crypto');

const FileValidation = {
    // 校验文件的sha256，默认文件存在
    sha256(filePath) {
        return new Promise((resolve, reject) => {
            let stat = fs.statSync(filePath);
            let stream = fs.createReadStream(filePath);
            let sha256 = crypto.createHash('sha256');
            stream.on('data', data => {
                sha256.update(data);
            });
            stream.on('end', () => {
                resolve(sha256.digest('hex'));
            });
            stream.on('error', () => {
                resolve(null);
            });
        });
    }
};

module.exports = FileValidation;
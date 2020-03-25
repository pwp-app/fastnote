const crypto = require('crypto');

const aes_encrypt = function(data, password){
    let cipher = crypto.createCipheriv('aes-256-cfb', crypto.scryptSync(password, '3bdc83600356a16ed2966991d9ee67e29ca2f25b', 32),  Buffer.alloc(16, 0));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

const aes_decrypt = function(data, password){
    let decipher = crypto.createDecipheriv('aes-256-cfb', crypto.scryptSync(password, '3bdc83600356a16ed2966991d9ee67e29ca2f25b', 32),  Buffer.alloc(16, 0));
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

const sha256 = function(data, hmac){
    return crypto.createHmac('sha256', hmac).update(data).digest('hex');
};

const b64 = {
    encode: (str) => {
        return window.btoa(unescape(encodeURIComponent(str)));
    },
    // base64 encoded ascii to ucs-2 string
    decode: (str) => {
        return decodeURIComponent(escape(window.atob(str)));
    }
};
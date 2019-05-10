const crypto = require('crypto');

var aes_encrypt = function(data, password){
    let cipher = crypto.createCipheriv('aes-256-cfb', crypto.scryptSync(password, '3bdc83600356a16ed2966991d9ee67e29ca2f25b', 32),  Buffer.alloc(16, 0));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

var aes_decrypt = function(data, password){
    let decipher = crypto.createDecipheriv('aes-256-cfb', crypto.scryptSync(password, '3bdc83600356a16ed2966991d9ee67e29ca2f25b', 32),  Buffer.alloc(16, 0));
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

var sha256 = function(data, hmac){
    return crypto.createHmac('sha256', hmac).update(data).digest('hex');
}
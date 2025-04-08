async function encryptAESGCM(message, keyHex) {
    try {
        // Преобразование ключа из hex в ArrayBuffer
        const keyBytes = hexToArrayBuffer(keyHex);
        
        // Импорт ключа
        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        // Генерация nonce (IV)
        const nonce = crypto.getRandomValues(new Uint8Array(12)); // 12 байт - стандартный размер nonce для AES-GCM
        
        // Шифрование
        const ciphertextWithTag = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: nonce,
                tagLength: 128 // Размер тега аутентификации в битах (16 байт)
            },
            key,
            new TextEncoder().encode(message)
        );
        
        // Разделение ciphertext и auth tag (в Web Crypto они уже объединены)
        const ciphertext = new Uint8Array(ciphertextWithTag).slice(0, -16);
        const authTag = new Uint8Array(ciphertextWithTag).slice(-16);
        
        // Конкатенация и преобразование в hex
        const result = arrayBufferToHex(nonce) + arrayBufferToHex(ciphertext) + arrayBufferToHex(authTag);
        
        return "e:"+result;
    } catch (err) {
        throw new Error(`Encryption failed: ${err.message}`);
    }
}


async function decryptAESGCM(_encryptedHex, keyHex) {
    encryptedHex = _encryptedHex.replace("e:","")

    try {
        // Преобразование ключа из hex в ArrayBuffer
        const keyBytes = hexToArrayBuffer(keyHex);
        
        // Импорт ключа
        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        // Разделение nonce, ciphertext и auth tag из hex строки
        const nonce = hexToArrayBuffer(encryptedHex.slice(0, 24)); // 12 байт (24 символа hex)
        const ciphertext = hexToArrayBuffer(encryptedHex.slice(24, -32)); // ciphertext
        const authTag = hexToArrayBuffer(encryptedHex.slice(-32)); // 16 байт (32 символа hex)
        
        // Объединение ciphertext и auth tag
        const ciphertextWithTag = new Uint8Array(ciphertext.length + authTag.length);
        ciphertextWithTag.set(new Uint8Array(ciphertext));
        ciphertextWithTag.set(new Uint8Array(authTag), ciphertext.length);
        
        // Дешифрование
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: nonce,
                tagLength: 128 // Размер тега аутентификации в битах (16 байт)
            },
            key,
            ciphertextWithTag
        );
        
        // Преобразование результата в строку
        return new TextDecoder().decode(decrypted);
    } catch (err) {
        throw new Error(`Decryption failed: ${err.message}`);
    }
}

// Вспомогательные функции для преобразования hex <-> ArrayBuffer
function hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i/2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

module.exports.encryptAESGCM = encryptAESGCM
module.exports.decryptAESGCM = decryptAESGCM
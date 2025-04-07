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
        
        return result;
    } catch (err) {
        throw new Error(`Encryption failed: ${err.message}`);
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
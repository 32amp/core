const fs = require('fs').promises;
const path = require('path');




async function loadConfig(config){
    const { network } = require("hardhat");

    if(typeof network.config.networkid == "undefined")
            throw("Please select network")
    

    try {
        const data = require(`../../configs/${network.name}/${config}.json`)
        return data;
    } catch (error) {
        throw new Error(`Error loading config ${config}.json`)
    }
}

async function saveConfig(name,data) {
    
    const { network } = require("hardhat");

    if (typeof network.config.networkid === "undefined") {
        throw new Error("Please select network");
    }

    // Создаем путь к директории
    const configDir = path.join(__dirname, '../../configs', network.name);
    
    try {
        // Проверяем и создаем директорию (если не существует)
        await fs.mkdir(configDir, { recursive: true });
        
        // Формируем полный путь к файлу
        const filePath = path.join(configDir, `${name}.json`);
        
        // Записываем файл
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Config saved successfully!');
    } catch (err) {
        console.error('Error saving config:', err);
        throw err; // Пробрасываем ошибку для обработки выше
    }
}


module.exports.loadConfig = loadConfig;
module.exports.saveConfig = saveConfig;
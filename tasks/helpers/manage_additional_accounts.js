const fs = require('fs/promises');
const path = require('path');

async function savePrivateKey(address, privateKey) {
  const dirPath = path.join(process.cwd(), 'additional_keys');
  const filePath = path.join(dirPath, `${address}.key`);

  try {
    await fs.mkdir(dirPath, { recursive: true });

    await fs.writeFile(filePath, privateKey, { flag: 'wx' });
    
    return true
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error('Private key already exists');
    }
    throw new Error(`Save failed: ${error.message}`);
  }
}



async function loadAdditionalAccounts(hre) {
  const dirPath = path.join(process.cwd(), 'additional_keys');
  const signers = [];

  try {
    
    await fs.access(dirPath, fs.constants.F_OK);
    
    
    const files = await fs.readdir(dirPath);
    
    
    const keyFiles = files.filter(file => file.endsWith('.key'));

    
    await Promise.all(keyFiles.map(async (file) => {
      try {
        const filePath = path.join(dirPath, file);
        const privateKey = await fs.readFile(filePath, 'utf-8');
        
    
        const wallet = new hre.ethers.Wallet(privateKey.trim(), hre.ethers.provider);
        signers.push(wallet);
      } catch (fileError) {
        console.error(`Error processing file ${file}: ${fileError.message}`);
      }
    }));

  } catch (error) {
    if (error.code !== 'ENOENT') { 
      console.error('Error loading additional accounts:', error.message);
    }
  }

  return signers;
}

module.exports.savePrivateKey = savePrivateKey
module.exports.loadAdditionalAccounts = loadAdditionalAccounts
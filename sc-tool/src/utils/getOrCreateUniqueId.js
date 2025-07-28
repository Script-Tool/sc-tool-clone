const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

function getOrCreateUniqueId() {
  const filePath = './unique_id.txt';
  
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  } else {
    const newId = process.env.VM_NAME.replace(/\s/g, '') + uuidv4();
    fs.writeFileSync(filePath, newId);
    return newId;
  }
}

module.exports = getOrCreateUniqueId;
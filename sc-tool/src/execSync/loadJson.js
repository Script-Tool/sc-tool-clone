const fs = require('fs');

function loadJson(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Error parsing JSON file:', error);
        }
    }
    return {};
}

module.exports = { loadJson };
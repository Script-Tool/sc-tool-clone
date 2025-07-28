const fs = require('fs');
const path = require('path');


function getProfileIds() {
    try {
        let directoryPath = path.resolve("profiles")
        let files = fs.readdirSync(directoryPath)
        if (files && Array.isArray(files)) {
            return files
        }
    } catch (error) {
    }

    return []
}

module.exports = getProfileIds
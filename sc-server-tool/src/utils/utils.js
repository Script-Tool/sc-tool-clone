module.exports = {
    convertTZ(date, tzString) {
        return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
    },
    formatToNull: function (value) {
        return value?value:null
    },
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(function () {
            resolve('ok')
        }, ms));
    },
    randomRanger: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    },
    shuffleArray: function (array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array
    },
    generateCode: function (s, length = 10, isRandomNumber = true) {
        let strCode = s.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
        if (isRandomNumber) {
            strCode = this.randomRanger(1000, 9000) + strCode
        }

        if (length > 0) {
            strCode = strCode.slice(0, length)
        }
        return strCode
    },
    capitalizeFirstLetter(string) {
        let letter = ''
        for (let word of string.split(' ')) {
            letter += word.charAt(0).toUpperCase() + word.slice(1)
        }
        return letter;
    }
}
function getLogCode(timezone, format) {
    const date = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');

    return format.replace('HH', hours).replace('DD', day).replace('MM', month);
}

module.exports = { getLogCode }
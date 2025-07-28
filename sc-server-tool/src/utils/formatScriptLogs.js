function formatScriptLogs(logs = {}) {
  let tempData = {};

  Object.keys(logs).forEach(dateKey => {
    let dateArr = dateKey.split("/");
    let date = `${dateArr[1]}/${dateArr[2]}`;

    if (!tempData[date]) {
      tempData[date] = {
        totalView: logs[dateKey],
        hours: {
          [dateArr[0]]: logs[dateKey]
        }
      };
    } else {
      tempData[date].totalView += logs[dateKey];
      tempData[date].hours[dateArr[0]] = logs[dateKey];
    }
  });

  return tempData;
}

module.exports = {
  formatScriptLogs
};

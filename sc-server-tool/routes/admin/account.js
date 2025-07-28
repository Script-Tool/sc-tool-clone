const express = require('express');
var router = express.Router();
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const upload = multer({ dest: 'tmp/csv/' });
const csv = require('fast-csv')


function getQuery (req) {
  let filter = {}

  if (req.query.type) {
    filter.type = req.query.type
  }

  return filter
}

router.post('/import', upload.single('file'), async function (req, res) {
  try {
    const fileRows = [];
    // open uploaded file
    csv.parseFile(req.file.path)
      .on("data", function (data) {
        fileRows.push(data); // push each row
      })
      .on("end", async function () {
        try {
          fs.unlinkSync(req.file.path);
          if (fileRows[0][0].indexOf('sep=') == 0) {
            fileRows.shift()
          }
          if (fileRows[0][0].toLowerCase().indexOf('email') == 0) {
            fileRows.shift()
          }
          
          const Account = getModel('Account')
          for await (let row of fileRows) {
            await Account.create({
                username: row[0],
                password: row[1],
                verify: row[2],
                type: row[3] || 'gmail'
            })
          }
          
          res.send(result)
        }
        catch (e) {
          console.log('insert-profile-email err:', e)
          res.send(e)
        }
      })
      .on('error', function (e) {
        console.error('parse profile err:', e)
        res.send(e)
      })
  }
  catch (e) {
    console.log('insert-profile-email err:', e)
    res.send(e)
  }
})

router.get('/export', async function (req, res) {
  let Account = getModel('Account')
  let filter = getQuery(req)
  let limit = 5000

  let rows = await Account.find(filter, '-updatedAt -__v -update_id')
  if (!rows.length) {
    return res.json({ success: false })
  }

  let titles = ['username', 'password', 'verify', 'proxy_server']
  let stringData = titles.join(',')
  let dir = 'export'

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let filename = `${dir}/${req.query.type || 'gmail'}-reg-${Date.now()}.csv`
  fs.writeFileSync(filename, stringData);
  stringData = ''

  rows.forEach(row => {
    stringData += '\n'
    row = row.toObject()

    titles.forEach(key => {
      if (row[key] == undefined) {
        stringData += ','
      } else {
        stringData += row[key] + ','
      }
    });

    if (stringData.endsWith(',')) {
      stringData = stringData.slice(0, -1);
    }
  });

  if (stringData) {
    fs.appendFileSync(filename, stringData);
    stringData = ''

    let rowIds = rows.map(row => row._id)
    await Account.deleteMany({ _id: { $in: rowIds } })
  } else {
    return res.json({ success: false })
  }

  let filePath = path.join(rootDir, filename);
  return res.sendFile(filePath);
})

router.get('/delete-all', async function (req, res) {
  try {
    const Account = getModel('Account')
    let filter = getQuery(req)
    await Account.deleteMany(filter)
    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

module.exports = express.Router().use(router)

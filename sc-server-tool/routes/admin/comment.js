const express = require('express');
var router = express.Router();
const modelName = 'Comment'
const multer = require('multer')
const upload = multer({ dest: 'tmp/csv/' });
const csv = require('fast-csv');
const fs = require('fs')

router.get('/add', async function (req, res) {
  try {
    let data = req.query
    let Model = await getModel(modelName)
    await Model.create(data)

    res.send({ success: true })
  }
  catch (e) {
    console.log('error', 'create ' + modelName + ' err: ', e)
    res.send({ err: e })
  }
})

router.get('/delete', async function (req, res) {
  try {
    let id = req.query.id
    let Model = await getModel(modelName)
    await Model.deleteOne({ _id: id })
    res.send({})
  }
  catch (e) {
    console.log('error', 'delete ' + modelName + ' err: ', e)
    res.send({ err: e })
  }
})

router.get('/delete-all', async function (req, res) {
  try {
    let filter = {}
    if (req.query.target) {
      filter.target = req.query.target
    }
    let Model = await getModel(modelName)
    await Model.deleteMany(filter)
    res.send({ success: true })
  } catch (error) {
    console.log(error);
  }
})

router.post('/import', upload.single('file'), function (req, res) {
  try{
    let target = req.query.target
    const fileRows = [];

    // open uploaded file
    csv.parseFile(req.file.path)
        .on("data", function (data) {
            fileRows.push(data); // push each row
        })
        .on("end", async function () {
            try{
                fs.unlinkSync(req.file.path);   // remove temp file
                //process "fileRows" and respond
                if(fileRows[0][0].indexOf('sep=')==0){
                    fileRows.shift()
                }
                if(fileRows[0][0].toLowerCase().indexOf('email')==0){
                    fileRows.shift()
                }

                for await (let row of fileRows) {
                  await getModel('Comment').create({
                    content: row[0], 
                    target: target || ''
                  })
                }
                res.send({ success: true })
            }
            catch (e) {
                console.log('err:',e)
                res.send(e)
            }
        })
        .on('error',function (e) {
            console.error('err:',e)
            res.send(e)
        })
  }
  catch (e) {
    console.log('err:',e)
    res.send(e)
  }
})

module.exports = express.Router().use(router)
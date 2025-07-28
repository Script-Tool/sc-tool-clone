const express = require('express');
var router = express.Router();
const modelName = 'FBGroup'

const multer = require('multer')
const upload = multer({ dest: 'tmp/csv/' });
const csv = require('fast-csv');
const fs = require('fs')

router.post('/import', upload.single('importFile'), async function (req, res) {
  try {
    let Model = getModel(modelName)
    
    let set_id = req.query.set_id

    if (set_id) {
      const fileRows = [];

      csv.parseFile(req.file.path) .on("data", function (data) {
        fileRows.push(data); // push each row
      }).on("end", async function () {
            try{
                fs.unlinkSync(req.file.path);
                if(fileRows[0][0].indexOf('sep=')==0){
                    fileRows.shift()
                }
                if(fileRows[0][0].toLowerCase().indexOf('email')==0){
                    fileRows.shift()
                }
                let set = await getModel('FBGroupSet').findOne({ _id: set_id })
                if (set) {
                  for await (let item of fileRows) {
                    Model.create({
                      link: item[0],
                      name: item[1] || '',
                      set_id: set._id,
                      set_code: set.code,
                    })
                  }
                }
                
                return res.send({})
            }
            catch (e) {
                console.log('insert-profile-email err:',e)
                return res.send(e)
            }
        })
        .on('error',function (e) {
            console.error('parse profile err:',e)
            return res.send(e)
        })
    }
    
  } catch (error) {
    console.log(error);
  }
})

router.get('/delete', async function (req, res) {
  try {
    let id = req.query.id
    let Model = getModel(modelName)
    await Model.deleteOne({ _id: id })
    res.send({})
  }
  catch (e) {
    console.log('error', 'delete err: ', e)
    res.send({ err: e })
  }
})

router.get('/save', async function (req, res) {
  try {
    let data = req.query
    let Model = await getModel(modelName)
    if (data.rowID) {
      await Model.updateOne({ _id: data.rowID }, data)
    } else {
      await Model.create(data)
    }

    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

router.get('/detail', async function (req, res) {
  try {
    let id = req.query.id
    let Model = await getModel(modelName)
    if (id) {
      let doc = await Model.findOne({ _id: id })
      return res.send({ success: true, doc })
    }

    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

router.get('/delete-all', async function (req, res) {
  try {
    let filter = {}
    if (req.query.set_id && req.query.set_id != 'null') {
      filter.set_id = req.query.set_id
    }
    console.log('filter', filter);
    let Model = await getModel(modelName)
    await Model.deleteMany(filter)
    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

module.exports = express.Router().use(router)

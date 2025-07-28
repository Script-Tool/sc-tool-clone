const express = require('express');
var router = express.Router();
const rootApiRequest = require('../../modules/root-api-request')
const multer = require('multer')
const upload = multer({ dest: 'tmp/images/' })
const fs = require('fs')
const axios = require('axios')
var FormData = require('form-data')

router.post('/collection', async function(req, res) {
  try {
    let data = req.body
    data.filter.partner_id = req.customer._id.toString()
    let rs = await rootApiRequest.request({ 
      url: '/image/collection', 
      method: 'POST',
      data,
    })

    if (rs.data) {
      return res.json(rs.data)
    }
  } catch (error) {
      console.log('Error while get comment collection', error)
  }
})

router.post('/create', upload.single('file'), async function(req, res) {
  try {
    let file = req.file
    let fileImage = fs.readFileSync(file.path)
    let formData = new FormData();
    formData.append("type", "file");
    formData.append("image", fileImage);
    axios({
      method: "post",
      url: "https://api.imgur.com/3/image?client_id=546c25a59c58ad7",
      data: formData,
      responseType: "json",
      headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
    }).then(async function (response) {
        let data = response.data.data;
        let rs = await rootApiRequest.request({ 
          url: '/image/create',
          method: 'POST',
          data: {
            partner_id: req.customer._id.toString(),
            path: data.link,
          },
        })
        res.json(rs.data)
      })
      .catch(function (error) {
        console.log(error);
        res.json({ success: false })
      });
  } catch (error) {
    console.log(error);
  }
})

router.delete('/:id', async function(req, res) {
  try {
    let rs = await rootApiRequest.request({ 
      url: '/image/' + req.params.id, 
      method: 'delete',
    })

    if (rs.data) {
      return res.json(rs.data)
    }
  } catch (error) {
      console.log('Error while get comment delete')
  }
})

module.exports = router;

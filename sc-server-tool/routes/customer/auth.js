const express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {OAuth2Client} = require('google-auth-library');
const axios = require('axios')
const md5 = require('md5');
router.post('/register', async function(req, res) {
  let data = req.body
  
  if (data.email) {
    let Customer = await getModel('Customer')
    let existCustomer = await Customer.findOne({ email: data.email })
    if (!existCustomer) {
      await Customer.create({
        email: data.email,
        password: bcrypt.hashSync(data.password, 10),
        is_active: true,
        verify_data: data.email,
      })
      return res.json({ success: true }) 
    } else {
      return res.json({}) 
    }
  }

  return res.json({ success: false })
})

router.post('/login', async function(req, res) {
  let data = req.body
  let CustomerModel = await getModel('Customer')

  if (data.login_type == 'google') {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: data.googleAccessToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload= ticket.getPayload();
    
    if (payload && payload['email']) {
      let user = await CustomerModel.findOne({ verify_data: payload['email'] })
      if (!user) {
        let clientIP = req.ip
        let isNew = false

        if (req.socket.address().family == 'IPv4') {
          let countExistUser = await CustomerModel.countDocuments({ reg_ip: clientIP })
          if (countExistUser == 0) {
            isNew = true
          }
        }

        user = await CustomerModel.create({
          name: payload["name"],
          email: payload['email'],
          avatar_url: payload["picture"],
          is_active: true,
          login_type: 'google',
          verify_data: payload['email'],
          isNew,
          reg_ip: clientIP
        })

        if (user) {
          const WalletModel = getModel('Wallet')
          await WalletModel.create({
            customer: user._id
          })
        }
      }

      let token = jwt.sign({ verify_data: user.verify_data }, process.env.SECRET, {
        expiresIn: '10d',
      })
      await user.updateOne({ jwt_token: token })
      return res.json({ success: true, 
        user: {
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          payment_code: user.payment_code
        }, 
        token 
      })
    }
  } else if (data.login_type == 'facebook') {
    let access_token = data.access_token
    if (access_token) {
      const check = await axios.get(
        `https://graph.facebook.com/me?access_token=${access_token}`
      );

      if (check && check.data && check.data.id) {
        let user = await CustomerModel.findOne({ verify_data: check.data.id })
        if (!user) {
          user = await CustomerModel.create({
            name: check.data.name,
            is_active: true,
            login_type: 'facebook',
            verify_data: check.data.id
          })
        }

        let token = jwt.sign({ verify_data: user.verify_data }, process.env.SECRET, {
          expiresIn: '10d',
        })

        await user.updateOne({ jwt_token: token })
        return res.json({ success: true, 
          user: {
            verify_data: user.verify_data,
            name: user.name
          }, 
          token 
        })
      }
    }
  } else {
    let user = await CustomerModel.findOne({ email: data.email })
    if (user) {
      let rs = md5(data.password)
      if (rs == user.password) {
        let token = jwt.sign({ verify_data: user.email }, process.env.SECRET, {
          expiresIn: '10d',
        })

        await user.updateOne({ jwt_token: token })
        return res.json({ success: true, 
          user: {
            verify_data: user.email,
            name: user.name
          }, 
          token 
        })
      }
    }
  }

  return res.json({ status: 'error', message: 'Đăng nhập thất bại' })
})

router.post('/logout', async function(req, res) {
  console.log('adsg', req.body);
  return res.json({ success: true })
})

module.exports = router;

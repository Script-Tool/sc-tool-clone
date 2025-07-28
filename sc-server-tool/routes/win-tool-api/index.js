var express = require('express')
var router = express.Router();
const helperRoute = require('./helper')
const authRoute = require('./auth')
const servicePackRoute = require('./service')
const orderRoute = require('./order')
const paymentRoute = require('./payment')
const keywordToolRoute = require('./keyword-tool')
const chatRoute = require('./chat')
const checkMailRoute = require('./check-mail')
const authMiddleware = require('../middleware/auth')
const customerRoute = require('./customer')
const scriptRoute = require('./script')
const commentRoute = require('./comment')
const imageRoute = require('./image')
const profileRoute = require('./profile')
const proxyRoute = require('./proxy')
const contentRoute = require('./content')

const md5 = require('md5');
router.post('/register', async function(req, res) {
  let data = req.body
  
  if (data.email) {
    let Customer = getModel('Customer')
    let existCustomer = await Customer.findOne({ email: data.email })
    if (!existCustomer) {
      await Customer.create({
        email: data.email,
        password: md5(data.password),
        is_active: true,
        verify_data: data.email,
      })
      return res.json({ success: true , status: 'success', message: 'Đăng ký thành công.' })
    } else {
      return res.json({ status: 'error', message: 'Email đã tồn tại.' })
    }
  }

  return res.json({ success: false })
})

router.use('/keyword-tool', keywordToolRoute)
router.use(authMiddleware.customerAuth)

router.use('/check-mail', checkMailRoute)
router.use('/chat', chatRoute)
router.use('/payment', paymentRoute)
router.use('/order', orderRoute)
router.use('/helper', helperRoute)
router.use('/auth', authRoute)
router.use('/service', servicePackRoute)
router.use('/customer', customerRoute)
router.use('/script', scriptRoute)
router.use('/comment', commentRoute)
router.use('/image', imageRoute)
router.use('/profile', profileRoute)
router.use('/proxy', proxyRoute)
router.use('/content-repo', contentRoute)

module.exports = router;

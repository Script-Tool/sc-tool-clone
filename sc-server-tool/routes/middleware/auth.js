const jwt = require('jsonwebtoken')
module.exports = {
  userAuth: async function(req, res, next) {
    let cookies = req.headers.cookie
    if (cookies) {
      cookies = cookies.split(';')
      let token = ''
      cookies.forEach(cookie => {
        if (cookie.indexOf(secret) > -1) {
          if (cookie.split('=').length > 1) {
            token = cookie.split('=')[1]
          }
        }
      });

      if (token) {
        let UserModel = await getModel('User')
        let user = await UserModel.findOne({ tokens: { $in: token } })
        if (user) {
          res.role = user.role
          next()
          return
        }
      }
    }

    return res.redirect('/login');
  },
  customerAuth: async function (req, res, next) {
    let ignorePaths = ['/auth/', '/service/group']
    if (req.path.includes('/service/gifts') && (!req.headers.authorization || req.headers.authorization == 'null')) {
      return next()
    }

    for (let path of ignorePaths) {
      if (req.path.includes(path)) {
        return next()
      }
    }

    let CustomerModel = await getModel('Customer')
    let token = req.headers.authorization
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: 'error',
          message: 'Your current session has expired, please login again',
          debug: err.message
        })
      }

      CustomerModel.findOne({ verify_data: decoded.verify_data }).then((customer) => {
        if (!customer) {
          return res
            .status(401)
            .json({ status: 'error', message: 'The login token is not valid, or customer no longer exist' })
        }

        // check if the token still active
        if (!customer.jwt_token || customer.jwt_token != token) {
          return res
            .status(401)
            .json({ status: 'error', message: 'Invalid session. Please login again' })
        }

        if (!customer.is_active) {
          return res.status(401).json({ status: 'error', message: 'Your account has been banned' })
        }

        req.customer = customer
        next()
      })
      .catch((err) => {
        console.log('Error while authenticating customer:', err)
        return res.status(401).json({ status: 'error', message: err })
      })
    })
  }
}

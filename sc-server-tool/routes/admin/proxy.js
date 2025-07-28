const express = require('express');
const proxy_model = require('../../model/proxy_model')
const rq = require('request-promise')
const multer = require('multer')
const upload = multer({ dest: 'tmp/csv/' });
const csv = require('fast-csv');
const fs = require('fs')
const path = require('path')

var router = express.Router();

router.get('/renew-all-proxy', async function(req, res) {
    try {
        let Proxy = await getModel('Proxy')

        await Proxy.updateMany({used: true}, {used: false})
        res.send({success: true})
    } catch (error) {
        console.log(error);
    }
})

router.get('/delete-all', async function(req, res) {
    try {
        let Proxy = await getModel('Proxy')
        await Proxy.deleteMany()
        await Proxy.reloadGlobalProxy()
        res.send({success: true})
    } catch (error) {
        console.log(error);
    }
})

router.get('/', async function(req, res, next) {
    console.log('------>>>>>>');
    let Proxy = await getModel('Proxy')
    let proxyTotal = await Proxy.find({ }).countDocuments() 
    let proxyActive = await Proxy.find({
        updatedAt: { // 5 minutes ago (from now)
            $gt: new Date(Date.now() - 1000 * 60 * 5)
        }
    }).countDocuments() 
    let proxyUnactive = proxyTotal - proxyActive
    
    res.render('oam/proxy', { title: 'Proxy', 
        info: { proxyUnactive, proxyActive, proxyTotal } });
});

router.get('/export', async function(req, res) {
    try {
      const Proxy = getModel('Proxy');
      const proxies = await Proxy.find({}, 'server username password -_id').lean();
      res.json({ proxies });
    } catch (error) {
      console.error('Error exporting proxies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = express.Router().use(router)
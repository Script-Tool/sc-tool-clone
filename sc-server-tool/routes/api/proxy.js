const express = require("express");
var router = express.Router();

router.get("/get-profile-proxy", async (req, res) => {
  try {
    const { pid, action, isLoadNewProxy } = req.query;
    const Proxy = getModel("Proxy");
    const Profile = getModel("Profile");

    // Check if we need to return an existing proxy
    if (
      (action == 3 && youtube_config.check_proxy_for_login) ||
      youtube_config.check_proxy
    ) {
      if (pid) {
        const profile = await Profile.findOne({ id: pid });
        if (profile && profile.proxy_server) {
          const proxy = await Proxy.findOne({ server: profile.proxy_server });
          if (proxy) return res.send(proxy);
        }
      }
    }

    // Try to get a proxy from the predefined list
    if (proxies && proxies.length) {
      const p = proxies[Math.floor(Math.random() * proxies.length)].split("-");
      if (youtube_config.check_proxy_for_login && pid) {
        await Profile.updateOne({ id: pid }, { proxy_server: p[0] });
      }
      return res.send({ server: p[0], username: p[1], password: p[2] });
    }

    // Get a random unused proxy from the database
    const countRs = await Proxy.countDocuments({ used: false });
    const randomPosition = Math.floor(Math.random() * countRs);

    let proxy;
    if (
      (youtube_config.change_proxy_for_channel && action == 0) ||
      youtube_config.is_reg_account
    ) {
      proxy = await Proxy.findOne({ used: false }).skip(randomPosition);
    } else if (pid) {
      const profile = await Profile.findOne({ id: pid });
      if (!profile)
        return res.send({ error: true, message: "Profile not found" });

      if (!isLoadNewProxy) {
        proxy = await Proxy.findOne({ id: profile.proxy });
      }

      if (!proxy) {
        proxy = await Proxy.findOne({ used: false }).skip(randomPosition);
        if (proxy) {
          if (profile.proxy) {
            await Proxy.updateOne({ id: profile.proxy }, { used: false });
          }
          profile.proxy = proxy.id;
          await profile.save();
        }
      }
    } else {
      return res.send({ error: true, message: "Missing pid" });
    }

    if (!proxy && youtube_config.auto_renew_proxy) {
      await Proxy.updateMany({}, { used: false });
      proxy = await Proxy.findOne({ used: false });
    }

    if (!proxy) return res.send({ error: true, message: "No proxy available" });

    proxy.used = true;
    await proxy.save();

    res.send(proxy);
  } catch (error) {
    console.error("getProfileProxy error:", error);
    res.send({ error: true });
  }
});

router.get("/get-proxy-v4", async function (req, res) {
  let ProxyV4 = await getModel("ProxyV4");
  let totalProxyV4 = await ProxyV4.find({ status: true }).countDocuments();

  async function getActiveProxy() {
    let proxyFilter = { status: true };
    let countRs = await ProxyV4.find(proxyFilter).countDocuments();
    let randomPosition = Math.floor(Math.random() * countRs);
    return ProxyV4.findOne(proxyFilter, "server status").skip(randomPosition);
  }

  let tryCheck = 0;
  while (tryCheck < totalProxyV4) {
    let _proxy = await getActiveProxy();
    if (_proxy) {
      // let checkRs = await proxy_check(_proxy.server).then(r => {
      //   return true
      // }).catch(e => {
      //   return false
      // });
      let checkRs = true;
      if (checkRs) {
        return res.send(_proxy);
      } else {
        await _proxy.updateOne({ status: false });
      }
    }
    tryCheck++;
  }

  return res.send({
    error: "Not found proxy.",
  });
});

module.exports = router;

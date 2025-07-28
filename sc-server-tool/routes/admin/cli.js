const express = require('express');
var router = express.Router();
const scriptGptModule = require('../../modules/gpt-script');
const { videoNamesFromChannelID } = require('../../src/services/youtube-api/videoNamesFromChannelID');

router.get('/test-gpt', async function(req, res, next) {
    let rs = await scriptGptModule.generateScript()
    return res.json(rs)
})

router.get('/get-spams', async function(req, res, next) {
    const ServiceModel = getModel('Service')
    let percentSpam = 2
    if (req.query.percent_spam) {
        percentSpam = Number(req.query.percent_spam)
    }
    let currentPage = 0
    const perPage = 500

    let spams = []
    async function exec(sv) {
        try {
            if (sv.total_remaining / sv.fisrt_remaining >= percentSpam) {
                spams.push({
                    id: sv.id,
                    spam_data: `${sv.total_remaining} / ${sv.fisrt_remaining}`,
                    createdAt: sv.createdAt,
                })
            }
            if (!sv.total_remaining && sv.remaining) {
                await sv.updateOne({ total_remaining: sv.remaining })
            }
        } catch (error) {
            console.log(sv);
            console.log('error', error);
        }
    }

    while (true) {
        const services = await ServiceModel.find({ script_code: 'youtube_sub' }, 'id createdAt fisrt_remaining total_remaining remaining').skip(currentPage * perPage).limit(perPage)
        if (!services || !services.length) {
            break
        }

        await Promise.all(services.map(sv => exec(sv)))
        currentPage++
    }

    res.json({ spams, count: spams.length })
})

router.get('/load-total-remaining', async function(req, res, next) {
    const ServiceModel = getModel('Service')

    let currentPage = 0
    const perPage = 500

    async function exec(sv) {
        try {
            if (!sv.total_remaining && sv.remaining) {
                await sv.updateOne({ total_remaining: sv.remaining })
            }
        } catch (error) {
            console.log(sv);
            console.log('error', error);
        }
    }

    while (true) {
        const services = await ServiceModel.find({ script_code: 'youtube_sub' }, 'total_remaining remaining').skip(currentPage * perPage).limit(perPage)
        console.log('currentPage', currentPage, services.length);
        if (!services || !services.length) {
            break
        }

        await Promise.all(services.map(sv => exec(sv)))
        currentPage++
    }

    res.json({  })
})

router.get('/load-watch-time', async function(req, res, next) {
    const ServiceModel = getModel('Service')

    let currentPage = 0
    const perPage = 500

    async function exec(sv) {
        try {
            let data = JSON.parse(sv.data)
            data.watch_time = ""
            await sv.updateOne({ data: JSON.stringify(data) })
        } catch (error) {
            console.log(sv);
            console.log('error', error);
        }
    }

    while (true) {
        const services = await ServiceModel.find({ script_code: 'youtube_sub' }, 'data').skip(currentPage * perPage).limit(perPage)
        console.log('currentPage', currentPage, services.length);
        if (!services || !services.length) {
            break
        }

        await Promise.all(services.map(sv => exec(sv)))
        currentPage++
    }

    res.json({  })
})

router.get('/get-video-names-for-sub-service', async function(req, res, next) {
    const ServiceModel = getModel('Service')

    let currentPage = 0
    const perPage = 500

    async function exec(sv) {
        try {
            if (Array.isArray(sv.names) && sv.names.length >= 3 && sv.channel_title) {
                return
            }

            let data = JSON.parse(sv.data)
            let channelID = data.channel_id
            if (!channelID.startsWith('channel/')) {
                return
            }
            channelID = channelID.replace('channel/', '')
            let rs = await videoNamesFromChannelID(channelID);
            let updateData = {}
            if (Array(rs.names) && rs.names.length) {
                updateData.names = rs.names
            }
            if (rs.channelTitle) {
                updateData.channel_title = rs.channelTitle
            }

            if (Object.keys(updateData).length) {
                console.log(`-${updateData.names.length}-${updateData.channel_title}`);
                await sv.updateOne(updateData)
            }
        } catch (error) {
            console.log(sv);
            console.log('error', error);
        }
    }

    while (true) {
        const services = await ServiceModel.find({ script_code: 'youtube_sub' }, 'data names channel_title').skip(currentPage * perPage).limit(perPage)
        console.log('currentPage', currentPage, services.length);
        if (!services || !services.length) {
            break
        }

        await Promise.all(services.map(sv => exec(sv)))
        currentPage++
    }

    res.json({  })
});

module.exports = router;

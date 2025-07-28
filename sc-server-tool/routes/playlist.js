const express = require('express');

const router = express.Router();

// Route để cập nhật cấu hình
router.get('/update-config', async (req, res) => {
    try {
        console.log('update-config:', req.query);
        const updateConfig = req.query.config;

        if (typeof updateConfig === 'object') {
            youtube_config = updateConfig;
            res.send({ result: 'update config ok' });
        }
    } catch (e) {
        console.log('error', 'update-channel err: ', e);
        res.send({ err: e });
    }
});

// Route để xóa playlist
router.get('/delete-playlist', async (req, res) => {
    try {
        const deleteId = req.query.id;
        const Playlist = await getModel('Playlist');
        await Playlist.deleteOne({ _id: deleteId });
        res.send({ result: 'delete ok' });
    } catch (e) {
        console.log('error', 'update-channel err: ', e);
        res.send({ err: e });
    }
});

// Route để xóa video
router.get('/delete-video', async (req, res) => {
    try {
        const deleteId = req.query.id;
        const YTVideo = await getModel('YoutubeVideo');
        await YTVideo.deleteOne({ _id: deleteId });
        res.send({ result: 'delete ok' });
    } catch (e) {
        console.log('error', 'update-channel err: ', e);
        res.send({ err: e });
    }
});





module.exports = router;
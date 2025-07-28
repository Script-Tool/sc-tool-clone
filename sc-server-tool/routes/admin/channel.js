const express = require('express');
const router = express.Router();
const channelController = require('../../src/controllers/channelController');

// Create a new channel
router.post('/', channelController.createChannel);

// Get all channels
router.get('/', channelController.getAllChannels);

// Get a single channel
router.get('/:channelId', channelController.getChannel);

// Update a channel
router.put('/:channelId', channelController.updateChannel);

// Delete a channel
router.delete('/:id', channelController.deleteChannel);

module.exports = router;
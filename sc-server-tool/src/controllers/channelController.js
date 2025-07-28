
// Create a new channel
exports.createChannel = async (req, res) => {
  try {
    const Channel = getModel("Channel");
    const { channelId, tags, pllDescription } = req.body;
    const channel = new Channel({ channelId, tags, pllDescription });
    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all channels
exports.getAllChannels = async (req, res) => {
  try {
    const Channel = getModel("Channel");
    const channels = await Channel.find();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single channel by ID
exports.getChannel = async (req, res) => {
  try {
    const Channel = getModel("Channel");
    const channel = await Channel.findOne({ channelId: req.params.channelId });
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json(channel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a channel
exports.updateChannel = async (req, res) => {
  try {
    const Channel = getModel("Channel");
    const { tags, pllDescription } = req.body;
    const channel = await Channel.findOne({ channelId: req.params.channelId });
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    if (tags) channel.tags = tags;
    if (pllDescription) channel.pllDescription = pllDescription;
    channel.lastChecked = new Date(); // Update lastChecked date

    await channel.save();
    res.json(channel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a channel
exports.deleteChannel = async (req, res) => {
  try {
    const Channel = getModel("Channel");
    const channel = await Channel.findOneAndDelete({ _id: req.params.id });
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const mongoose = require('mongoose');

const BraveInstallationSchema = new mongoose.Schema(
    {
        vmId: { type: String, unique: true, required: true },
        isInstalled: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

module.exports = BraveInstallationSchema;

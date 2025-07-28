const { SCRIPT_CODES, WATCH_VIDEO_SCRIPTS, DECREMENT_CODES } = require('../utils/constants');
const SpecialCaseHandler = require('../utils/SpecialCaseHandler');
const DataReportedHandler = require('../utils/DataReportedHandler');

class ServiceService {
    static async getRandomDirectLinkService() {
        const Service = await getModel('Service');
        const directLinkServices = await Service.find({
            script_code: 'direct_link',
        });
        const directLinkService = this.getRandomElement(directLinkServices);
        return directLinkService ? JSON.parse(directLinkService.data) : {};
    }

    static async getService(script, pid) {
        const availableServices = await this.getAvailableServices(script);
        if (!availableServices.length) return;

        for (const service of this.shuffleArray(availableServices)) {
            if (!service.data) continue;

            const update = { last_report_time: Date.now() };

            const Profile = await getModel('Profile');
            const profile = await Profile.findOne(
                { id: pid },
                {
                    email: 1,
                    password: 1,
                    _id: 1,
                    twoFA: 1,
                    verified: 1,
                    youtube_key: 1,
                    channel_link: 1,
                    backup_code: 1,
                    verified_studio: 1,
                    is_reset_backup_code: 1,
                    is_change_2fa: 1,
                },
            );

            let serviceData = null;
            let data = null;
            if (profile) {
                switch (service.script_code) {
                    case 'create_2fa':
                        if (profile?.twoFA) return null;
                        service.password = profile?.password;
                        break;

                    case 'change_2fa':
                    case 'create_backup_codes':
                    case 'delete_backup_codes': {
                        if (service.script_code === 'create_backup_codes') {
                            if (profile?.backup_code && !profile?.is_reset_backup_code) {
                                return null;
                            }
                        }

                        if (service.script_code === 'delete_backup_codes' && !profile?.backup_code) {
                            return null;
                        }

                        if (service.script_code === 'change_2fa') {
                            if (!profile?.is_change_2fa) {
                                return null;
                            }
                        }

                        let backupCode;
                        if (!profile?.twoFA && profile?.backup_code) {
                            backupCode = await this.pickBackupCode(profile);
                        }

                        data = {
                            email: profile?.email,
                            password: profile?.password,
                            twoFA: profile?.twoFA,
                            backupCode,
                        };
                        break;
                    }

                    case 'create_channel_youtube':
                        if (profile?.channel_link) return null;
                        break;

                    case 'step_2_authentication':
                        if (profile?.verified) return null;
                        break;

                    case 'create_youtube_key':
                        if (profile?.youtube_key) return null;
                        break;

                    default:
                        break;
                }
            }

            if (DECREMENT_CODES.includes(service.script_code) && service.remaining > 0) {
                update.remaining = service.remaining - 1;
                if (update.remaining === 1) {
                    update.remaining = 0;
                }
            }

            await service.updateOne(update);

            try {
                const afterRs = await service.handleData(script, '', {
                    pid: pid,
                    partner_id: service?.partner_id,
                });

                if (afterRs)
                    return {
                        ...data,
                        ...afterRs,
                        data: serviceData,
                        success: true,
                    };
            } catch (error) {
                console.error('Error handling service data:', error);
            }
        }
    }

    static async pickBackupCode(profile) {
        const Profile = await getModel('Profile');

        if (!profile?.twoFA && profile?.backup_code) {
            const backupCodes = profile.backup_code.split('|').filter(Boolean);
            if (!backupCodes.length) return null;

            const backupCode = backupCodes[Math.floor(Math.random() * backupCodes.length)];
            const updatedCodes = backupCodes.filter((code) => code !== backupCode).join('|');

            console.log(backupCodes.filter((code) => code !== backupCode).length);

            await Profile.updateOne({ _id: profile._id }, { backup_code: updatedCodes });

            return backupCode;
        }
        return null;
    }

    static async getAvailableServices(script) {
        const Service = await getModel('Service');
        const serviceFilter = {
            is_stop: { $ne: true },
            script_code: script.code,
            $or: [
                // Các service không có delay
                {
                    start_max_time: { $in: [null, 0, false] },
                    $or: [
                        { remaining: { $gt: 1 } },
                        {
                            remaining: -1,
                            script_code: {
                                $nin: ['comment_youtube', 'like_youtube', 'youtube_sub'],
                            },
                        },
                    ],
                },
                // Các service có delay và đã đủ thời gian
                {
                    start_max_time: { $gt: 0 },
                    $expr: {
                        $lt: [
                            '$last_report_time',
                            {
                                $subtract: [new Date(), '$start_max_time'],
                            },
                        ],
                    },
                    $or: [
                        { remaining: { $gt: 1 } },
                        {
                            remaining: -1,
                            script_code: {
                                $nin: ['comment_youtube', 'like_youtube', 'youtube_sub'],
                            },
                        },
                    ],
                },
            ],
        };

        // Thêm điều kiện đặc biệt cho ai_create_video
        // if (script.code === "ai_create_video") {
        //   serviceFilter.$and = [
        //     {
        //       $expr: {
        //         $and: [
        //           // Đảm bảo data là string hợp lệ
        //           { $ne: ["$data", null] },
        //           { $ne: ["$data", ""] },
        //           // Kiểm tra data có audioLink rỗng
        //           {
        //             $regexMatch: {
        //               input: "$data",
        //               regex: '"audioLink":\\s*""'
        //             }
        //           }
        //         ]
        //       }
        //     }
        //   ];
        // }

        const totalSv = await Service.countDocuments(serviceFilter);
        const randomPosition = Math.floor(Math.random() * totalSv);

        const service = await Service.findOne(serviceFilter).skip(randomPosition);
        return service ? [service] : [];
    }

    static getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    static async processReport(serviceId, pid, email, status, data_reported) {
        if (status === false || status === 'false') {
            status = false;
        }
        const Service = await getModel('Service');
        const Log = await getModel('Log');
        const service = await Service.findOne(
            { _id: serviceId },
            'order_id data one_time script_code first_data_reported data_reported start_max_time remaining executed fisrt_remaining first_data_reported_watch_new total_remaining_new retries id _id retries',
        ).lean();

        if (!service) {
            throw new Error('Not found report service');
        }
        const script_code = service.script_code;

        SpecialCaseHandler.handle(script_code, pid);
        const updateOperations = {};

        // Sử lý dữ liệu Update
        // Thành công
        if (status && status !== 'false') {
            // Xử lý lưu link
            Object.assign(updateOperations, this.buildUpdateOperations(service, data_reported, status));
        } else {
            // Thất bại
            Object.assign(updateOperations, this.buildUpdateOperations(service, data_reported, status));
            await Log.add({
                message: `${data_reported}`,
                script_code: script_code,
            });
        }

        if (data_reported) {
            await DataReportedHandler.handle(service, data_reported, pid, email, updateOperations);
        }

        const updatedService = await Service.findOneAndUpdate({ _id: serviceId }, updateOperations, { new: true });

        return { message: 'Report processed successfully' };
    }

    // Xử lý dữ liệu Update service sau khi report
    static buildUpdateOperations(service, dataReported = '', status) {
        let newDataReport = dataReported;
        const update = {
            $inc: { executed: 1 },
            last_report_time: Date.now(),
        };

        if (WATCH_VIDEO_SCRIPTS.includes(service.script_code)) {
            this.updateRemainingForWatchVideo(service, update);
        } else if (service.remaining > 0) {
            update.$inc.remaining = -1;
        }

        if (service.script_code === SCRIPT_CODES.SCAN_GROUP) {
            update.is_stop = true;
        }

        if (dataReported) {
            update.data_reported = newDataReport;
            update.first_data_reported = newDataReport;
        }

        return update;
    }

    static updateRemainingForWatchVideo(service, update) {
        const remaining = Number(service.remaining);
        if (remaining > 1) {
            update.$inc.remaining = -1;
        } else if (remaining !== -1) {
            update.remaining = 1;
        }
    }
}

module.exports = ServiceService;

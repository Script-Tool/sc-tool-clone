const express = require('express');
const router = express.Router();
const { getChannelInfo } = require('../../src/services/youtube-api/getChannelInfo');
const { getLogCode } = require('../../src/utils/getLogCode');
const extractUsernameOrChannelId = require('../../src/utils/extractUsernameOrChannelId');
const { sleep } = require('../../src/utils/utils');
const axios = require('axios');
const { getVideoInfo } = require('../../src/services/youtube-api/getVideoInfo');
const getYoutubeVideoId = require('../../src/utils/getYoutubeVideoId');

/**
 * Tạo mới order
 */
router.post('/service', async function (req, res) {
    try {
        const data = {};
        let ServiceModel = getModel('Service');
        const body = req.body;

        const script = await getModel('Script').findOne({ code: body.scriptCode });
        const start_max_time = body?.delayTime || script.default_service_data?.start_max_time || 9999;
        const end_max_time = body?.delayTime || script.default_service_data?.end_max_time || 9999;

        if (script) {
            let serviceData =
                (script.default_service_data?.data
                    ? JSON.parse(script.default_service_data?.data)
                    : script.default_service_data) || {};
            body.customerEnteredValues.forEach((att) => {
                serviceData[att.attributeCode] = att.enteredValue;
            });

            formatCustomerValue(body.scriptCode, serviceData);
            data.service_code = body.scriptCode;
            data.service_data = serviceData;
            data.total = body.qty;
            data.order_id = body.order_id;
            data.delay_time = body.delayTime;
        } else res.json({ success: false, error: 'Script not found' });
        /**
         * Kiểm tra đơn trùng lặp
         * Trả laij thất bại khi khách đặt liên tục một đơn trong khoảng thời gian ngắn
         */

        let regexData = '';
        switch (data.service_code) {
            case 'youtube_sub':
                regexData = data.service_data.channel_id;
                data.service_data.channel_id = extractUsernameOrChannelId(data.service_data.channel_id);

                break;
            case 'like_youtube':
            case 'comment_youtube':
            case 'watch_video':
                regexData = data.service_data.video_id;
                break;
            default:
                regexData = data.service_data.channel_id;
                break;
        }
        if (previousService == regexData) {
            await sleep(3000);
            previousService = regexData;
            return res.json({
                success: false,
                message: 'Bạn vừa đặt hàng dịch vụ này trước đó. Hãy đợi cho đơn hoàn thành trước khi tiếp tục',
            });
        } else {
            /**
             * Trả lại false khi có đơn đang chạy
             */
            if (regexData) {
                const findService = await ServiceModel.findOne({
                    data: { $regex: regexData },
                    remaining: { $gt: 0 },
                    is_stop: false,
                });
                previousService = regexData;
                if (findService && findService.script_code == body.scriptCode) {
                    return res.json({
                        success: false,
                        message: 'Có dịch vụ tương tự đang chạy. Hãy đợi cho đơn hoàn thành trước khi tiếp tục',
                        qty: findService.fisrt_remaining,
                        startCount: findService.fisrt_value_log,
                        orderId: findService.order_id,
                        ...JSON.parse(findService.data),
                    });
                }
            }
        }

        previousService = regexData;

        if (data) {
            if (!data.service_code || !data.total || !data.service_data) {
                return res.json({ success: false, message: 'Dữ liệu không hợp lệ' });
            }

            let service;
            if (script) {
                let handleServiceData = {}; //data.service_data
                if (data.service_code == 'comment_youtube' || data.service_code == 'like_youtube') {
                    regexData = getYoutubeVideoId(regexData);
                    const videoInfo = await getVideoInfo(regexData);
                    handleServiceData = {
                        video_name: videoInfo?.snippet?.title,
                        channel_id: videoInfo?.snippet?.channelId,
                        channel_title: videoInfo?.snippet?.channelTitle,
                        video_id: regexData,
                        statistics: videoInfo?.statistics,
                        comment: data?.service_data?.comments || '',
                    };
                    handleServiceData.video_ids = regexData;
                } else if (data.service_code == 'watch_video') {
                    // load video data
                    let response = await axios.get(
                        `https://www.googleapis.com/youtube/v3/videos?id=${regexData}&key=AIzaSyA1QcEYwAvCQEXkRvPlFF_IFeEO93cA-GY&part=snippet,contentDetails,statistics`,
                    );

                    handleServiceData.keyword = response.data.items[0].snippet.title;
                    handleServiceData.playlist_url = handleServiceData.video_id;
                } else {
                    handleServiceData = data.service_data;
                }

                const defaultData = JSON.parse(script.example_data);
                const serviceData = Object.assign(defaultData, handleServiceData);

                if (service) {
                    await service.updateOne({
                        script_code: data.service_code,
                        remaining: data.total,
                        data: JSON.stringify(serviceData),
                    });
                } else {
                    service = await getModel('Service').create({
                        script_code: data.service_code,
                        remaining: data.total,
                        data: JSON.stringify(serviceData),
                        order_id: data.order_id,
                        fisrt_remaining: data.total,
                        start_max_time: start_max_time,
                        end_max_time: end_max_time,
                    });
                }

                if (service.status == 'error') {
                    throw 'đơn lỗi';
                }
                if (service) {
                    return res.json({
                        success: true,
                        message: 'Tạo dịch vụ thành công',
                        service_code: service.script_code,
                        qty: data.total,
                        orderId: service.order_id,
                        startCount: service.fisrt_value_log,
                        status: service.status,
                    });
                }
            }

            return res.json({ success: false, message: 'Không thể tạo dịch vụ' });
        }

        return res.json({ success: false, message: 'Dữ liệu không hợp lệ' });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
});

router.get('/active-scripts', async function (req, res) {
    let scripts = await getModel('Script').find({
        status: true,
        code: { $nin: ['end_script'] },
    });
    scripts = scripts.map((script) => {
        const data = {
            scriptCode: script.code,
        };

        const scriptGroupCodes = ['google', 'youtube', 'tiktok', 'facebook'];
        for (let scriptGroupCode of scriptGroupCodes) {
            if ((script.script_type || []).includes(scriptGroupCode)) {
                data.scriptGroupCode = scriptGroupCode;
                break;
            }
        }
        return data;
    });
    res.json({ success: true, scripts });
});

function formatCustomerValue(scriptCode, customerEnteredValues) {
    if (scriptCode == 'youtube_sub') {
        if (customerEnteredValues.channel_id) {
            customerEnteredValues.channel_id = customerEnteredValues.channel_id.replace('https://www.youtube.com/', '');
        }
    }
}

router.post('/service', async function (req, res) {
    try {
        const body = req.body;
        const ServiceModel = getModel('Service');

        const script = await getModel('Script').findOne({ code: body.scriptCode });
        if (script) {
            let serviceData =
                (script.default_service_data?.data
                    ? JSON.parse(script.default_service_data?.data)
                    : script.default_service_data) || {};
            body.customerEnteredValues.forEach((att) => {
                serviceData[att.attributeCode] = att.enteredValue;
            });

            formatCustomerValue(body.scriptCode, serviceData);

            console.log('body', body, serviceData);
            const serviceCreated = await ServiceModel.create({
                script_code: body.scriptCode,
                remaining: body.qty,
                fisrt_remaining: body.qty,
                data: JSON.stringify(serviceData),
                order_id: body.order_id,
            });

            let result = { success: true, serviceId: serviceCreated.id };
            if (serviceCreated.fisrt_value_log) {
                result.startCount = serviceCreated.fisrt_value_log;
            }
            res.json(result);
        } else res.json({ success: false, error: 'Script not found' });
    } catch (error) {
        console.error('Error while create service , error: ', error);
        res.json({ success: false, error: 'Error while create service' });
    }
});

/**
 * Lấy thông tin service
 */
router.get('/service/:order_id', async function (req, res) {
    const order_id = req.params.order_id;
    const ServiceModel = getModel('Service');

    const service = await ServiceModel.findOne({ order_id });
    if (service) {
        const serviceData = {
            orderId: order_id,
            scriptCode: service.script_code,
            qty: service.fisrt_remaining,
            remains: service.remaining,
            start_count: service.fisrt_value_log,
            // New
            is_running: !service.is_stop,
            note: service.note,
            data_reported: service.data_reported,
        };

        let status = service.remaining == 0 ? 'completed' : 'is_running';
        if (service.remaining == 0) {
            (status = 'completed'), (serviceData.message = 'service has been completed');
        } else {
            status = 'is_running';
            serviceData.message = 'service is running';
        }

        if (service.status == 'error') {
            status = 'error';
            serviceData.message = 'Contact the administrator to resolve';
        } else if (service.is_stop) {
            status = 'is_stop';
            serviceData.partial_refund = service.partial_refund;
            serviceData.message = 'The service has been stopped by an administrator or customer';
        } else if (service.status == 'baohanh' && service.remaining > 0) {
            status = 'under_warranty';
            serviceData.message = 'Service is under warranty';
        } else if (service.status == 'baohanh' && service.remaining == 0) {
            status = 'warranty_completed';
            serviceData.message = 'Warranty completed';
        }
        serviceData.status = status;
        return res.json({ success: true, service: serviceData });
    } else res.json({ success: false, error: 'Service not found' });
});

// api dừng đơn hoặc chạy lại
router.post('/service/status', async function (req, res) {
    try {
        const order_id = req.body.code;
        if (!order_id) {
            return res.status(400).json({ success: false, message: 'Missing service order ID' });
        }

        const currentService = await getModel('Service').findOne({
            order_id: order_id,
        });

        if (!currentService) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        const script_code = currentService.script_code;
        const script = await getModel('Script').findOne({ code: script_code }, 'logsSubMissing');
        const logsSubMissing = script?.logsSubMissing || {};
        const responseData = { success: true };

        const { fisrt_remaining = 0, fisrt_value_log = '', _id, is_stop, partial_refund } = currentService;
        responseData.fisrt_remaining = fisrt_remaining;
        responseData.fisrtValue = fisrt_value_log;

        // Khách chạy lại đơn nhưng đơn hiện tại đang chạy
        if (req.body.is_active && !is_stop) {
            responseData.message = 'Service is running';
            return res.json({ ...responseData });
        } else if (!req.body.is_active && is_stop) {
            // Khách chạy dừng đơn nhưng đơn hiện tại đã bị dừng trước đó
            responseData.message = 'Service has been temporarily stopped';
            responseData.partial_refund = partial_refund;
            return res.json({ ...responseData });
        }
        let serviceUpdate = {};

        if (script_code === 'youtube_sub') {
            const data = JSON.parse(currentService.data);
            const channelId = data.channel_id.replace('channel/', '');
            const channelInfo = await getChannelInfo(channelId);

            if (channelInfo.error) {
                throw new Error('Failed to fetch channel information');
            }

            const currentSub = Number(channelInfo.subscriberCount);
            responseData.subscriberCount = currentSub;

            const targetValue = fisrt_remaining + Number(fisrt_value_log);
            const subMissing = targetValue - currentSub;
            serviceUpdate.partial_refund = subMissing;
            const logCode = getLogCode('Asia/Ho_Chi_Minh', 'HH/DD/MM');

            // Khách hàng cancel đơn
            if (!is_stop && !req.body.is_active) {
                if (subMissing > 0) {
                    logsSubMissing[logCode] = (logsSubMissing[logCode] || 0) + subMissing;
                    responseData.partial_refund = subMissing;
                    responseData.status = 'stop_success';
                    await script.updateOne({ logsSubMissing });
                } else if (subMissing <= 0) {
                    responseData.partial_refund = 0;
                    serviceUpdate.remaining = 0;
                    responseData.status = 'completed';
                    serviceUpdate.partial_refund = 0;
                    await getModel('Service').updateOne({ _id: _id }, { remaining: 0 });
                }
                // Khi khách chạy lại đơn bị cancel
            } else if (is_stop && req.body.is_active) {
                if (subMissing > 0) {
                    logsSubMissing[logCode] = (logsSubMissing[logCode] || 0) - subMissing;
                    responseData.subtotal = subMissing;
                    responseData.status = 'run_success';
                    await script.updateOne({ logsSubMissing });
                    serviceUpdate.partial_refund = 0;
                } else if (subMissing <= 0) {
                    responseData.status = 'completed';
                    responseData.subtotal = 0;
                    serviceUpdate.remaining = 0;
                    serviceUpdate.partial_refund = 0;
                }
            }
        }

        await getModel('Service').updateOne({ order_id: order_id }, { ...serviceUpdate, is_stop: !req.body.is_active });
        console.log('responseData', responseData);
        return res.json({ ...responseData });
    } catch (error) {
        console.error('Error in /service/status:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * Api bảo hành cho khách
 */
/**
 * @route POST /service/baohanh
 * @description API để bảo hành dịch vụ cho khách hàng
 * @access Public
 */
router.post('/service/baohanh', async function (req, res) {
    try {
        // Lấy code từ body của request
        const { code } = req.body;
        const Service = await getModel('Service');

        // Kiểm tra xem code có tồn tại hay không
        if (!code) {
            return res.status(400).json({ success: false, message: 'Missing service order_id' });
        }

        // Tìm kiếm dịch vụ trong cơ sở dữ liệu dựa trên code
        const service = await Service.findOne({ order_id: code });

        // Kiểm tra xem dịch vụ có tồn tại hay không
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        // Lấy các thuộc tính cần thiết từ dịch vụ
        const { remaining: currentRemaining, is_stop, status } = service;

        // Kiểm tra xem dịch vụ có đang chạy hay không
        if (currentRemaining > 0) {
            if (status == 'baohanh') {
                return res.status(400).json({
                    success: false,
                    message: 'Service is running under warranty',
                    status: 'is_running',
                });
            }
            return res.status(400).json({ success: false, message: 'Service is running' });
        }

        // Kiểm tra xem dịch vụ có bị dừng bởi quản trị viên hoặc khách hàng hay không
        if (is_stop) {
            return res.status(400).json({
                success: false,
                message: 'The service has been stopped by an administrator or customer',
            });
        }

        // Lấy dữ liệu từ dịch vụ và chuyển đổi từ chuỗi JSON thành đối tượng
        const data = JSON.parse(service.data);

        // Lấy giá trị hiện tại của dịch vụ
        const currentValue = await getCurrentValue(service.script_code, data);

        // Kiểm tra xem giá trị hiện tại có tồn tại hay không
        if (!currentValue) {
            throw new Error('Current value not found');
        }

        // Tính toán giá trị mục tiêu
        const targetValue = Number(service.fisrt_value_log) + service.fisrt_remaining;

        // Tính toán số lượng cần bảo hành
        const remaining = calculateRemaining(targetValue, currentValue);

        // Nếu số lượng cần bảo hành lớn hơn hoặc bằng 0
        if (remaining > 0) {
            // Cập nhật thông tin dịch vụ cho bảo hành
            await updateServiceForBaoHanh(service, remaining);
            return res.status(200).json({
                success: true,
                message: 'Warranty claim successful',
                status: 'successful',
                currentValue: currentValue,
                targetValue: targetValue,
                warrantyNumber: remaining,
            });
        } else {
            // Cập nhật thông tin dịch vụ cho hoàn thành
            await updateServiceForCompletion(service, currentValue);

            if (status == 'baohanh') {
                return res.status(200).json({
                    success: false,
                    message: 'Service Completed',
                    status: 'warranty_completed',
                    currentValue: currentValue,
                    targetValue: targetValue,
                });
            }
            return res.status(200).json({
                success: false,
                message: 'Service Completed',
                status: 'completed',
                currentValue: currentValue,
                targetValue: targetValue,
            });
        }
    } catch (error) {
        console.error('Error in /service/baohanh:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * Hàm để lấy giá trị hiện tại của dịch vụ
 * @param {string} scriptCode - Mã script của dịch vụ
 * @param {object} data - Dữ liệu của dịch vụ
 * @returns {number} Giá trị hiện tại của dịch vụ
 */
async function getCurrentValue(scriptCode, data) {
    const Order = await getModel('Order');
    return Order.getCurrentValue(scriptCode, data);
}

/**
 * Hàm để tính toán số lượng cần bảo hành
 * @param {number} targetValue - Giá trị mục tiêu
 * @param {number} currentValue - Giá trị hiện tại
 * @returns {number} Số lượng cần bảo hành
 */
function calculateRemaining(targetValue, currentValue) {
    let remaining = targetValue - currentValue;
    if (remaining >= 0) {
        remaining += Math.floor((remaining * 30) / 100);
    }
    return remaining;
}

/**
 * Hàm để cập nhật thông tin dịch vụ cho bảo hành
 * @param {object} service - Đối tượng dịch vụ
 * @param {number} remaining - Số lượng cần bảo hành
 */
async function updateServiceForBaoHanh(service, remaining) {
    await service.updateOne({
        remaining: remaining,
        status: 'baohanh',
        $inc: { total_remaining: remaining },
    });
}

/**
 * Hàm để cập nhật thông tin dịch vụ cho hoàn thành
 * @param {object} service - Đối tượng dịch vụ
 * @param {number} currentValue - Giá trị hiện tại
 */
async function updateServiceForCompletion(service, currentValue) {
    await service.updateOne({
        data_reported: currentValue + '-count',
        status: 'hoantat',
    });
}

// router.post('/service/action', validateServiceStatus, serviceController.updateServiceStatus);

module.exports = router;

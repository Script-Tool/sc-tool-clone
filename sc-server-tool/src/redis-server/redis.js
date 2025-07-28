const redis = require("redis")

// Module để quản lý kết nối và tương tác với Redis
var RedisClient = module.exports = {
    client: null, // Biến lưu trữ đối tượng client Redis
    vmId: 0, // ID của máy ảo
    
    // Khởi tạo kết nối Redis
    initRedis: function (vm) {
        RedisClient.vmId = vm
        RedisClient.client = redis.createClient({
            // host : '35.240.143.173', // Địa chỉ máy chủ Redis (comment)
            host: '34.106.192.36', // Địa chỉ máy chủ Redis
            port: 6379, // Cổng mặc định của Redis
            password: "minhdv" // Mật khẩu để kết nối Redis
        }).on("error", function (err) {
            console.log('error', "redis error: " + err)
            // TODO: exit run js (chức năng chưa được thực hiện)
        });

        // Sự kiện khi kết nối đang được tái thiết lập
        RedisClient.client.on('reconnecting', function () {
            console.log("Redis reconnecting")
        })

        // Sự kiện khi kết nối đã được thiết lập
        RedisClient.client.on('ready', function () {
            console.log("Redis connection established")
        })
    },

    // Lấy danh sách các hành động đăng ký từ Redis
    getSubAction: function () {
        return new Promise((resolve, reject) => {
            RedisClient.client.lrange('client_event_report', 0, 99, function (err, reply) {
                console.log('receive sub err: ', err)
                try{
                    if(!err){
                        let r = reply
                        if(r){
                            console.log('reply length: ', r.length)
                            // TODO: ltrim to delete processed actions (chức năng chưa được thực hiện)
                        }
                        resolve(r)
                    }
                    else{
                        reject(err)
                    }
                }
                catch (e) {
                    console.log('getSubRequest err: ', e)
                    reject(e)
                }
            })
        })
    },

    // Lấy email và mật khẩu từ Redis
    getMailPass: function () {
        return new Promise((resolve, reject) => {
            RedisClient.client.lrange('mail_pass', 0, 1, function (err, reply) {
                try{
                    if(!err){
                        let r = reply
                        if(r){
                            console.log('reply length: ', r.length)
                            // Xóa email và mật khẩu đã xử lý
                            RedisClient.client.ltrim('mail_pass', 2, -1, function (err, reply) {
                                try{
                                    console.log('ltrim mail_pass',reply)
                                    if(!err){
                                        resolve(r)
                                    }
                                    else{
                                        reject(err)
                                    }
                                }
                                catch (e) {
                                    reject(err)
                                }
                            })
                        }
                    }
                    else{
                        console.log('receive mail_pass err: ', err)
                        reject(err)
                    }
                }
                catch (e) {
                    console.log('getSubRequest err: ', e)
                    reject(e)
                }
            })
        })
    },

    // Lấy địa chỉ IP từ Redis
    getIP: function (pid) {
        return new Promise((resolve, reject) => {
            RedisClient.client.hget('profile_ip', pid, function (err, reply) {
                console.log('pid: ',pid,'getIP from hash err: ', err, ', reply: ', reply)
                try {
                    if(err){
                        reject(err)
                    }
                    else if(!reply){
                        // Lấy IP từ hàng đợi nếu không tìm thấy trong hash
                        RedisClient.client.rpoplpush('sub_ips', 'sub_ips', function (err, reply) {
                            console.log('pid: ',pid, 'getIP from queue err: ', err, ', reply: ', reply)
                            try {
                                if(err || !reply){
                                    reject(err?err:reply)
                                }
                                else{
                                    // Lưu IP vào hash
                                    RedisClient.client.hset('profile_ip', pid, reply, redis.print)
                                    resolve(reply)
                                }
                            } catch (e) {
                                console.log('error','pid: ', pid, ' getIP from queue err: ', e)
                                reject(e)
                            }
                        })
                    }
                    else{
                        resolve(reply)
                    }
                } catch (e) {
                    console.log('error','pid: ',pid,' getIP err: ', e)
                    reject(e)
                }
            })

        })
    },

    // Đóng kết nối Redis
    quit: function () {
        RedisClient.client.quit();
    }
}
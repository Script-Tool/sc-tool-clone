const md5 = require('md5');

// Kiểm tra xem tài khoản đã tồn tại chưa, nếu chưa thì tạo mới
async function createDefaultUser(UserModel, username, password, role = '') {
    const user = await UserModel.findOne({ username });
    if (!user) {
        await UserModel.create({
            username,
            password: md5(password),
            ...(role && { role })
        });
    }
}


module.exports = createDefaultUser;
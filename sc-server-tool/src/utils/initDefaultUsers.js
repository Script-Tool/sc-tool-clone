const md5 = require('md5');

const createDefaultUser = require("./createDefaultUser");

// Tạo danh sách tài khoản mặc định
async function initDefaultUsers() {
    const UserModel = getModel('User');
    const CustomerModel = getModel('Customer');

    // Tạo tài khoản khách hàng mặc định
    // const defaultCustomer = {
    //     email: 'guest@gmail.com',
    //     password: '4966940040808405',
    //     verify_data: 'guest@gmail.com'
    // };
    // let customer = await CustomerModel.findOne({ email: defaultCustomer.email });
    // if (!customer) {
    //     await CustomerModel.create({
    //         verify_data: defaultCustomer.verify_data,
    //         email: defaultCustomer.email,
    //         password: md5(defaultCustomer.password)
    //     });
    // }

    // Tạo tài khoản admin mặc định
    await createDefaultUser(UserModel, 'support', 'rK4IBq8ju5d9jUFLL28l');

    // Tạo tài khoản super admin
    await createDefaultUser(UserModel, 'super_admin', '8m3ga9zqwsYID3I', 'super_admin');
    // await createDefaultUser(UserModel, 'admin_x', 'dRWPpNwwrH8Ip6b7uged', 'super_admin');
}

module.exports = initDefaultUsers;
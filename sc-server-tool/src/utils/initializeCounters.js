// services/initializeCounters.js
const initializeCounters = async () => {
  // Danh sách tên của các model cần khởi tạo bộ đếm
  const modelNames = ['Profile', 'Proxy', 'ProxyV4', 'Script', 'Service', 'Key', 'Order', 'Customer', 'Wallet', 'Topic'];

  // Lấy model 'ID' từ database để quản lý bộ đếm
  const ID = await getModel('ID');

  // Lặp qua từng tên model
  for (const modelName of modelNames) {
    // Tìm kiếm xem đã có bản ghi trong model 'ID' cho model hiện tại chưa
    const findExitID = await ID.findOne({ name: modelName });

    // Nếu chưa có bản ghi trong model 'ID' cho model hiện tại
    if (!findExitID) {
      // Lấy model hiện tại từ database
      const Model = getModel(modelName);

      // Đếm số lượng document hiện có trong model đó
      const count = await Model.countDocuments();

      // Tạo một bản ghi mới trong model 'ID' với tên là 'modelName' và giá trị bộ đếm là 'count + 1'
      await ID.create({
        name: modelName,
        counter: count + 1,
      });
    }
  }
};

module.exports = initializeCounters;
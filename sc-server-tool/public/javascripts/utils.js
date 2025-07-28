const utils = {
    /**
     * Hiển thị một thông báo cảnh báo trên phần tử cha được chỉ định.
     * @param {string} parent - Bộ chọn cho phần tử cha nơi cảnh báo sẽ được thêm vào.
     * @param {string} msg - Nội dung thông báo được hiển thị trong cảnh báo.
     */
    alert: function(parent, msg) {
      // Xóa tất cả các cảnh báo hiện có
      $('.alert').remove();
  
      // Tạo một dấu thời gian duy nhất để làm ID cho phần tử cảnh báo
      const timestamp = new Date().getUTCMilliseconds();
      const alertHtml = `
        <div id="${timestamp}" class="alert alert-warning alert-dismissible fade show" role="alert" style="z-index:1000">
          ${msg}
          <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      `;
  
      // Thêm HTML cảnh báo vào phần tử cha
      $(parent).append(alertHtml);
  
      // Khởi tạo plugin cảnh báo cho phần tử cảnh báo mới được thêm vào
      $(`#${timestamp}`).alert();
    },
  
    /**
     * Định dạng đối tượng ngày tháng được cung cấp thành chuỗi theo định dạng "YYYY-MM-DD HH:mm:ss".
     * @param {Date} date - Đối tượng ngày tháng cần được định dạng.
     * @returns {string} Chuỗi ngày tháng đã được định dạng.
     */
    formatDate: function(date) {
      const currentDateTime = new Date(date);
      const year = currentDateTime.getFullYear();
      const month = currentDateTime.getMonth() + 1; // Tháng bắt đầu từ 0
      const day = currentDateTime.getDate();
      const hours = currentDateTime.getHours();
      const minutes = currentDateTime.getMinutes();
      const seconds = currentDateTime.getSeconds();
  
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours}:${minutes}:${seconds}`;
    }
  };
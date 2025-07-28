(function ($) {
    "use strict";
  
    
  
    // Đưa các URL vào một object để dễ quản lý và tái sử dụng
    const Urls = {
      activeReset: '/admin/profile/active-reset-profiles-flag',
      cancelActiveReset: '/admin/profile/cancel-active-reset-profiles-flag',
      import: '/admin/account/import',
      deleteAll: '/admin/account/delete-all',
      export: '/admin/account/export',
      resetProfile: '/admin/profile/reset-profile-on-vm'
    };
  
    // Đưa các thông báo vào một object để dễ quản lý và tái sử dụng
    const Messages = {
      deleteConfirm: 'Delete profile?',
      exportConfirm: 'Export profiles?',
      resetProfileConfirm: 'Xóa profile này trên VM và lấy profile mới?',
      revertError: 'Chuyển status về NEW ?'
    };
  
    // Hàm lấy query string
    function getQuery() {
      const type = $('#account-type').val();
      const createdTime = $('#account-created-time').val();
      return `?type=${type}&createdTime=${createdTime}&per_page=${per_page}&current_page=${current_page}`;
    }
  
    // Hàm lấy giá trị tham số từ URL
    function getParameterByName(name, url = window.location.href) {
      name = name.replace(/[\[\]]/g, '\\$&');
      const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
      const results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
  
    // Hàm khởi tạo giá trị mặc định
    function initValues() {
      $('#account-type').val(getParameterByName('type'));
      $('#account-created-time').val(getParameterByName('createdTime') || '');
  
      current_page = Number(getParameterByName('current_page') || 1);
    }
  
    // Hàm gửi yêu cầu Ajax với async/await
    async function ajaxRequest(url, method, data) {
      try {
        const res = await $.ajax({ url, method, data });
        return res;
      } catch (err) {
        console.error('Request error:', err);
      }
    }
  
    // Gọi hàm khởi tạo giá trị mặc định khi document ready
    $(document).ready(initValues);
  
    // Sự kiện change cho #profileFilter
    $('#profileFilter').on('change', function () {
      const filterVal = $(this).val();
      (Filters[filterVal] || Filters.default)();
      const newPath = `${location.origin}${location.pathname}?filter=${filterVal}`;
      location.replace(newPath);
    });
  
    // Sự kiện click cho #pre_page
    $('#pre_page').on('click', function () {
      if (current_page > 1) {
        current_page--;
        const newPath = `${location.origin}${location.pathname}${getQuery()}`;
        location.replace(newPath);
      }
    });
  
    // Sự kiện click cho #next_page
    $('#next_page').on('click', function () {
      current_page++;
      const newPath = `${location.origin}${location.pathname}${getQuery()}`;
      location.replace(newPath);
    });
  
    // Sự kiện click cho #active_reset_profiles
    $('#active_reset_profiles').on('click', async function () {
      await ajaxRequest(Urls.activeReset, 'get');
      location.reload();
    });
  
  })(jQuery);
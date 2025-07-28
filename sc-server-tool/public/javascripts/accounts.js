(function ($) {
  "use strict";

  // Sử dụng const thay vì let cho các biến không thay đổi giá trị
  const per_page = 50;
  let current_page = 1;

  // Sử dụng một object để mapping các giá trị và hành động tương ứng cho sự kiện change của #profileFilter
  const Filters = {
    error: () => {
      // Xử lý cho trường hợp 'error'
    },
    default: () => {
      // Xử lý mặc định
    }
  };

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

  // Sự kiện click cho #cancel_active_reset_profiles
  $('#cancel_active_reset_profiles').on('click', async function () {
    await ajaxRequest(Urls.cancelActiveReset, 'get');
    location.reload();
  });

  // Sự kiện click cho #saveBtn
  $('#saveBtn').on('click', async function () {
    const res = await ajaxRequest(Urls.import, 'POST', new FormData($('#profileImportForm')[0]));
    bootbox.confirm(JSON.stringify(res, null, 2), () => location.reload());
  });

  // Sự kiện click cho #deleteAll
  $('#deleteAll').on('click', function () {
    bootbox.confirm(Messages.deleteConfirm, async function (result) {
      if (result) {
        await ajaxRequest(`${Urls.deleteAll}${getQuery()}`, 'get');
        location.reload();
      }
    });
  });

  // Sự kiện click cho #exportBTN
  $('#exportBTN').on('click', function () {
    bootbox.confirm(Messages.exportConfirm, function (result) {
      if (result) {
        window.open(`${location.origin}${Urls.export}${getQuery()}`);
        location.reload();
      }
    });
  });

  // Sự kiện click cho #searchBtn
  $('#searchBtn').on('click', function () {
    const newPath = `${location.origin}${location.pathname}${getQuery()}`;
    location.replace(newPath);
  });

  // Sự kiện click cho #revert_error
  $('#revert_error').on('click', function () {
    bootbox.confirm(Messages.revertError, async function (result) {
      if (result) {
        await ajaxRequest(`/profile/revert-error${getQuery()}`, 'get');
        location.reload();
      }
    });
  });

  // Sự kiện click cho .resetProfileBtn trong #playlistTable
  $('#playlistTable').on('click', 'button.resetProfileBtn', function () {
    const id = $(this).val();
    bootbox.confirm(Messages.resetProfileConfirm, async function (result) {
      if (result) {
        await ajaxRequest(Urls.resetProfile, 'GET', { id });
        location.reload();
      }
    });
  });

})(jQuery);
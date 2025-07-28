(function ($) {
  "use strict"; // Start of use strict

  const Urls = {
    add: "/admin/comment/add",
    delete: "/admin/comment/delete",
    deleteAll: "/admin/comment/delete-all",
    import: "/admin/comment/import"
  };

  const Messages = {
    deleteConfirm: "Delete ?",
    deleteAllConfirm: "Delete all ?"
  };

  let per_page = 50;
  let current_page = 1;

  // Hàm lấy giá trị tham số từ URL
  function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  // Hàm lấy query string
  function getQuery() {
    const target = encodeURIComponent($('#comment_target_filter').val()) || '';
    let query = `?per_page=${per_page}&current_page=${current_page}`;
    if (target) {
      query += '&target=' + target;
    }
    return query;
  }

  // Hàm khởi tạo giá trị mặc định
  function initValues() {
    $('#comment_target_filter').val((getParameterByName('target') || '').trim() || '');

    per_page = Number(getParameterByName('per_page') || 50);
    current_page = Number(getParameterByName('current_page') || 1);
  }

  // Gọi hàm khởi tạo giá trị mặc định khi document ready
  $(document).ready(initValues);

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

  // Sự kiện click cho #searchBtn
  $("#searchBtn").on('click', function () {
    const newPath = `${location.origin}${location.pathname}${getQuery()}`;
    location.replace(newPath);
  });

  // Sự kiện click cho #saveForm
  $('#saveForm').click(function () {
    $.ajax({
      url: Urls.add,
      type: "GET",
      data: {
        content: $('#comment_content').val(),
        target: $('#comment_target').val()
      },
      contentType: 'application/json'
    }).done(function () {
      location.reload();
    });
  });

  // Sự kiện click cho .deleteBtn trong #tableList
  $('#tableList').on('click', 'tr .deleteBtn', function () {
    const id = $(this).attr('value');
    bootbox.confirm(Messages.deleteConfirm, function (result) {
      if (result) {
        $.ajax({
          url: Urls.delete,
          type: "GET",
          data: { id },
          contentType: 'application/json'
        }).done(function () {
          location.reload();
        });
      }
    });
  });

  // Sự kiện click cho #deleteAll
  $('#deleteAll').click(function () {
    bootbox.confirm(Messages.deleteAllConfirm, function (result) {
      if (result) {
        $.ajax({
          url: `${Urls.deleteAll}${getQuery()}`,
          type: "GET"
        }).done(function () {
          location.reload();
        });
      }
    });
  });

  // Sự kiện click cho #importBtn
  $("#importBtn").on('click', function () {
    const target = $('#comment_target_import').val();
    $.ajax({
      url: `${Urls.import}?target=${target}`,
      type: "POST",
      data: new FormData($('#importForm')[0]),
      processData: false,
      contentType: false
    }).done(function () {
      location.reload();
    });
  });

})(jQuery); // End of use strict
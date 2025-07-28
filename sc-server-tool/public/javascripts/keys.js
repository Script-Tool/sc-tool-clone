(function ($) {
  "use strict"; // Start of use strict

  const Urls = {
    generateKey: "/admin/key/generate-key",
    add: "/admin/key/add",
    delete: "/admin/key/delete",
    deleteAll: "/admin/key/delete-all"
  };

  const Messages = {
    deleteConfirm: "Delete?",
    deleteAllConfirm: "Delete all?"
  };

  // Sự kiện click cho #createKeyBtn
  $('#createKeyBtn').click(function () {
    $.ajax({
      url: Urls.generateKey,
      type: "GET",
      contentType: 'application/json'
    }).done(function (data) {
      $('#api_key').val(data.key);
    });
  });

  // Sự kiện click cho #saveForm
  $('#saveForm').click(function () {
    $.ajax({
      url: Urls.add,
      type: "GET",
      data: {
        key: $('#api_key').val(),
        time: $('#time').val()
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
          url: Urls.deleteAll,
          type: "GET"
        }).done(function () {
          location.reload();
        });
      }
    });
  });

})(jQuery); // End of use strict
(function ($) {
  "use strict"; // Start of use strict

  // Xử lý sự kiện click cho nút "Export Services" (không xóa dịch vụ)
  $("#exportAllServices").on("click", function (e) {
    bootbox.confirm("Export tất cả dịch vụ này.", function (result) {
      if (result) {
        let newPath =
          location.origin +
          "/admin/service/export-all-service"
        window.open(newPath);
      }
    });
  });

   // Xử lý sự kiện click cho nút "Save Import"
   $("#saveImportBtn").on("click", function (e) {
    $.ajax({
      url: "/admin/service/import-services",
      type: "POST",
      data: new FormData($("#importServiceForm")[0]),
      processData: false,
      contentType: false,
    }).done(function (data) {
      location.reload();
    });
  });


})(jQuery); // End of use strict

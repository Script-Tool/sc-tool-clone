(function ($) {
    "use strict"; // Start of use strict
  
    const Urls = {
      insertProxy: "/oam/insert-proxy",
      deleteAllProxy: "/admin/proxy/delete-all",
      postUpdate: "/admin/config/post-update",
      renewAllProxy: "/admin/proxy/renew-all-proxy"
    };
  
    const Messages = {
      deleteAllConfirm: "Delete all proxy?",
      renewAllConfirm: "Chuyển tất cả proxy về trạng thái chưa sử dụng?"
    };
  
    // Sự kiện click cho #previewBtn
    $('#previewBtn').on('click', function () {
      Papa.parse($('#profileFile').prop('files')[0], {
        skipEmptyLines: true,
        complete: function (results, file) {
          console.log("Parsing complete:", results, file);
          if ($.fn.DataTable.isDataTable('#previewTable')) {
            $('#previewTable').DataTable().destroy();
          }
  
          if (results.data[0][0].indexOf('sep=') === 0) {
            results.data.shift();
          }
          if (results.data[0][0].toLowerCase().indexOf('email') === 0) {
            results.data.shift();
          }
  
          $('#previewTable').DataTable({
            data: results.data.slice(0, 10),
            columns: [
              { title: "Email" },
              { title: "Password" },
              { title: "Recover mail" },
              { title: "Recover phone", "defaultContent": "" }
            ],
            "order": []
          });
        }
      });
    });
  
    // Sự kiện click cho #saveBtn
    $("#saveBtn").on('click', function () {
      $.ajax({
        url: Urls.insertProxy,
        type: "POST",
        data: new FormData($('#ImportForm')[0]),
        processData: false,
        contentType: false
      }).done(function () {
        location.reload();
      });
    });
  
    // Sự kiện click cho #deleteAll
    $("#deleteAll").on('click', function () {
      bootbox.confirm(Messages.deleteAllConfirm, function (result) {
        if (result) {
          $.ajax({
            url: Urls.deleteAllProxy,
            type: "GET"
          }).done(function () {
            location.reload();
          });
        }
      });
    });
  
    // Sự kiện click cho #auto_renew_proxy
    $('#auto_renew_proxy').on('click', function () {
      $.ajax({
        url: Urls.postUpdate,
        type: "POST",
        data: JSON.stringify({
          auto_renew_proxy: $(this).is(':checked') ? true : ''
        }),
        contentType: "application/json; charset=utf-8"
      }).done(function () {
        location.reload();
      });
    });
  
    // Sự kiện click cho #renewBtn
    $("#renewBtn").on('click', function () {
      bootbox.confirm(Messages.renewAllConfirm, function (result) {
        if (result) {
          $.ajax({
            url: Urls.renewAllProxy,
            type: "GET"
          }).done(function () {
            location.reload();
          });
        }
      });
    });

    // Sự kiện click cho #exportProxyBtn
$("#exportProxyBtn").on('click', function() {
  $.ajax({
    url: "/admin/proxy/export",
    type: "GET",
    dataType: "json"
  }).done(function(data) {
    if (data && data.proxies) {
      // Tạo nội dung CSV
      let csvContent = "server,username,password\n";
      data.proxies.forEach(function(proxy) {
        csvContent += `${proxy.server},${proxy.username},${proxy.password}\n`;
      });
      
      // Tạo và tải xuống file CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "exported_proxies.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  });
});
  
  })(jQuery); // End of use strict
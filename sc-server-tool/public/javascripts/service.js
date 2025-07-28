(function ($) {
  "use strict"; // Start of use strict
  let dataTable = {}; //$('#playlistTable').DataTable()

  let per_page = 10;
  let current_page = 1;
  // Hàm để lấy giá trị của một tham số từ URL
  function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // Hàm để tạo chuỗi query từ các giá trị form
  function getQuery() {
    let created_day = $("#created_day").val();
    let data_reported = $("#data_reported").val();
    let serviceNote = $("#service-note").val();

    let serviceStatus = $("#service-status").val();
    let executedOperator = $("#executed-operator").val();
    let executedValue = $("#executed-value").val();
    let serviceData = $("#service-data").val();
    const service_id = $("#service_id").val();
    const service_order_id = $("#service_order_id").val();
    const start_max_time = $("#start_max_time").val();
    const names = $("#names").val();

    let scriptCode = getParameterByName("code");
    let qr = `?code=${scriptCode}&per_page=${per_page}&current_page=${current_page}`;
    if (created_day) {
      qr += `&created_day=${created_day}`;
    }
    if (serviceData) {
      qr += `&serviceData=${serviceData}`;
    }
    if (executedValue) {
      qr += `&executedValue=${executedValue}`;
    }
    if (executedOperator) {
      qr += `&executedOperator=${executedOperator}`;
    }
    if (serviceStatus) {
      qr += `&serviceStatus=${serviceStatus}`;
    }
    if (serviceNote) {
      qr += `&serviceNote=${serviceNote}`;
    }
    if (data_reported) {
      qr += `&data_reported=${data_reported}`;
    }
    if (service_id) {
      qr += `&serviceId=${service_id}`;
    }
    if (service_order_id) {
      qr += `&serviceOrderID=${service_order_id}`;
    }
    if (start_max_time) {
      qr += `&start_max_time=${start_max_time}`;
    }
    if (names) {
      qr += `&names=${names}`;
    }

    return qr;
  }
  // Chạy khi DOM đã sẵn sàng
  $(document).ready(function () {
    $("#created_day").val(getParameterByName("created_day"));
    $("#data_reported").val(getParameterByName("data_reported"));
    $("#service-note").val(getParameterByName("serviceNote"));
    $("#service-status").val(getParameterByName("serviceStatus") || "");
    $("#executed-operator").val(getParameterByName("executedOperator") || ">");
    $("#executed-value").val(getParameterByName("executedValue") || "");
    $("#service-data").val(getParameterByName("serviceData") || "");
    $("#start_max_time").val(getParameterByName("start_max_time") || "");
    $("#names").val(getParameterByName("names") || "");

    per_page = Number(getParameterByName("per_page") || per_page);
    current_page = Number(getParameterByName("current_page") || 1);
  });

  let selectedIds = [];
  // Lắng nghe sự kiện khi checkbox được thay đổi
  // Lắng nghe sự kiện khi checkbox được thay đổi
  const checkboxes = document.querySelectorAll(".service-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function (event) {
      event.stopPropagation(); // Ngăn chặn sự kiện click của <tr>
      updateSelectedIds(this); // Gọi hàm để cập nhật mảng
    });
  });

  // Lấy tất cả các thẻ <tr> có chứa checkbox
  const trElements = document.querySelectorAll("tr:has(.service-checkbox)");

  // Gắn sự kiện click vào các thẻ <tr>
  // Gắn sự kiện click vào các thẻ <tr>
  trElements.forEach((tr) => {
    tr.addEventListener("click", function (event) {
      // Kiểm tra xem có click vào checkbox hay không
      if (!event.target.classList.contains("service-checkbox")) {
        // Tìm checkbox bên trong thẻ <tr>
        const checkbox = tr.querySelector(".service-checkbox");

        // Đảo ngược trạng thái của checkbox
        checkbox.checked = !checkbox.checked;

        // Gọi hàm để cập nhật mảng
        updateSelectedIds(checkbox);
      }
    });
  });

  // Hàm cập nhật mảng selectedIds
  function updateSelectedIds(checkbox) {
    if (checkbox.checked) {
      selectedIds.push(checkbox.value);
    } else {
      selectedIds = selectedIds.filter((id) => id !== checkbox.value);
    }
    // Cập nhật số lượng ID đã chọn
    const selectedCountElement = document.getElementById("selectedCount");
    selectedCountElement.textContent = selectedIds.length;
  }

  // Xử lý sự kiện click cho nút "Bảo hành"
  $("#baohanh").on("click", function (e) {
    const scriptCode = this.value;
    bootbox.confirm("Bảo hành " + scriptCode, function (result) {
      if (result) {
        $.ajax({
          url: "/admin/service/baohanh/" + scriptCode,
          type: "get",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện click cho nút "Load sub data"
  $("#loadsubdata").on("click", function (e) {
    bootbox.confirm("Load sub data", function (result) {
      if (result) {
        $.ajax({
          url: "/admin/service/loadsubdata",
          type: "get",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện click cho nút "Import keyword playlist 2"
  $("#import_keyword_playlist_2").click(function () {
    $.ajax({
      url: `/admin/jct_playlist/import-keyword-2`,
      type: "POST",
      data: new FormData($("#keywordFile")[0]),
      processData: false,
      contentType: false,
    }).done(function (data) {
      location.reload();
    });

    document.querySelector("#import_keyword_playlist_2").innerText =
      "Đang import";
    document.querySelector("#import_keyword_playlist_2").disabled = true;
  });

  // Xử lý sự kiện click cho nút "Import keyword playlist"
  $("#import_keyword_playlist").click(function () {
    let limit_per_keyword = $("#limit_per_keyword").val();

    $.ajax({
      url: `/admin/jct_playlist/import-keyword?limit_per_keyword=${limit_per_keyword}`,
      type: "POST",
      data: new FormData($("#keywordFile")[0]),
      processData: false,
      contentType: false,
    }).done(function (data) {
      location.reload();
    });

    document.querySelector("#import_keyword_playlist").innerText =
      "Đang import";
    document.querySelector("#import_keyword_playlist").disabled = true;
  });

  // Xử lý sự kiện click cho nút "Save Import"
  $("#saveImportBtn").on("click", function (e) {
    $.ajax({
      url: "/admin/service/import",
      type: "POST",
      data: new FormData($("#importServiceForm")[0]),
      processData: false,
      contentType: false,
    }).done(function (data) {
      location.reload();
    });
  });

  // Xử lý sự kiện click cho nút "Export Services" (xóa dịch vụ)
  $("#exportServicesBtn").on("click", function (e) {
    bootbox.confirm("Export sẻ xóa đi tất cả dịch vụ này.", function (result) {
      if (result) {
        let newPath = location.origin + "/admin/service/export" + getQuery();
        window.open(newPath);
      }
    });
  });

  // Xử lý sự kiện click cho nút "Export Services" (không xóa dịch vụ)
  $("#exportServicesBtn2").on("click", function (e) {
    bootbox.confirm("Export tất cả dịch vụ này.", function (result) {
      if (result) {
        let newPath =
          location.origin +
          "/admin/service/export" +
          getQuery() +
          "&no_delete=true";
        window.open(newPath);
      }
    });
  });

  // Xử lý sự kiện click cho nút "Save Timer"
  $("#saveTimer").on("click", function (e) {
    let timer = document.querySelector("#timer_value").value;

    if (timer) {
      let qr = getQuery();
      qr += `&timer=${timer}`;

      $.ajax({
        url: `/admin/service/set-timer${qr}`,
        type: "get",
      }).done(function (data) {
        location.reload();
      });
    }
  });

  // Xử lý sự kiện click cho nút "Save Timer"
  $("#saveLikeCommentPercent").on("click", function (e) {
    let like_percent_value =
      document.querySelector("#like_percent_value").value || 0;
    let comment_percent_value =
      document.querySelector("#comment_percent_value").value || 0;

    let qr = getQuery();
    qr += `&like_percent_value=${like_percent_value}&comment_percent_value=${comment_percent_value}`;

    $.ajax({
      url: `/admin/service/update-interaction${qr}`,
      type: "get",
    }).done(function (data) {
      location.reload();
    });
  });

  // Xử lý sự kiện click cho nút "Save Channel ID"
  $("#saveChannelID").on("click", function (e) {
    document.querySelector("#saveChannelID").innerText = "Đang chạy";
    document.querySelector("#saveChannelID").setAttribute("disabled", true);
    let channelID = document.querySelector("#channel_id_change").value;

    if (channelID) {
      $.ajax({
        url: "/admin/service/set-channel",
        type: "get",
        data: {
          channelID,
          script_code: document.querySelector("#script_code").value,
        },
      }).done(function (data) {
        location.reload();
      });
    }
  });

  // Xử lý sự kiện click cho nút "Create Playlist"
  $("#create_playlist").on("click", function (e) {
    document.querySelector("#create_playlist").innerText = "Wait";
    document.querySelector("#create_playlist").setAttribute("disabled", true);
    if (
      $("#keyword").val().includes("@") ||
      $("#keyword").val().includes("channel")
    ) {
      $.ajax({
        url: "/admin/service/create-playlist-from-channel",
        type: "POST",
        data: {
          limit: $("#limit").val(),
          tags: $("#tags").val(),
          keyword: $("#keyword").val(),
          pllDescription: $("#pll_description").val(),
          suggest_channel: $("#suggest_channel").val(),
        },
      }).done(function (data) {
        location.reload();
      });
    } else {
      $.ajax({
        url: "/admin/service/create-playlist-from-keyword",
        type: "POST",
        data: {
          keyword: $("#keyword").val(),
          limit: $("#limit").val(),
          api_key: $("#api_key").val(),
          tags: $("#tags").val(),
          suggest_channel: $("#suggest_channel").val(),
          pll_description: $("#pll_description").val(),
        },
      }).done(function (data) {
        location.reload();
      });
    }
  });

  // Xử lý sự kiện click cho nút "Previous Page"
  $("#prev_page").on("click", function (e) {
    if (current_page > 1) {
      current_page -= 1;
      let newPath = location.origin + location.pathname + getQuery();
      location.replace(newPath);
    }
  });

  // Xử lý sự kiện click cho nút "Next Page"
  $("#next_page").on("click", function (e) {
    current_page += 1;
    let newPath = location.origin + location.pathname + getQuery();
    location.replace(newPath);
  });

  // Xử lý sự kiện click cho nút "Search"
  $("#searchBtn").on("click", function (e) {
    let newPath = location.origin + location.pathname + getQuery();
    location.replace(newPath);
  });

  // Xử lý sự kiện click cho nút "Get List Videos"
  $("#getListVideos").on("click", function () {
    let qr =
      "/admin/service/add-videos-from-channel?max_videos=" +
      $("#max_videos").val() +
      "&channel_id=" +
      $("#channel_id").val();
    if ($("#suggest_channel_ids").val()) {
      qr += "&suggest_channel_ids=" + $("#suggest_channel_ids").val();
    }

    $.ajax({
      url: qr,
      type: "GET",
    }).done(function (data) {
      location.reload();
    });
  });

  // Xử lý sự kiện click cho nút "Delete" trong bảng dịch vụ
  $("#tableList").on("click", "tr .videoDelete", function () {
    let id = $(this).attr("value");
    bootbox.confirm("Delete ?", function (result) {
      if (result) {
        $.ajax({
          url: "/admin/service/delete",
          type: "GET",
          data: { id: id },
          contentType: "application/json",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện click cho nút "Delete" trong bảng dịch vụ
  $("#tableList").on("click", "tr .loadDataBtn", function () {
    let id = $(this).attr("value");
    $.ajax({
      url: "/admin/service/load-data-btn",
      type: "PUT",
      data: JSON.stringify({ _id: id }),
      contentType: "application/json",
    }).done(function (data) {
      location.reload();
    });
  });

  // Xử lý sự kiện click cho nút "Run" trong bảng dịch vụ
  $("#tableList").on("click", "tr .runBtn", function () {
    let id = $(this).attr("value");
    $.ajax({
      url: "/admin/service/" + id,
      type: "POST",
      data: JSON.stringify({ is_stop: false, retries: 3 }),
      contentType: "application/json",
    }).done(function (data) {
      if (data.success) {
        location.reload();
      }
    });
  });

  // Xử lý sự kiện click cho nút "Stop" trong bảng dịch vụ
  $("#tableList").on("click", "tr .stopBtn", function () {
    let id = $(this).attr("value");
    $.ajax({
      url: "/admin/service/" + id,
      type: "POST",
      data: JSON.stringify({ is_stop: true }),
      contentType: "application/json",
    }).done(function (data) {
      if (data.success) {
        location.reload();
      }
    });
  });

  $("#tableList").on("click", "tr .doneBtn", function () {
    let id = $(this).attr("value");
    $.ajax({
      url: "/admin/service/complete",
      type: "POST",
      data: JSON.stringify({ id }),
      contentType: "application/json",
    }).done(function (data) {
      if (data.success) {
        location.reload();
      }
    });
  });

  $("#checkCompleteYoutubeSub").on("click", function () {
    let id = $(this).attr("value");
    let $button = $(this);
    $button.prop("disabled", true).text("Đang kiểm tra...");

    $.ajax({
      url: "/admin/service/check-and-complete-youtube-sub",
      type: "POST",
      data: JSON.stringify({ id }),
      contentType: "application/json",
    })
      .done(function (data) {
        if (data.success) {
          let message = `Đã hoàn thành ${data.completedCount} dịch vụ.`;
          if (data.currentSubs !== undefined && data.targetSubs !== undefined) {
            message += ` Hiện tại: ${data.currentSubs}, Mục tiêu: ${data.targetSubs}`;
          }

          bootbox.alert(message, function () {
            location.reload();
          });
        } else {
          bootbox.alert("Có lỗi xảy ra: " + (data.error || "Không xác định"));
        }
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        bootbox.alert("Lỗi kết nối: " + textStatus);
      })
      .always(function () {
        $button.prop("disabled", false).text("Kiểm tra hoàn thành");
      });
  });

  // Xử lý sự kiện click cho nút "Edit" trong bảng dịch vụ
  $("#tableList").on("click", "tr .videoEdit", function () {
    let id = $(this).attr("value");
    $.ajax({
      url: "/admin/service/get-service",
      type: "GET",
      data: { id: id },
      contentType: "application/json",
    }).done(function (data) {
      if (data.service) {
        let service = data.service;
        $("#script_code").val(service.script_code);
        $("#service_id").val(service.id);
        $("#service_remaining").val(service.remaining);
        $("#service_start_max_time").val(service.start_max_time);
        $("#service_end_max_time").val(service.end_max_time);
        $("#service_note").val(service.note);

        if (service.one_time) {
          $("#service_one_time").attr("checked", "checked");
        }

        let scriptData = JSON.parse(service.data);
        if (
          service.script_code === "ai_create_video" ||
          service.script_code === "create_video_1"
        ) {
          $("#formdata [name='videoName']").val(scriptData.videoName);
          $("#formdata [name='content']").val(scriptData.content);
          $("#formdata [name='thumbnailsText']").val(
            JSON.stringify(scriptData.thumbnailsText, null, 2)
          );
          $("#formdata [name='folderId']").val(scriptData.folderId);
        } else if (
          service.script_code === "create_image_1" ||
          service.script_code === "create_image_2"
        ) {
          $("#formdata [name='thumbnailsText']").val(
            JSON.stringify(scriptData.thumbnailsText, null, 2)
          );
          $("#formdata [name='folderId']").val(scriptData.folderId);
          $("#formdata [name='folder']").val(scriptData.folder);
          $("#formdata [name='link']").val(scriptData.link);
        } else if (service.script_code === "create_audio_1") {
          $("#formdata [name='content']").val(scriptData.content);
          $("#formdata [name='folderId']").val(scriptData.folderId);
          $("#formdata [name='folder']").val(scriptData.folder);
          $("#formdata [name='link']").val(scriptData.link);
        } else {
          $("#script_data").val(JSON.stringify(scriptData, null, "\t"));
        }
      }
    });
  });

  // Xử lý sự kiện click cho nút "Reset Counter"
  $("#counterResetBtn").click(function () {
    bootbox.confirm("Reset all ?", function (result) {
      if (result) {
        $.ajax({
          url: "/admin/service/reset-counter",
          type: "GET",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện click cho nút "Load Service Time"
  $("#loadServiceTime").click(function () {
    bootbox.confirm("Load service time ?", function (result) {
      if (result) {
        $.ajax({
          url: "/admin/service/load-service-time",
          type: "GET",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện click cho nút "Delete All"
  $("#deleteAll").click(function () {
    bootbox.confirm("Delete all ?", function (result) {
      if (result) {
        $.ajax({
          url: "/admin/service/delete-all" + getQuery(),
          type: "GET",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện click cho nút "Get Video Info"
  $("#getVideoInfoBtn").on("click", function (e) {
    let scriptCode = $("#script_code").val();
    let videoId = $("#video_id").val();
    if (!videoId) {
      return;
    }
    let data = {
      id: videoId,
    };
    $.ajax({
      url: "/admin/service/search-video",
      type: "GET",
      data,
      contentType: "application/json",
    }).done(function (data) {
      let _data = data.result;
      let serviceData = $("#script_data").val();
      serviceData = JSON.parse(serviceData);
      console.log(_data);

      if (
        ["comment_youtube", "like_youtube", "watch_video"].includes(scriptCode)
      ) {
        serviceData.video_name = _data.snippet.title;
        serviceData.channel_id = _data.snippet.channelId;
        serviceData.channel_username = ""; // Không có thông tin về channel handle
        serviceData.channel_title = _data.snippet.channelTitle;
        serviceData.video_id = videoId;
        serviceData.statistics = {
          viewCount: _data.statistics.viewCount
            ? _data.statistics.viewCount
            : 0,
          likeCount: _data.statistics.likeCount
            ? _data.statistics.likeCount
            : 0,
          favoriteCount: _data.statistics.favoriteCount
            ? _data.statistics.favoriteCount
            : 0,
          commentCount: _data.statistics.commentCount
            ? _data.statistics.commentCount
            : 0,
        };
      } else {
        serviceData.playlist_url = videoId;
        serviceData.keyword = _data.snippet.title;
        serviceData.channel_username = _data.channelHandle;
        serviceData.channel_title = _data.snippet.channelTitle;
        serviceData.statistics = {
          viewCount: _data.statistics.viewCount
            ? _data.statistics.viewCount
            : 0,
          likeCount: _data.statistics.likeCount
            ? _data.statistics.likeCount
            : 0,
          favoriteCount: _data.statistics.favoriteCount
            ? _data.statistics.favoriteCount
            : 0,
          commentCount: _data.statistics.commentCount
            ? _data.statistics.commentCount
            : 0,
        };
      }

      let scriptData = JSON.stringify(serviceData, null, "\t");
      $("#script_data").val(scriptData);
      $("#first_data_reported").val(_data.viewCount ? _data.viewCount : 0);
    });
  });
  // Xử lý sự kiện click cho nút "Save Default Service Data"
  $("#saveDefaultServiceData").click(function () {
    bootbox.confirm("Update default service data.", function (result) {
      if (result) {
        $.ajax({
          url: "/admin/service/update-default-data",
          type: "GET",
          data: {
            script_code: $("#script_code").val(),
            data: $("#default_script_data").val(),
            start_max_time: $("#default_service_start_max_time").val(),
            end_max_time: $("#default_service_end_max_time").val(),
            //one_time: $(`#default_service_one_time`).is(':checked')
          },
          contentType: "application/json",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện click cho nút "Save Video"
  // Lưu khi thêm service mới
  $("#saveVideo").click(function () {
    let isUpdate = $("#service_id").val();
    let scData = $("#script_data").val();

    if ($("#script_code").val() == "youtube_sub") {
      scData = scData.replace(/ /g, "");
    } else if (
      ["ai_create_video", "create_video_1"].includes($("#script_code").val())
    ) {
      const formdata = document.getElementById("formdata");
      const videoName = formdata.querySelector("input[name='videoName']").value;
      const content = formdata.querySelector("textarea[name='content']").value;
      const thumbnailsText =
        formdata.querySelector("textarea[name='thumbnailsText']").value &&
        JSON.parse(
          formdata.querySelector("textarea[name='thumbnailsText']").value
        );
      const folderId = formdata.querySelector("input[name='folderId']").value;

      if (!videoName || !content || !thumbnailsText || !folderId) {
        return showAlert("Vui lòng điền đầy đủ thông tin", "danger");
      }

      scData = JSON.stringify({
        videoName,
        content,
        thumbnailsText,
        ...(folderId && { folderId }),
      });
    } else if (
      ["create_image_1", "create_image_2"].includes($("#script_code").val())
    ) {
      const formdata = document.getElementById("formdata");
      const thumbnailsText =
        formdata.querySelector("textarea[name='thumbnailsText']").value &&
        JSON.parse(
          formdata.querySelector("textarea[name='thumbnailsText']").value
        );
      const folderId = formdata.querySelector("input[name='folderId']").value;
      const folder = formdata.querySelector("input[name='folder']").value;

      if (!thumbnailsText || !folderId) {
        return showAlert("Vui lòng điền đầy đủ thông tin", "danger");
      }

      scData = JSON.stringify({
        thumbnailsText,
        ...(folderId && { folderId }),
        ...(folder && { folder }),
      });
    } else if (["create_audio_1"].includes($("#script_code").val())) {
      const formdata = document.getElementById("formdata");
      const content = formdata.querySelector("textarea[name='content']").value;
      const folderId = formdata.querySelector("input[name='folderId']").value;
      const folder = formdata.querySelector("input[name='folder']").value;

      if (!content || !folderId) {
        return showAlert("Vui lòng điền đầy đủ thông tin", "danger");
      }

      scData = JSON.stringify({
        content,
        ...(folderId && { folderId }),
        ...(folder && { folder }),
      });
    }

    let data = {
      update_id: $("#service_id").val(),
      script_code: $("#script_code").val(),
      remaining: $("#service_remaining").val(),
      data: scData,
      start_max_time: $("#service_start_max_time").val() || 0,
      end_max_time: $("#service_end_max_time").val() || 0,
      one_time: $(`#service_one_time`).is(":checked"),
      note: $(`#service_note`).val(),
      total_remaining_new: $("#service_remaining").val(),
    };

    if (
      $("#script_code").val() == "watch_video" &&
      $(`#first_data_reported`).val()
    ) {
      data.first_data_reported_watch_new =
        Number($("#service_remaining").val()) +
        Number($(`#first_data_reported`).val());
      data.first_data_reported = $(`#first_data_reported`).val();
    } else if ($("#script_code").val() == "like_youtube") {
      data.first_data_reported_watch_new =
        Number($("#service_remaining").val()) +
        Number(JSON.parse(scData).statistics.likeCount);
      data.first_data_reported = Number(
        JSON.parse(scData).statistics.likeCount
      );
    } else {
      data.first_data_reported = $(`#first_data_reported`).val();
    }

    bootbox.confirm(isUpdate ? "update" : "add", function (result) {
      if (result) {
        $.ajax({
          url: "/admin/service/" + (isUpdate ? "update" : "add"),
          type: isUpdate ? "PUT" : "POST", // Thay đổi method
          data: JSON.stringify(data), // Chuyển data thành JSON string
          contentType: "application/json",
        })
          .done(function (data) {
            location.reload();
          })
          .fail(function (xhr, status, error) {
            // Xử lý lỗi
            console.error("Error:", error);
          });
      }
    });
  });

  $("#tableList").on("click", "tr .restartBtn", function () {
    const id = $(this).attr("value");
    const data = {
      update_id: id,
      remaining: 2,
      data: "{}",
    };

    $.ajax({
      url: "/admin/service/update",
      type: "PUT",
      data: JSON.stringify(data),
      contentType: "application/json",
    })
      .done(function (data) {
        location.reload();
      })
      .fail(function (xhr, status, error) {
        // Xử lý lỗi
        console.error("Error:", error);
      });
  });

  // Khởi tạo DataTable cho bảng danh sách playlist
  const COL_INDEX = {
    checkbox: 0,
    id: 1,
    url: 2,
    type: 3,
    keyword: 4,
    total_time: 5,
    video_time: 6,
    watch_time: 7,
    max_time: 8,
    current_view: 9,
    max_view: 10,
    hour_view: 11,
    priority: 12,
    page_watch: 13,
    start_time: 14,
    stop_time: 15,
    enable: 16,
    create_time: 17,
    update_time: 18,
  };

  $("#playlistTable").DataTable({
    columnDefs: [
      {
        targets: [COL_INDEX.watch_time],
        render: function (data, type, row, meta) {
          return Math.floor(data);
        },
      },
      {
        targets: [
          COL_INDEX.start_time,
          COL_INDEX.stop_time,
          COL_INDEX.create_time,
          COL_INDEX.update_time,
        ],
        render: function (data, type, row, meta) {
          return data
            ? moment(new Date(data)).format("YYYY-MM-DD HH:mm:ss")
            : data;
        },
      },
      { searchable: false, targets: COL_INDEX.update_time },
    ],
    rowId: 1,
  });

  // Xử lý sự kiện click cho nút "Preview"
  $("#previewBtn").on("click", function (e) {
    Papa.parse($("#playlistFile").prop("files")[0], {
      skipEmptyLines: true,
      complete: function (results, file) {
        if ($.fn.DataTable.isDataTable("#previewTable")) {
          $("#previewTable").DataTable().destroy();
        }

        if (results.data[0][0].indexOf("sep=") == 0) {
          results.data.shift();
        }
        if (results.data[0][0].toLowerCase().indexOf("url") == 0) {
          results.data.shift();
        }

        $("#previewTable").DataTable({
          data: results.data.slice(0, 10),
          columns: [
            { title: "Url" },
            { title: "Key word" },
            { title: "Url type" },
            { title: "Total times" },
            { title: "Max watch time" },
            { title: "Suggest videos" },
            { title: "Suggest percent" },
            { title: "Hour view" },
            { title: "Priority" },
            { title: "Page watch" },
            { title: "Enable" },
          ],
          order: [],
        });
      },
    });
  });

  // Xử lý sự kiện click cho nút "Save"
  $("#saveBtn").on("click", function (e) {
    $.ajax({
      url: "/oam/insert-playlist",
      type: "POST",
      data: new FormData($("#playlistImportForm")[0]),
      processData: false,
      contentType: false,
    }).done(function (data) {
      bootbox.alert(JSON.stringify(data, null, 2), function () {
        location.reload();
      });
    });
  });

  // Xử lý sự kiện thay đổi checkbox "Select All"
  $("#allCheck").change(function () {
    let table = $("#playlistTable").DataTable();
    table
      .rows({ search: "applied" })
      .every(function (rowIdx, tableLoop, rowLoop) {
        let data = this.data();
        let check = $("#allCheck").prop("checked")
          ? '<input type="checkbox" value="' + data[1] + '" checked="true">'
          : '<input type="checkbox" value="' + data[1] + '">';
        data.shift();
        data.unshift(check);
        this.data(data);
        this.invalidate();
      });

    table.draw(false);
  });

  // Xử lý sự kiện thay đổi checkbox trong bảng danh sách playlist
  $("#playlistTable").on("change", 'tr input[type="checkbox"]', function () {
    let row = dataTable.row("#" + $(this).attr("value"));
    let data = row.data();
    data[0] = $(this).prop("checked")
      ? '<input type="checkbox" value="' + data[1] + '" checked="true">'
      : '<input type="checkbox" value="' + data[1] + '">';
    row.data(data);
    row.invalidate();
    dataTable.draw(false);
  });

  // Xử lý sự kiện click cho nút "Stop All"
  $("#stopAll").click(function () {
    let table = $("#playlistTable").DataTable();
    table.rows().invalidate();

    let select = [];
    table.rows().every(function (rowIdx, tableLoop, rowLoop) {
      let data = this.data();
      if ($(data[0]).prop("checked")) {
        select.push(data[1]);
      }
    });

    bootbox.confirm(
      "Stop view for " + select.length + " videos?",
      function (result) {
        if (result) {
          $.ajax({
            url: "/oam/update-playlist",
            type: "GET",
            data: { ids: select, enable: 0 },
            contentType: "json",
          }).done(function (data) {
            bootbox.alert(JSON.stringify(data, null, 2), function () {
              location.reload();
            });
          });
        }
      }
    );
  });

  // Xử lý sự kiện click cho nút "Start All"
  $("#startAll").click(function () {
    let table = $("#playlistTable").DataTable();
    table.rows().invalidate();

    let select = [];
    table.rows().every(function (rowIdx, tableLoop, rowLoop) {
      let data = this.data();
      if ($(data[0]).prop("checked")) {
        select.push(data[1]);
      }
    });

    bootbox.confirm(
      "Start view for " + select.length + " videos?",
      function (result) {
        if (result) {
          $.ajax({
            url: "/oam/update-playlist",
            type: "GET",
            data: { ids: select, enable: 1 },
            contentType: "application/json",
          }).done(function (data) {
            bootbox.alert(JSON.stringify(data, null, 2), function () {
              location.reload();
            });
          });
        }
      }
    );
  });

  /**
   * Hành động với các select
   */
  $("#selectedStop").on("click", function (e) {
    const scriptCode = this.value;
    bootbox.confirm(
      `Stop ${selectedIds.length} Services` + scriptCode,
      function (result) {
        if (result) {
          $.ajax({
            url: "/admin/service/status",
            type: "POST",
            data: JSON.stringify({ action: "stop", selectedIds: selectedIds }), // Chuyển đổi thành JSON
            contentType: "application/json",
          }).done(function (data) {
            location.reload();
          });
        }
      }
    );
  });

  $("#selectedStart").on("click", function (e) {
    const scriptCode = this.value;
    bootbox.confirm(
      `Run ${selectedIds.length} Services` + scriptCode,
      function (result) {
        if (result) {
          $.ajax({
            url: "/admin/service/status",
            type: "POST",
            data: JSON.stringify({ action: "start", selectedIds: selectedIds }), // Chuyển đổi thành JSON
            contentType: "application/json",
          }).done(function (data) {
            location.reload();
          });
        }
      }
    );
  });

  $("#selectedDelete").on("click", function (e) {
    const scriptCode = this.value;
    bootbox.confirm(
      `Delete ${selectedIds.length} Services` + scriptCode,
      function (result) {
        if (result) {
          $.ajax({
            url: "/admin/service/status",
            type: "POST",
            data: JSON.stringify({
              action: "delete",
              selectedIds: selectedIds,
            }),
            contentType: "application/json",
          }).done(function (data) {
            if (data.message) {
              // Xóa các hàng đã xóa khỏi bảng
              data.selectedIds.forEach((id) => {
                $(`tr:has(.service-checkbox[value="${id}"])`).remove();
              });

              // Cập nhật lại số lượng ID đã chọn
              selectedIds = selectedIds.filter(
                (id) => !data.selectedIds.includes(id)
              );
              $("#selectedCount").text(selectedIds.length);
            } else {
              // Xử lý lỗi nếu có
              console.error(data.error);
            }
          });
        }
      }
    );
  });

  $("#selectedPlaylistDescription").on("click", function (e) {
    const scriptCode = this.value;
    bootbox.confirm(
      `Update playlist description ${selectedIds.length} Services` + scriptCode,
      function (result) {
        if (result) {
          $.ajax({
            url: "/admin/service/status",
            type: "POST",
            data: JSON.stringify({
              action: "playlist_description",
              selectedIds: selectedIds,
            }), // Chuyển đổi thành JSON
            contentType: "application/json",
          }).done(function (data) {
            location.reload();
          });
        }
      }
    );
  });

  // Xử lý sự kiện click cho nút "Save Channel ID"
  $("#save_edit_playlist_description").on("click", function (e) {
    document.querySelector("#save_edit_playlist_description").innerText =
      "Đang chạy";
    document
      .querySelector("#save_edit_playlist_description")
      .setAttribute("disabled", true);
    let updatedDescription = document.querySelector(
      "#edit_playlist_description"
    ).value;
    if (updatedDescription) {
      $.ajax({
        url: "/admin/service/status",
        type: "POST",
        data: JSON.stringify({
          action: "playlist_description",
          selectedIds: selectedIds,
          updatedDescription,
        }), // Chuyển đổi thành JSON
        contentType: "application/json",
      }).done(function (data) {
        location.reload();
      });
    }
  });

  // Đổi id kênh
  $("#tableList").on("click", "tr .changeId", function () {
    const id = $(this).attr("value");

    // Hiển thị form/modal để nhập ID mới
    bootbox.confirm(
      "Nguy hiểm. Bạn có chắc chắn muốn thay đổi ID dịch vụ này? Điều này có thể khiến đối tác/khách hàng không thể tìm thấy thông tin của nó. Chỉ sử dụng chức năng này khi có id bị trùng lặp.",
      function (result) {
        if (result) {
          $.ajax({
            url: "/admin/service/change-id",
            type: "PUT",
            data: JSON.stringify({ _id: id }),
            contentType: "application/json",
          }).done(function (data) {
            location.reload();
          });
        }
      }
    );
  });

  // Hàm để tải và hiển thị danh sách kênh
  function loadChannels() {
    $.ajax({
      url: "/admin/channels",
      type: "GET",
      success: function (channels) {
        var channelList = $("#channelList");
        channelList.empty();

        if (channels.length === 0) {
          channelList.html(
            '<p class="text-muted text-center my-3">Không có kênh nào được theo dõi.</p>'
          );
          return;
        }

        var listGroup = $('<div class="list-group"></div>');
        channels.forEach(function (channel) {
          var item = $(`
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <span>${channel.channelId}</span>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${channel._id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
          `);
          listGroup.append(item);
        });
        channelList.append(listGroup);
      },
      error: function (xhr, status, error) {
        console.error("Error loading channels:", error);
        $("#channelList").html(
          '<p class="text-danger text-center my-3">Có lỗi xảy ra khi tải danh sách kênh.</p>'
        );
      },
    });
  }

  $(document).on("click", ".delete-btn", function () {
    var id = $(this).data("id");
    if (confirm("Bạn có chắc chắn muốn xóa kênh này?")) {
      deleteChannel(id);
    }
  });

  function deleteChannel(id) {
    $.ajax({
      url: "/admin/channels/" + id,
      type: "DELETE",
      success: function (result) {
        loadChannels();
      },
      error: function (xhr, status, error) {
        console.error("Error deleting channel:", error);
        alert("Có lỗi xảy ra khi xóa kênh. Vui lòng thử lại.");
      },
    });
  }

  // Function to show alerts
  function showAlert(message, type) {
    const alertDiv = document.createElement("div");
    alertDiv.style.position = "fixed";
    alertDiv.style.top = "20px";
    alertDiv.style.right = "20px";
    alertDiv.style.zIndex = "9999";

    const alertHtml = `
      <div class="toast shadow border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header border-0 bg-${type} text-white py-2">
          <strong class="mr-auto">
            <i class="fas ${
              type === "success" ? "fa-check-circle" : "fa-exclamation-triangle"
            } mr-2"></i>
            ${type === "success" ? "Success!" : "Error!"}
          </strong>
          <button type="button" class="close text-white" data-dismiss="toast" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="toast-body py-2 text-gray-800">
          ${message}
        </div>
      </div>
    `;

    alertDiv.innerHTML = alertHtml;
    document.body.appendChild(alertDiv);

    const toastElement = alertDiv.querySelector(".toast");
    toastElement.classList.add("fade");

    const toast = new bootstrap.Toast(toastElement, {
      delay: 3000,
      animation: true,
    });

    setTimeout(() => {
      toastElement.classList.add("show");
    }, 100);

    toast.show();

    toastElement.addEventListener("hidden.bs.toast", function () {
      document.body.removeChild(alertDiv);
    });
  }

  // Tải danh sách kênh khi trang được load
  // loadChannels();

  // Tải lại danh sách kênh khi modal được mở (nếu sử dụng modal)
  // $("#channel_list_modal").on("show.bs.modal", function () {
  //   loadChannels();
  // });

  // Lấy config từ biến toàn cục
  let config = window.appConfig || {};
  console.log("Config từ server:", config);

  // Hiển thị dữ liệu config trong modal khi mở
  $("#backblazeKeyModal").on("show.bs.modal", function () {
    // Nếu có dữ liệu Backblaze trong config, hiển thị nó
    if (config && config.backblaze) {
      $('input[name="applicationKeyId"]').val(
        config.backblaze.applicationKeyId || ""
      );
      $('input[name="applicationKey"]').val(
        config.backblaze.applicationKey || ""
      );
    }
  });

  const script_code = document.querySelector("#script_code").value;

  if (
    [
      "create_video",
      "ai_create_video",
      "chatgpt_create_audio",
      "chatgpt_create_video",
      "create_video_1",
      "create_audio_1",
      "create_image_1",
      "create_image_2",
      "video_merge_1",
    ].includes(script_code)
  ) {
    const { applicationKeyId, applicationKey } = config?.backblaze || {};
    if (!applicationKeyId || !applicationKey) {
      $("#backblazeKeyModal").modal("show");
    }
  }

  // Kiểm tra và điều chỉnh trạng thái nút Close khi mở modal
  $("#backblazeKeyModal").on("show.bs.modal", function () {
    let closeButton = $(this).find(".modal-footer .btn-secondary");

    // Nếu không có config backblaze hoặc thiếu một trong các giá trị cần thiết
    if (
      !config?.backblaze?.applicationKeyId ||
      !config?.backblaze?.applicationKey
    ) {
      // Disable nút Close
      closeButton.prop("disabled", true);
    } else {
      // Enable nút Close nếu đã có đủ thông tin
      closeButton.prop("disabled", false);
    }

    // Hiển thị dữ liệu trong form
    if (config && config.backblaze) {
      $('input[name="applicationKeyId"]').val(
        config.backblaze.applicationKeyId || ""
      );
      $('input[name="applicationKey"]').val(
        config.backblaze.applicationKey || ""
      );
    }
  });

  // Kiểm tra và điều chỉnh trạng thái nút Close khi mở modal

  // Xử lý sự kiện khi người dùng ấn nút "Save Changes"
  $("#submit-backblazeKey-btn").on("click", function () {
    // Lấy dữ liệu từ form
    let applicationKeyId = $('input[name="applicationKeyId"]').val();
    let applicationKey = $('input[name="applicationKey"]').val();

    // Kiểm tra tính hợp lệ của form
    if (!applicationKeyId || !applicationKey) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Chuẩn bị dữ liệu gửi lên server
    let data = {
      type: "backblaze",
      backblaze: {
        applicationKeyId: applicationKeyId,
        applicationKey: applicationKey,
      },
    };

    // Gửi dữ liệu lên server
    $.ajax({
      url: `/admin/config/post-update`,
      method: "POST",
      data: data,
      success: function (response) {
        // Hiển thị thông báo thành công nếu cần
        alert("Lưu cấu hình thành công!");
        // Tải lại trang
        window.location.reload();
      },
      error: function (error) {
        // Xử lý lỗi
        console.error("Lỗi khi cập nhật cấu hình:", error);
        alert("Đã xảy ra lỗi khi lưu cấu hình. Vui lòng thử lại.");
      },
    });
  });
})(jQuery); // End of use strict

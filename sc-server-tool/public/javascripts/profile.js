(function ($) {
  "use strict"; // Start of use strict

  // Biến toàn cục
  let perPage = 50;
  let currentPage = 1;

  /**
   * Hàm xây dựng chuỗi truy vấn URL dựa trên giá trị của các input filter
   * @returns {string} Chuỗi truy vấn URL
   */
  function getQuery() {
    const statusDescription = encodeURIComponent(
      $("#status-description").val()
    );
    const status = $("#profile-status").val();
    const totalCreatedUsers = $("#total-created-users").val();
    const totalCreatedUsersMax = $("#total-created-users-max").val();
    const totalStartBat = $("#total-start-bat").val();
    const totalEndBat = $("#total-end-bat").val();
    const lastUpdate = $("#last-update").val();
    const email = $("#email").val();
    const type = $("#profile-type").val();
    const verified = $("#verified").val();
    const verified_studio = $("#verified_studio").val();
    const twoFA = $("#2fa").val();
    const backup_code = $("#backup_code").val();
    const elevenlabs_key = $("#elevenlabs_key").val();

    let queryString = `?statusDescription=${statusDescription}&totalCreatedUsersMax=${totalCreatedUsersMax}&status=${status}&lastUpdate=${lastUpdate}&totalCreatedUsers=${totalCreatedUsers}&per_page=${perPage}&current_page=${currentPage}`;
    if (totalStartBat) {
      queryString += `&totalStartBat=${totalStartBat}`;
    }
    if (type) {
      queryString += `&type=${type}`;
    }
    if (email) {
      queryString += `&email=${email}`;
    }
    if (totalEndBat) {
      queryString += `&totalEndBat=${totalEndBat}`;
    }
    if (verified) {
      queryString += `&verified=${
        verified === "verified" || !(verified === "unverified")
      }`;
    }

    if (verified_studio) {
      queryString += `&verified_studio=${
        verified_studio === "verified"
          ? 1
          : verified_studio === "unverified"
          ? 0
          : verified_studio === "no_verification_needed"
          ? -1
          : ""
      }`;
    }

    if (twoFA) {
      queryString += `&twoFA=${twoFA === "2fa" || !(twoFA === "no2fa")}`;
    }

    if (backup_code) {
      queryString += `&backup_code=${
        backup_code === "backup_code"
          ? 1
          : backup_code === "no_backup_code"
          ? 0
          : ""
      }`;
    }

    if (elevenlabs_key) {
      queryString += `&elevenlabs_key=${
        elevenlabs_key === "elevenlabs_key"
          ? 1
          : elevenlabs_key === "no_elevenlabs_key"
          ? 0
          : ""
      }`;
    }

    return queryString;
  }

  /**
   * Hàm lấy giá trị của tham số truy vấn trong URL
   * @param {string} name Tên của tham số truy vấn
   * @param {string} url URL cần lấy tham số truy vấn
   * @returns {string} Giá trị của tham số truy vấn
   */
  function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // Khởi tạo giá trị cho các input filter từ tham số truy vấn
  $(document).ready(function () {
    $("#status-description").val(
      getParameterByName("statusDescription")
        ? $("#status-description")
            .val(getParameterByName("statusDescription").trim())
            .trim()
        : ""
    );
    $("#profile-status").val(getParameterByName("status") || "");
    $("#total-created-users").val(getParameterByName("totalCreatedUsers"));
    $("#total-created-users-max").val(
      getParameterByName("totalCreatedUsersMax")
    );
    $("#total-start-bat").val(getParameterByName("totalStartBat"));
    $("#total-end-bat").val(getParameterByName("totalEndBat"));
    $("#last-update").val(getParameterByName("lastUpdate"));
    $("#email").val(getParameterByName("email"));
    $("#verified").val(
      getParameterByName("verified") === "true"
        ? "verified"
        : getParameterByName("verified") === "false"
        ? "unverified"
        : ""
    );
    $("#2fa").val(
      getParameterByName("twoFA") === "true"
        ? "2fa"
        : getParameterByName("twoFA") === "false"
        ? "no2fa"
        : ""
    );

    $("#backup_code").val(
      getParameterByName("backup_code") === "1"
        ? "backup_code"
        : getParameterByName("backup_code") === "0"
        ? "no_backup_code"
        : ""
    );

    $("#elevenlabs_key").val(
      getParameterByName("elevenlabs_key") === "1"
        ? "elevenlabs_key"
        : getParameterByName("elevenlabs_key") === "0"
        ? "no_elevenlabs_key"
        : ""
    );

    perPage = Number(getParameterByName("per_page") || 20);
    currentPage = Number(getParameterByName("current_page") || 1);
  });

  // Xử lý sự kiện thay đổi filter
  $("#profileFilter").on("change", function (e) {
    const filterVal = $("#profileFilter").val();
    const newPath = `${location.origin}${location.pathname}?filter=${filterVal}`;
    location.replace(newPath);
  });

  // Xử lý sự kiện chuyển trang
  $("#pre_page").on("click", function (e) {
    if (currentPage > 1) {
      currentPage -= 1;
      const newPath = `${location.origin}${location.pathname}${getQuery()}`;
      location.replace(newPath);
    }
  });
  $("#next_page").on("click", function (e) {
    currentPage += 1;
    const newPath = `${location.origin}${location.pathname}${getQuery()}`;
    location.replace(newPath);
  });

  // Xử lý sự kiện cập nhật cấu hình
  $("#renew_for_suspend").on("click", function (e) {
    $.ajax({
      url: "/admin/config/post-update",
      type: "POST",
      data: JSON.stringify({
        renew_for_suspend: $("#renew_for_suspend").is(":checked"),
      }),
      contentType: "application/json; charset=utf-8",
    }).done(function (data) {
      location.reload();
    });
  });

  // Xử lý sự kiện kích hoạt/hủy bỏ reset profile
  $("#active_reset_profiles").on("click", function (e) {
    $.ajax({
      url: `/admin/profile/active-reset-profiles-flag`,
      type: "get",
    }).done(function (data) {
      location.reload();
    });
  });
  $("#cancel_active_reset_profiles").on("click", function (e) {
    $.ajax({
      url: `/admin/profile/cancel-active-reset-profiles-flag`,
      type: "get",
    }).done(function (data) {
      location.reload();
    });
  });

  // Xử lý sự kiện xem trước file import
  $("#previewBtn").on("click", function (e) {
    Papa.parse($("#profileFile").prop("files")[0], {
      skipEmptyLines: true,
      complete: function (results, file) {
        console.log("Parsing complete:", results, file);
        if ($.fn.DataTable.isDataTable("#previewTable")) {
          $("#previewTable").DataTable().destroy();
        }

        if (results.data[0][0].indexOf("sep=") === 0) {
          results.data.shift();
        }
        if (results.data[0][0].toLowerCase().indexOf("email") === 0) {
          results.data.shift();
        }

        $("#previewTable").DataTable({
          data: results.data.slice(0, 10),
          columns: [
            { title: "Email" },
            { title: "Password" },
            { title: "Recover mail" },
            { title: "Recover phone", defaultContent: "" },
          ],
          order: [],
        });
      },
    });
  });

  // Xử lý sự kiện import profile
  $("#saveBtn").on("click", function (e) {
    const $btn = $(this); // Lưu lại tham chiếu nút
    const type = document.querySelector("#profile-import-type").value;

    $btn
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin mr-2"></i> Đang xử lý...');

    $.ajax({
      url: `/oam/insert-profile-email?type=${type}`,
      type: "POST",
      data: new FormData($("#profileImportForm")[0]),
      processData: false,
      contentType: false,
    })
      .done(function (data) {
        bootbox.confirm(JSON.stringify(data, null, 2), function (result) {
          location.reload();
        });
      })
      .fail(function (err) {
        console.error("Lỗi khi import profile:", err);
        alert("Đã xảy ra lỗi khi import profile!");
      })
      .always(function () {
        $btn.prop("disabled", false).html("import");
      });
  });

  // Xử lý sự kiện xóa tất cả profile
  $("#deleteAll").on("click", function (e) {
    bootbox.confirm("Delete profile?", function (result) {
      if (result) {
        $.ajax({
          url: `/profile/delete-all-profile${getQuery()}`,
          type: "get",
          processData: false,
          contentType: false,
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện di chuyển profile vào thùng rác
  $("#moveToTrashBtn").on("click", function (e) {
    bootbox.confirm("Move to trash selected profiles?", function (result) {
      if (result) {
        $.ajax({
          url: `/profile/move-to-trash${getQuery()}`,
          type: "get",
          processData: false,
          contentType: false,
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện cập nhật cấu hình
  $("#resetBackupCodeBtn").on("click", function (e) {
    bootbox.confirm("Reset backup codes profiles?", function (result) {
      if (result) {
        $.ajax({
          url: `/admin/profile/reset-backup-codes`,
          type: "PUT",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện cập nhật cấu hình
  $("#change2faBtn").on("click", function (e) {
    bootbox.confirm("Change 2FA profiles?", function (result) {
      if (result) {
        $.ajax({
          url: `/admin/profile/change-2fa`,
          type: "PUT",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện cập nhật cấu hình
  $("#verifyStudioBtn").on("click", function (e) {
    bootbox.confirm("Verify studio profiles?", function (result) {
      if (result) {
        $.ajax({
          url: `/admin/profile/verify-studio`,
          type: "PUT",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện xuất profile
  $("#exportBTN").on("click", function (e) {
    bootbox.confirm("Export profiles?", function (result) {
      if (result) {
        const newPath = `${
          location.origin
        }/profile/export-profiles${getQuery()}`;
        window.open(newPath);
        location.reload();
      }
    });
  });
  $("#exportBTN2").on("click", function (e) {
    bootbox.confirm("Export profiles?", function (result) {
      if (result) {
        const newPath = `${
          location.origin
        }/profile/export-profiles${getQuery()}&no_delete=true`;
        window.open(newPath);
        location.reload();
      }
    });
  });
  $("#exportKeys").on("click", function (e) {
    bootbox.confirm("Export Gemini Api Keys?", function (result) {
      if (result) {
        const newPath = `${
          location.origin
        }/profile/export-gemini-keys${getQuery()}`;
        window.open(newPath);
        location.reload();
      }
    });
  });
  $("#exportYoutubeKeys").on("click", function (e) {
    bootbox.confirm("Export Youtube Api Keys?", function (result) {
      if (result) {
        const newPath = `${
          location.origin
        }/profile/export-youtube-keys${getQuery()}`;
        window.open(newPath);
        location.reload();
      }
    });
  });

  $("#exportChannelLinks").on("click", function (e) {
    bootbox.confirm("Export Channel Links?", function (result) {
      if (result) {
        const newPath = `${
          location.origin
        }/profile/export-channel-links${getQuery()}`;
        window.open(newPath);
        location.reload();
      }
    });
  });

  $("#exportEmails").on("click", function (e) {
    bootbox.confirm("Export Emails?", function (result) {
      if (result) {
        const newPath = `${location.origin}/profile/export-emails${getQuery()}`;
        window.open(newPath);
        location.reload();
      }
    });
  });

  // Xử lý sự kiện tìm kiếm
  $("#searchBtn").on("click", function (e) {
    const newPath = `${location.origin}${location.pathname}${getQuery()}`;
    location.replace(newPath);
  });

  // Xử lý sự kiện chuyển trạng thái về NEW
  $("#revert_error").on("click", function (e) {
    bootbox.confirm("Chuyển status về NEW ?", function (result) {
      if (result) {
        $.ajax({
          url: `/profile/revert-error${getQuery()}`,
          type: "get",
          processData: false,
          contentType: false,
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  // Xử lý sự kiện reset profile trên VM
  $("#playlistTable").on("click", "tr .resetProfileBtn", function () {
    const id = $(this).data("profile-id");

    // Tạo dialog xác nhận với dropdown chọn type
    bootbox.dialog({
      title: "Xác nhận reset profile",
      message: `
        <form>
          <div class="form-group">
            <label for="profileTypeSelect">Chọn trạng thái reset:</label>
            <select class="form-control" id="profileTypeSelect">
              <option value="NEW" selected>NEW</option>
              <option value="ERROR">ERROR</option>
            </select>
            <small class="form-text text-muted">Trạng thái mặc định: NEW</small>
          </div>
          <p class="mt-3">Bạn có chắc chắn muốn xóa profile này trên VM và lấy profile mới?</p>
        </form>
      `,
      buttons: {
        cancel: {
          label: "Hủy",
          className: "btn-secondary",
          callback: function () {
            // Không làm gì khi hủy
          },
        },
        confirm: {
          label: "Xác nhận",
          className: "btn-danger",
          callback: function () {
            // Lấy giá trị đã chọn từ dropdown
            const selectedType = $("#profileTypeSelect").val();

            // Gọi API với cả id và type
            $.ajax({
              url: "/admin/profile/reset-profile-on-vm",
              type: "GET",
              data: {
                id: id,
                type: selectedType,
              },
              contentType: "application/json",
            })
              .done(function (data) {
                location.reload();
              })
              .fail(function (error) {
                console.error("Lỗi khi reset profile:", error);
                bootbox.alert({
                  title: "Lỗi",
                  message: "Đã xảy ra lỗi khi reset profile.",
                });
              });
          },
        },
      },
    });
  });
})(jQuery); // End of use strict

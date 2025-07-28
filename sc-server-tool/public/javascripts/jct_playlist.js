(function ($) {
  "use strict"; // Start of use strict
  let dataTable = {}; //$('#playlistTable').DataTable()
  let per_page = 50;
  let current_page = 1;

  console.log("palylsit public");

  function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  $(document).ready(function () {
    per_page = Number(getParameterByName("per_page") || 20);
    current_page = Number(getParameterByName("current_page") || 1);

    $("#tagSelector").val(getParameterByName("tag"));
    $("#countVideo").val(getParameterByName("countVideo"));
    $("#typeCountVideo").val(getParameterByName("typeCountVideo") || "$gt");
    $("#countView").val(getParameterByName("countView"));
    $("#typeCountView").val(getParameterByName("typeCountView") || "$gt");
  });

  function getQuery() {
    let qr = `?per_page=${per_page}&current_page=${current_page}`;
    let tag = $("#tagSelector").val();

    let countVideo = $("#countVideo").val();
    let typeCountVideo = $("#typeCountVideo").val();
    if (countVideo && typeCountVideo) {
      qr += `&typeCountVideo=${typeCountVideo}&countVideo=${countVideo}`;
    }

    let typeCountView = $("#typeCountView").val();
    let countView = $("#countView").val();
    if (countView && typeCountView) {
      qr += `&countView=${countView}&typeCountView=${typeCountView}`;
    }

    if (tag) {
      qr += `&tag=${tag}`;
    }
    return qr;
  }

  function search() {
    let newPath = location.origin + location.pathname + getQuery();
    location.replace(newPath);
  }

  $("#searchBtn").on("click", function (e) {
    search();
  });

  $("#pre_page").on("click", function (e) {
    if (current_page > 1) {
      current_page -= 1;
      let newPath = location.origin + location.pathname + getQuery();
      location.replace(newPath);
    }
  });
  $("#next_page").on("click", function (e) {
    current_page += 1;
    let newPath = location.origin + location.pathname + getQuery();
    location.replace(newPath);
  });

  $("#deleteAll").click(function () {
    bootbox.confirm("Delete all ?", function (result) {
      if (result) {
        $.ajax({
          url: "/admin/jct_playlist/delete-all",
          type: "GET",
        }).done(function (data) {
          location.reload();
        });
      }
    });
  });

  $("#tagSelector").on("change", function (e) {
    search();
  });

  // Xử lý sự kiện click cho nút "Save Channel ID"
  $("#saveChannelID").on("click", function (e) {
    document.querySelector("#saveChannelID").innerText = "Đang chạy";
    document.querySelector("#saveChannelID").setAttribute("disabled", true);
    const channelID = document.querySelector("#channel_id_change").value;

    if (channelID) {
      $.ajax({
        url: "/admin/jct_playlist/set-channel" + getQuery(),
        type: "get",
        data: {
          channelID,
          script_code: "add_video_playlist",
        },
      }).done(function (data) {
        location.reload();
      });
    }
  });

  // Xử lý sự kiện click cho nút "Load Playlist Data"
  $("#loadJCTPlaylistData").on("click", function (e) {
    document.querySelector("#loadJCTPlaylistData").innerText = "Đang chạy";
    document
      .querySelector("#loadJCTPlaylistData")
      .setAttribute("disabled", true);

    $.ajax({
      url: "/admin/jct_playlist/update-playlists",
      type: "get",
    }).done(function (data) {
      location.reload();
    });
  });

  // Export playlists
  document
    .getElementById("exportPlaylists")
    .addEventListener("click", async () => {
      try {
        const response = await fetch("/admin/jct_playlist/export");
        const playlists = await response.json();
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(playlists));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "playlists_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } catch (error) {
        console.error("Error exporting playlists:", error);
        alert("Error exporting playlists");
      }
    });

  // Import playlists
  document.getElementById("importPlaylists").addEventListener("click", () => {
    document.getElementById("importPlaylistFile").click();
  });

  document
    .getElementById("importPlaylistFile")
    .addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const playlists = JSON.parse(e.target.result);
            const response = await fetch("/admin/jct_playlist/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(playlists),
            });
            const result = await response.json();
            if (result.success) {
              alert("Playlists imported successfully");
              location.reload(); // Tải lại trang để hiển thị danh sách playlist mới
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error importing playlists:", error);
            alert("Error importing playlists");
          }
        };
        reader.readAsText(file);
      }
    });
})(jQuery); // End of use strict

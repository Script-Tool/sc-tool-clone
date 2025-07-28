(function ($) {
  'use strict'; // Start of use strict

  const Urls = {
    importScripts: '/admin/script/import-scripts',
    updateStatus: '/admin/script/update-status',
    updateIsBreak: '/admin/script/update-is-break',
    updatePosition: '/admin/script/update-position',
    deleteScript: '/admin/script/delete',
    deletePlaylist: '/oam/delete-playlist',
    addScript: '/admin/script/add',
    insertPlaylist: '/oam/insert-playlist',
    updatePlaylist: '/oam/update-playlist',
  };

  const Messages = {
    deleteConfirm: 'Delete?',
    deleteVideosConfirm: (count) => `Delete ${count} videos?`,
    addScriptConfirm: 'Add Script?',
    stopViewConfirm: (count) => `Stop view for ${count} videos?`,
    startViewConfirm: (count) => `Start view for ${count} videos?`,
  };

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

  const dataTable = $('#playlistTable').DataTable({
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
            ? moment(new Date(data)).format('YYYY-MM-DD HH:mm:ss')
            : data;
        },
      },
      { searchable: false, targets: COL_INDEX.update_time },
    ],
    rowId: 1,
  });

  // Sự kiện click cho #saveImportBtn
  $('#saveImportBtn').on('click', function () {
    $.ajax({
      url: Urls.importScripts,
      type: 'POST',
      data: new FormData($('#scriptImportForm')[0]),
      processData: false,
      contentType: false,
    }).done(function (data) {
      if (!data.success && data.errorChannels) {
        $('#dup_data_section').addClass('d-block');
        $('#dup_data').val(data.errorChannels.join('\n'));
      } else {
        location.reload();
      }
    });
  });

  // Sự kiện click cho .statusCheckbox trong #tableList
  $('#tableList').on('click', 'tr .statusCheckbox', function () {
    const id = $(this).attr('id');
    $.ajax({
      url: `${Urls.updateStatus}?id=${id}`,
      type: 'GET',
    }).done(function () {
      location.reload();
    });
  });

  // Sự kiện click cho .breakCheckbox trong #tableList
  $('#tableList').on('click', 'tr .breakCheckbox', function () {
    const id = $(this).attr('id');
    $.ajax({
      url: `${Urls.updateIsBreak}?id=${id}`,
      type: 'GET',
    }).done(function () {
      location.reload();
    });
  });

  // Sự kiện click cho .positionBtn trong #tableList
  $('#tableList').on('click', 'tr .positionBtn', function () {
    const id = $(this).attr('value');
    $.ajax({
      url: Urls.updatePosition,
      type: 'GET',
      data: { id },
      contentType: 'application/json',
    }).done(function () {
      location.reload();
    });
  });

  // Sự kiện click cho .videoDelete trong #tableList
  $('#tableList').on('click', 'tr .videoDelete', function () {
    const id = $(this).attr('value');
    bootbox.confirm(Messages.deleteConfirm, function (result) {
      if (result) {
        $.ajax({
          url: Urls.deleteScript,
          type: 'GET',
          data: { id },
          contentType: 'application/json',
        }).done(function () {
          location.reload();
        });
      }
    });
  });

  // Sự kiện click cho #deleteAll
  $('#deleteAll').click(function () {
    const selectedIds = getSelectedIds();
    bootbox.confirm(
      Messages.deleteVideosConfirm(selectedIds.length),
      function (result) {
        if (result) {
          $.ajax({
            url: Urls.deletePlaylist,
            type: 'GET',
            data: { ids: selectedIds, enable: -1 },
            contentType: 'application/json',
          }).done(function () {
            location.reload();
          });
        }
      }
    );
  });

  // Sự kiện click cho #saveVideo
  $('#saveVideo').click(function () {
    bootbox.confirm(Messages.addScriptConfirm, function (result) {
      if (result) {
        $.ajax({
          url: Urls.addScript,
          type: 'GET',
          data: {
            name: $('#script_name').val(),
            code: $('#script_code').val(),
            example_data: $('#script_example_data').val(),
            is_break: $('#script_break').is(':checked'),
            script_type: [$('#script_type').val()],
          },
          contentType: 'application/json',
        }).done(function (data) {
          console.log('------> d', data);
          location.reload();
        });
      }
    });
  });
  // Sự kiện click cho #previewBtn
  $('#previewBtn').on('click', function () {
    Papa.parse($('#playlistFile').prop('files')[0], {
      skipEmptyLines: true,
      complete: function (results, file) {
        console.log('Parsing complete:', results, file);
        if ($.fn.DataTable.isDataTable('#previewTable')) {
          $('#previewTable').DataTable().destroy();
        }

        if (results.data[0][0].indexOf('sep=') === 0) {
          results.data.shift();
        }
        if (results.data[0][0].toLowerCase().indexOf('url') === 0) {
          results.data.shift();
        }

        $('#previewTable').DataTable({
          data: results.data.slice(0, 10),
          columns: [
            { title: 'Url' },
            { title: 'Key word' },
            { title: 'Url type' },
            { title: 'Total times' },
            { title: 'Max watch time' },
            { title: 'Suggest videos' },
            { title: 'Suggest percent' },
            { title: 'Hour view' },
            { title: 'Priority' },
            { title: 'Page watch' },
            { title: 'Enable' },
          ],
          order: [],
        });
      },
    });
  });

  // Sự kiện click cho #saveBtn
  $('#saveBtn').on('click', function () {
    $.ajax({
      url: Urls.insertPlaylist,
      type: 'POST',
      data: new FormData($('#playlistImportForm')[0]),
      processData: false,
      contentType: false,
    }).done(function (data) {
      bootbox.alert(JSON.stringify(data, null, 2), function () {
        location.reload();
      });
    });
  });

  // Sự kiện change cho #allCheck
  $('#allCheck').change(function () {
    const checked = $(this).prop('checked');
    const table = $('#playlistTable').DataTable();
    table.rows({ search: 'applied' }).every(function () {
      const data = this.data();
      data[COL_INDEX.checkbox] = createCheckbox(data[COL_INDEX.id], checked);
      this.data(data);
      this.invalidate();
    });
    table.draw(false);
  });

  // Sự kiện change cho checkbox trong #playlistTable
  $('#playlistTable').on('change', 'tr input[type="checkbox"]', function () {
    const rowId = $(this).attr('value');
    const checked = $(this).prop('checked');
    const row = dataTable.row(`#${rowId}`);
    const data = row.data();
    data[COL_INDEX.checkbox] = createCheckbox(data[COL_INDEX.id], checked);
    row.data(data);
    row.invalidate();
    dataTable.draw(false);
  });

  // Sự kiện click cho #stopAll
  $('#stopAll').click(function () {
    const selectedIds = getSelectedIds();
    bootbox.confirm(
      Messages.stopViewConfirm(selectedIds.length),
      function (result) {
        if (result) {
          $.ajax({
            url: Urls.updatePlaylist,
            type: 'GET',
            data: { ids: selectedIds, enable: 0 },
            contentType: 'json',
          }).done(function (data) {
            bootbox.alert(JSON.stringify(data, null, 2), function () {
              location.reload();
            });
          });
        }
      }
    );
  });

  // Sự kiện click cho #startAll
  $('#startAll').click(function () {
    const selectedIds = getSelectedIds();
    bootbox.confirm(
      Messages.startViewConfirm(selectedIds.length),
      function (result) {
        if (result) {
          $.ajax({
            url: Urls.updatePlaylist,
            type: 'GET',
            data: { ids: selectedIds, enable: 1 },
            contentType: 'application/json',
          }).done(function (data) {
            bootbox.alert(JSON.stringify(data, null, 2), function () {
              location.reload();
            });
          });
        }
      }
    );
  });

  // Hàm tạo checkbox trong bảng
  function createCheckbox(value, checked = false) {
    return `<input type="checkbox" value="${value}" ${
      checked ? 'checked="true"' : ''
    }>`;
  }

  // Hàm lấy danh sách ID đã chọn
  function getSelectedIds() {
    const selectedIds = [];
    dataTable.rows().every(function () {
      const data = this.data();
      if ($(data[COL_INDEX.checkbox]).prop('checked')) {
        selectedIds.push(data[COL_INDEX.id]);
      }
    });
    return selectedIds;
  }
})(jQuery); // End of use strict

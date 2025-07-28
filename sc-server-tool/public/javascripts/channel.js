(function($) {
    "use strict"; // Start of use strict

    const COL_INDEX = {
        checkbox: 0,
        id: 1,
        name: 2,
        url: 3,
        keyword: 4,
        enable: 5,
        sub: 6,
        create_time: 7,
        update_time: 8
    };

    const Urls = {
        insertChannel: "/oam/insert-channel",
        updateChannel: "/oam/update-channel",
        updateEnoughChannel: "/oam/update-enough-channel",
        updateSingleChannel: "/oam/update-single-channel"
    };

    const Messages = {
        stopConfirm: count => `Stop sub for ${count} videos?`,
        startConfirm: count => `Start sub for ${count} videos?`,
        deleteConfirm: count => `Delete ${count} channels?`,
        disableConfirm: "Disable sub for enough channels?",
        saveConfirm: "Save channel?"
    };

    const dataTable = $('#channelTable').DataTable({
        "columnDefs": [
            {
                "targets": [COL_INDEX.create_time, COL_INDEX.update_time],
                "render": function(data, type, row, meta) {
                    return moment(new Date(data)).format("YYYY-MM-DD HH:mm:ss");
                }
            },
            { "searchable": false, "targets": COL_INDEX.update_time }
        ],
        rowId: COL_INDEX.id
    });

    // Hàm tạo checkbox trong bảng
    function createCheckbox(value, checked = false) {
        return `<input type="checkbox" value="${value}" ${checked ? 'checked="true"' : ''}>`;
    }

    // Hàm lấy danh sách ID đã chọn
    function getSelectedIds() {
        const selectedIds = [];
        dataTable.rows().every(function() {
            const data = this.data();
            if ($(data[COL_INDEX.checkbox]).prop('checked')) {
                selectedIds.push(data[COL_INDEX.id]);
            }
        });
        return selectedIds;
    }

    // Sự kiện click cho #previewBtn
    $('#previewBtn').on('click', function() {
        Papa.parse($('#channelFile').prop('files')[0], {
            skipEmptyLines: true,
            complete: function(results, file) {
                console.log("Parsing complete:", results, file);
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
                        { title: "Url" },
                        { title: "Keyword" },
                        { title: "Name" },
                        { title: "Enable" },
                    ],
                    "order": []
                });
            }
        });
    });

    // Sự kiện click cho #saveBtn
    $("#saveBtn").on('click', function() {
        $.ajax({
            url: Urls.insertChannel,
            type: "POST",
            data: new FormData($('#channelImportForm')[0]),
            processData: false,
            contentType: false
        }).done(function(data) {
            bootbox.alert(JSON.stringify(data, null, 2), function() {
                location.reload();
            });
        });
    });

    // Sự kiện change cho #allCheck
    $('#allCheck').change(function() {
        const checked = $(this).prop('checked');
        dataTable.rows({ search: 'applied' }).every(function() {
            const data = this.data();
            data[COL_INDEX.checkbox] = createCheckbox(data[COL_INDEX.id], checked);
            this.data(data);
            this.invalidate();
        });
        dataTable.draw(false);
    });

    // Sự kiện change cho checkbox trong bảng
    $('#channelTable').on('change', 'tr input[type="checkbox"]', function() {
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
    $('#stopAll').click(function() {
        const selectedIds = getSelectedIds();
        bootbox.confirm(Messages.stopConfirm(selectedIds.length), function(result) {
            if (result) {
                $.ajax({
                    url: Urls.updateChannel,
                    type: "GET",
                    data: { ids: selectedIds, enable: 0 },
                    contentType: 'json',
                }).done(function(data) {
                    bootbox.alert(JSON.stringify(data, null, 2), function() {
                        location.reload();
                    });
                });
            }
        });
    });

    // Sự kiện click cho #startAll
    $('#startAll').click(function() {
        const selectedIds = getSelectedIds();
        bootbox.confirm(Messages.startConfirm(selectedIds.length), function(result) {
            if (result) {
                $.ajax({
                    url: Urls.updateChannel,
                    type: "GET",
                    data: { ids: selectedIds, enable: 1 },
                    contentType: 'application/json',
                }).done(function(data) {
                    bootbox.alert(JSON.stringify(data, null, 2), function() {
                        location.reload();
                    });
                });
            }
        });
    });

    // Sự kiện click cho #deleteAll
    $('#deleteAll').click(function() {
        const selectedIds = getSelectedIds();
        bootbox.confirm(Messages.deleteConfirm(selectedIds.length), function(result) {
            if (result) {
                $.ajax({
                    url: Urls.updateChannel,
                    type: "GET",
                    data: { ids: selectedIds, enable: -1 },
                    contentType: 'application/json',
                }).done(function(data) {
                    bootbox.alert(JSON.stringify(data, null, 2), function() {
                        location.reload();
                    });
                });
            }
        });
    });

    // Sự kiện click cho #updateAll
    $('#updateAll').click(function() {
        bootbox.confirm(Messages.disableConfirm, function(result) {
            if (result) {
                $.ajax({
                    url: Urls.updateEnoughChannel,
                    type: "GET",
                    contentType: 'application/json',
                }).done(function(data) {
                    bootbox.alert(JSON.stringify(data, null, 2), function() {
                        location.reload();
                    });
                });
            }
        });
    });

    // Sự kiện click cho .channelEdit trong bảng
    $('#channelTable').on('click', 'tr .channelEdit', function() {
        const rowId = $(this).attr('value');
        const row = dataTable.row(`#${rowId}`);
        const data = row.data();
        $('#channelId').val(data[COL_INDEX.id]);
        $('#channelName').val(data[COL_INDEX.name]);
        $('#channelUrl').val($(data[COL_INDEX.url]).text());
        $('#channelKeyword').val(data[COL_INDEX.keyword]);
        $('#channelEnable').val(data[COL_INDEX.enable]);
        $('#editChannelModal').modal('show');
    });

    // Sự kiện click cho #saveChannel
    $('#saveChannel').click(function() {
        bootbox.confirm(Messages.saveConfirm, function(result) {
            if (result) {
                $.ajax({
                    url: Urls.updateSingleChannel,
                    type: "GET",
                    data: {
                        channel: [
                            $('#channelName').val(),
                            $('#channelUrl').val(),
                            $('#channelKeyword').val(),
                            $('#channelEnable').val(),
                            $('#channelId').val()
                        ]
                    },
                    contentType: 'application/json',
                }).done(function(data) {
                    bootbox.alert(JSON.stringify(data, null, 2), function() {
                        location.reload();
                    });
                });
            }
        });
    });

})(jQuery); // End of use strict
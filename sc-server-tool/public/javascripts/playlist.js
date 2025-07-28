(function ($) {
    "use strict"; // Start of use strict

    const Urls = {
        updateChartChannel: "/admin/config/update-chart-channel",
        updatePlaylistData: "/admin/playlist/update-data",
        getPlaylist: "/admin/playlist/get-playlist",
        updateConfig: "/playlist/update-config",
        deleteAllPlaylists: "/admin/playlist/delete-all",
        deletePlaylist: "/playlist/delete-playlist",
        addPlaylist: "/admin/playlist/add-playlist",
        insertPlaylist: "/oam/insert-playlist",
        updatePlaylist: "/oam/update-playlist"
    };

    const Messages = {
        updateConfigConfirm: "Update watch config?",
        deleteAllConfirm: "Delete all?",
        deletePlaylistConfirm: "Delete this playlist?",
        addPlaylistConfirm: "Add playlist?",
        stopViewConfirm: count => `Stop view for ${count} videos?`,
        startViewConfirm: count => `Start view for ${count} videos?`
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
        update_time: 18
    };

    // Hàm tạo checkbox trong bảng
    function createCheckbox(value, checked = false) {
        return `<input type="checkbox" value="${value}" ${checked ? 'checked="true"' : ''}>`;
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

    const dataTable = $('#playlistTable').DataTable({
        "columnDefs": [
            {
                "targets": [COL_INDEX.watch_time],
                "render": function (data, type, row, meta) {
                    return Math.floor(data);
                }
            },
            {
                "targets": [COL_INDEX.start_time, COL_INDEX.stop_time, COL_INDEX.create_time, COL_INDEX.update_time],
                "render": function (data, type, row, meta) {
                    return data ? moment(new Date(data)).format("YYYY-MM-DD HH:mm:ss") : data;
                }
            },
            { "searchable": false, "targets": COL_INDEX.update_time }
        ],
        rowId: 1
    });

    // Sự kiện click cho #saveChartBtn
    $('#saveChartBtn').on('click', function () {
        $.ajax({
            url: Urls.updateChartChannel,
            type: "GET",
            data: { data: y_data },
            contentType: 'application/json'
        }).done(function () {
            location.reload();
        });
    });

    // Sự kiện click cho #saveSelectedVms
    $('#saveSelectedVms').on('click', function () {
        const lidE = document.querySelector('#lid');
        const lid = lidE.value;
        if (lid) {
            const vmNames = Array.from(document.querySelectorAll('.vmNameInputs'))
                .filter(input => input.checked)
                .map(input => input.id);

            $.ajax({
                url: Urls.updatePlaylistData,
                type: "GET",
                data: { lid, vm_names: vmNames },
                contentType: 'application/json'
            }).done(function () {
                location.reload();
            });
        } else {
            console.log('Not found lid');
        }
    });

    // Sự kiện click cho .editVmBtn trong #playlistGrid
    $('#playlistGrid').on('click', 'tr .editVmBtn', function () {
        const id = $(this).attr('value');
        $('#lid').val(id);

        $.ajax({
            url: Urls.getPlaylist,
            type: "GET",
            data: { lid: id },
            contentType: 'application/json'
        }).done(function (data) {
            if (data && data.vm_names) {
                Array.from(document.querySelectorAll('.vmNameInputs'))
                    .forEach(input => {
                        input.checked = data.vm_names.includes(input.id);
                    });
            }
        });
    });

    // Sự kiện click cho #saveConfig
    $("#saveConfig").on('click', function () {
        const config = {
            suggest_percent: $('#suggest_percent').val(),
            page_watch: $('#page_watch').val(),
            home_percent: $('#home_percent').val(),
            mobile_percent: $('#mobile_percent').val(),
            search_percent: $('#search_percent').val(),
            direct_percent: $('#direct_percent').val(),
            google_percent: $('#google_percent').val(),
            playlist_percent: $('#playlist_percent').val(),
            ads_percent: $('#ads_percent').val(),
            max_total_profiles: $('#max_total_profiles').val(),
            playlists: $('#playlists').val(),
            total_times_next_video: $('#total_times_next_video').val(),
            watching_time_non_ads: $('#watching_time_non_ads').val(),
            watching_time_start_ads: $('#watching_time_start_ads').val(),
            watching_time_end_ads: $('#watching_time_end_ads').val(),
            total_channel_created: $('#total_channel_created').val(),
            change_proxy_for_channel: $('#change_proxy_for_channel').is(':checked'),
            sub_percent: $('#sub_percent').val(),
            total_loop_find_ads: $('#total_loop_find_ads').val(),
            max_total_profiles_mobile: $('#max_total_profiles_mobile').val()
        };

        bootbox.confirm(`${Messages.updateConfigConfirm}<br><pre>${JSON.stringify(config, null, 2)}</pre>`, function (result) {
            if (result) {
                $.ajax({
                    url: Urls.updateConfig,
                    type: "GET",
                    data: { config },
                    contentType: 'application/json'
                }).done(function (data) {
                    bootbox.alert(JSON.stringify(data, null, 2), function () {
                        location.reload();
                    });
                });
            }
        });
    });

    // Sự kiện click cho #deleteAll
    $('#deleteAll').click(function () {
        bootbox.confirm(Messages.deleteAllConfirm, function (result) {
            if (result) {
                $.ajax({
                    url: Urls.deleteAllPlaylists,
                    type: "GET",
                    data: {},
                    contentType: 'application/json'
                }).done(function () {
                    location.reload();
                });
            }
        });
    });

    // Sự kiện click cho .playlistDelete trong #playlistGrid
    $('#playlistGrid').on('click', 'tr .playlistDelete', function () {
        const id = $(this).attr('value');
        bootbox.confirm(Messages.deletePlaylistConfirm, function (result) {
            if (result) {
                $.ajax({
                    url: Urls.deletePlaylist,
                    type: "GET",
                    data: { id },
                    contentType: 'application/json'
                }).done(function () {
                    location.reload();
                });
            }
        });
    });

    // Sự kiện click cho #savePlaylist
    $('#savePlaylist').click(function () {
        bootbox.confirm(Messages.addPlaylistConfirm, function (result) {
            if (result) {
                $.ajax({
                    url: Urls.addPlaylist,
                    type: "GET",
                    data: {
                        data: $('#playlist_data').val(),
                        total_times_next_video: $('#playlist_total_times_next_video').val(),
                        watching_time_non_ads: $('#playlist_watching_time_non_ads').val(),
                        watching_time_start_ads: $('#playlist_watching_time_start_ads').val(),
                        watching_time_end_ads: $('#playlist_watching_time_end_ads').val(),
                        sub_percent: $('#playlist_sub_percent').val(),
                        ads_percent: $('#playlist_ads_percent').val(),
                        group_type: $('#group_type_1').is(':checked') ? 1 : 0
                    },
                    contentType: 'application/json'
                }).done(function () {
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
                    "order": []
                });
            }
        });
    });

    // Sự kiện click cho #saveBtn
    $("#saveBtn").on('click', function () {
        $.ajax({
            url: Urls.insertPlaylist,
            type: "POST",
            data: new FormData($('#playlistImportForm')[0]),
            processData: false,
            contentType: false
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
        bootbox.confirm(Messages.stopViewConfirm(selectedIds.length), function (result) {
            if (result) {
                $.ajax({
                    url: Urls.updatePlaylist,
                    type: "GET",
                    data: { ids: selectedIds, enable: 0 },
                    contentType: 'json'
                }).done(function (data) {
                    bootbox.alert(JSON.stringify(data, null, 2), function () {
                        location.reload();
                    });
                });
            }
        });
    });

    // Sự kiện click cho #startAll
    $('#startAll').click(function () {
        const selectedIds = getSelectedIds();
        bootbox.confirm(Messages.startViewConfirm(selectedIds.length), function (result) {
            if (result) {
                $.ajax({
                    url: Urls.updatePlaylist,
                    type: "GET",
                    data: { ids: selectedIds, enable: 1 },
                    contentType: 'application/json'
                }).done(function (data) {
                    bootbox.alert(JSON.stringify(data, null, 2), function () {
                        location.reload();
                    });
                });
            }
        });
    });

    // Sự kiện click cho .videoEdit trong #playlistTable
    $('#playlistTable').on('click', 'tr .videoEdit', function () {
        const rowId = $(this).attr('value');
        const row = dataTable.row(`#${rowId}`);
        const data = row.data();
        $('#videoId').val(data[COL_INDEX.id]);
        $('#videoUrl').val($(data[COL_INDEX.url]).text());
        $('#urlType').val(data[COL_INDEX.type]);
        $('#videoKeyword').val(data[COL_INDEX.keyword]);
        $('#totalTime').val(data[COL_INDEX.total_time]);
        $('#maxWatchTime').val(data[COL_INDEX.max_time]);
        $('#suggestVideos').val(data[COL_INDEX.current_view]);
        $('#suggestPercent').val(data[COL_INDEX.max_view]);
        $('#hourView').val(data[COL_INDEX.hour_view]);
        $('#priority').val(data[COL_INDEX.priority]);
        $('#pageWatch').val(data[COL_INDEX.page_watch]);
        $('#startTime').val(data[COL_INDEX.start_time] ? moment(new Date(data[COL_INDEX.start_time])).format("YYYY-MM-DD HH:mm:ss").replace(' ', 'T') : data[COL_INDEX.start_time]);
        ('#stopTime').val(data[COL_INDEX.stop_time] ? moment(new Date(data[COL_INDEX.stop_time])).format("YYYY-MM-DD HH:mm:ss").replace(' ', 'T') : data[COL_INDEX.stop_time]);
        ('#enable').val(data[COL_INDEX.enable]);
        ('#editVideoModal').modal('show');
        ('#videoKeyword').trigger('input');
    });



})(jQuery); // End of use strict
(function ($) {
  "use strict"; // Start of use strict

  const Urls = {
    cancelUpdateVm: "/admin/config/cancel-update-vm",
    updateVm: "/admin/config/update-vm",
    cancelRestartVps: "/oam/cancel-restart-all-vps",
    restartVps: "/oam/restart-all-vps",
    setConfigDevices: "/oam/set-config-devices"
  };

  const Messages = {
    cancelRestartConfirm: "Cancel restart all VPS?",
    restartVpsTitle: "Restart all VPS"
  };

  const groupDevices = [
    [
      { id: 'ip_se', label: 'ip_se', value: '1' },
      { id: 'ip_xr', label: 'ip_xr', value: '2' },
      { id: 'ip_12_pro', label: 'ip_12_pro', value: '3' },
      { id: 'pixel_5', label: 'pixel_5', value: '4' }
    ],
    [
      { id: 'samsung_s8', label: 'samsung_s8', value: '5' },
      { id: 'samsung_s20', label: 'samsung_s20', value: '6' },
      { id: 'ipad_air', label: 'ipad_air', value: '7' },
      { id: 'ipad_mini', label: 'ipad_mini', value: '8' }
    ],
    [
      { id: 'sur_pro', label: 'sur_pro', value: '9' },
      { id: 'sur_dou', label: 'sur_dou', value: '10' },
      { id: 'galaxy_fold', label: 'galaxy_fold', value: '11' },
      { id: 'samsung_a51_71', label: 'samsung_a51_71', value: '12' }
    ]
  ];

  // Sự kiện click cho #cancelUpdateVmBtn
  $("#cancelUpdateVmBtn").on('click', function (e) {
    const vmName = e.target.value;
    if (vmName) {
      $.ajax({
        url: `${Urls.cancelUpdateVm}?vm_name=${vmName}`,
        type: "GET"
      }).done(function () {
        location.reload();
      });
    }
  });

  // Sự kiện click cho #updateVmBtn
  $("#updateVmBtn").on('click', function (e) {
    const vmName = e.target.value;
    if (vmName) {
      $.ajax({
        url: `${Urls.updateVm}?vm_name=${vmName}`,
        type: "GET"
      }).done(function () {
        location.reload();
      });
    }
  });

  // Sự kiện click cho #cancel-restart-vps-btn
  $("#cancel-restart-vps-btn").on('click', function () {
    bootbox.confirm(Messages.cancelRestartConfirm, function (result) {
      if (result) {
        $.ajax({
          url: Urls.cancelRestartVps,
          type: "GET"
        }).done(function () {
          location.reload();
        });
      }
    });
  });

  // Sự kiện click cho #restart-vps-btn
  $("#restart-vps-btn").on('click', function () {
    function restartVps(isResetProfiles) {
      const url = isResetProfiles ? `${Urls.restartVps}?resetProfiles=true` : Urls.restartVps;
      $.ajax({
        url,
        type: "GET"
      }).done(function () {
        location.reload();
      });
    }

    bootbox.dialog({
      title: Messages.restartVpsTitle,
      message: '<p></p>',
      size: 'large',
      onEscape: true,
      backdrop: true,
      buttons: {
        fum: {
          label: 'Update tool',
          className: 'btn-success',
          callback: function () {
            restartVps(false);
          }
        }
      }
    });
  });

  // Sự kiện click cho #saveDevicesBtn
  $("#saveDevicesBtn").on('click', function () {
    const activeDevices = [];

    groupDevices.forEach(devices => {
      devices.forEach(device => {
        const isChecked = $(`#${device.id}`).is(':checked');
        if (isChecked) {
          activeDevices.push(device.value);
        }
      });
    });

    $.ajax({
      url: Urls.setConfigDevices,
      type: "GET",
      data: { activeDevices },
      contentType: 'application/json'
    }).done(function (data) {
      bootbox.alert(JSON.stringify(data, null, 2), function () {
        location.reload();
      });
    });
  });

})(jQuery); // End of use strict
(function ($) {
  "use strict"; // Start of use strict

  let fileRun;

  $("#copyBtn").on("click", function (e) {
    const area = document.querySelector("#file-run-data");
    area.select();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(fileRun);
    } else {
      document.execCommand("copy");
    }
    document.querySelector("#textCopied").innerHTML = "Đã copy";
  });
  $("#getFileRun").on("click", function (e) {
    let add_server = $("#add_server").val();
    let user_name = $("#user_name").val();
    let vm_name = $("#vm_name").val();
    let setup_key = $("#setup_key").val();

    if (!setup_key || !vm_name || !user_name || !add_server) {
      bootbox.confirm("Vui lòng nhập đủ các thông tin.", function (result) {});
    } else {
      if (!add_server.startsWith("http://")) {
        add_server = "http://" + add_server;
      }

      fileRun = `sudo -s -H sh -c 'cd && wget -O install-vps.sh "${add_server}/file-run/youtube-centos/v2?os=centos&user_name=${user_name}&vm_name=${vm_name}&key=${setup_key}" && chmod +x install-vps.sh && ./install-vps.sh'`;

      document.querySelector("#file-run-data").value = fileRun;
      document.querySelector("#fileRunSec").classList.add("d-block");
    }
  });

  $("#saveConfig").on("click", function (e) {
    let trace_names_ex = [];
    let traceInputs = document.querySelectorAll(".traceInputs");
    let count = 0;
    while (count < traceInputs.length) {
      let inputData = traceInputs.item(count);
      if (inputData.checked) {
        trace_names_ex.push(inputData.id);
      }
      count++;
    }

    let brNames = [];
    let inputs = document.querySelectorAll(".brInputs");
    let count2 = 0;
    while (count2 < inputs.length) {
      let inputData = inputs.item(count2);
      if (inputData.checked) {
        brNames.push(inputData.id);
      }
      count2++;
    }

    let config = {
      suggest_percent: $("#suggest_percent").val(),
      page_watch: $("#page_watch").val(),
      home_percent: $("#home_percent").val(),
      mobile_percent: $("#mobile_percent").val(),
      search_percent: $("#search_percent").val(),
      direct_percent: $("#direct_percent").val(),
      google_percent: $("#google_percent").val(),
      playlist_percent: $("#playlist_percent").val(),
      ads_percent: $("#ads_percent").val(),
      max_total_profiles: $("#max_total_profiles").val(),
      playlists: $("#playlists").val(),
      total_times_next_video: $("#total_times_next_video").val(),

      watching_time_non_ads: $("#watching_time_non_ads").val(),
      watching_time_start_ads: $("#watching_time_start_ads").val(),
      watching_time_end_ads: $("#watching_time_end_ads").val(),
      total_channel_created: $("#total_channel_created").val(),
      change_proxy_for_channel: $(`#change_proxy_for_channel`).is(":checked"),

      sub_percent: $("#sub_percent").val(),
      total_loop_find_ads: $("#total_loop_find_ads").val(),
      max_total_profiles_mobile: $("#max_total_profiles_mobile").val(),

      // brave
      brave_view_news_count: $("#brave_view_news_count").val(),
      brave_replay_ads_rounds: $("#brave_replay_ads_rounds").val(),
      total_rounds_for_change_proxy: $("#total_rounds_for_change_proxy").val(),

      reset_profile_when_reset_system: $(`#reset_profile_when_reset_system`).is(
        ":checked"
      ),
      reset_system_time: $("#reset_system_time").val(),
      reset_profiles_time_interval: $("#reset_profiles_time_interval").val(),
      update_key: $("#update_key").val(),
      show_ui_config: $("#show_ui_config").is(":checked"),
      trace_names_ex: trace_names_ex,
      max_current_profiles: $("#max_current_profiles").val(),
      is_stop: $("#is_stop").is(":checked"),
      browser_name: $("#browser_name").val(),
      ndline_api_key: $("#ndline_api_key").val(),
      codesim_api_key: $("#codesim_api_key").val(),
      browsers: brNames,
      reboot_on_update: $("#reboot_on_update").is(":checked") ? 1 : 0,
      is_clear_browser_data: $("#is_clear_browser_data").is(":checked") ? 1 : 0,
      chothuesimcode_api_key: $("#chothuesimcode_api_key").val(),
      viotp_api_key: $("#viotp_api_key").val(),
      gogetsms_api_key: $("#gogetsms_api_key").val(),
      five_sim_api_key: $("#five_sim_api_key").val(),
      sms_activate_api_key: $("#sms_activate_api_key").val(),
      
      systemParams: $("#systemParams").val(),
      is_setting_brave: $("#is_setting_brave").is(":checked") ? true : "",
      useRobotJS: $("#useRobotJS").is(":checked") ? true : "",
      thuesimgiare_api_key: $("#thuesimgiare_api_key").val(),
      skip_pau_history: $("#skip_pau_history").is(":checked") ? true : "",
      check_proxy: $("#check_proxy").is(":checked") ? true : "",
      check_proxy_for_login: $("#check_proxy_for_login").is(":checked")
        ? true
        : "",
      is_fb: $("#is_fb").is(":checked") ? true : "",
      total_page_created: $("#total_page_created").val(),
      ua_type: $("#ua_type").val(),
      use_adblock: $("#use_adblock").is(":checked") ? true : "",
      uas: $("#uas").val(),
      allow_verify: $("#allow_verify").is(":checked") ? true : "",
      only_run_login: $("#only_run_login").is(":checked") ? true : "",
      scan_check_recovery: $("#scan_check_recovery").is(":checked") ? true : "",
      allow_win_login: $("#allow_win_login").is(":checked") ? true : "",
      change_profile_time: $("#change_profile_time").val(),
      is_use_proxy: $("#is_use_proxy").is(":checked") ? true : "",
      gpt_template: $("#gpt_template").val(),
      gpt_script_template: $("#gpt_script_template").val(),
      gpt_script_template_suffix: $("#gpt_script_template_suffix").val(),
      chat_gpt_api_key: $("#chat_gpt_api_key").val(),
      is_tiktok: $("#is_tiktok").is(":checked") ? true : "",
      not_allow_use_proxy: $("#not_allow_use_proxy").is(":checked") ? true : "",
      client_config_allow_change_fb_page: $(
        "#client_config_allow_change_fb_page"
      ).is(":checked")
        ? true
        : "",
      client_config_allow_change_fb_info: $(
        "#client_config_allow_change_fb_info"
      ).is(":checked")
        ? true
        : "",
      client_config_fb_fisrt_name: $("#client_config_fb_fisrt_name").val(),
      client_config_fb_last_name: $("#client_config_fb_last_name").val(),
      client_config_fb_description: $("#client_config_fb_description").val(),
      client_config_use_recaptcha_for_login: $(
        "#client_config_use_recaptcha_for_login"
      ).is(":checked")
        ? true
        : "",
      client_config_run_cross_sub: $("#client_config_run_cross_sub").is(
        ":checked"
      )
        ? true
        : "",

      client_config_run_x: $("#client_config_run_x").is(":checked") ? true : "",
      client_config_run_facebook: $("#client_config_run_facebook").is(
        ":checked"
      )
        ? true
        : "",
      client_config_run_youtube: $("#client_config_run_youtube").is(":checked")
        ? true
        : "",
      client_config_run_tiktok: $("#client_config_run_tiktok").is(":checked")
        ? true
        : "",
      client_config_run_google_map: $("#client_config_run_google_map").is(
        ":checked"
      )
        ? true
        : "",
      update_browser_brave: $("#update_browser_brave").is(":checked"),
      link_brave: $("#link_brave").val(),
      change_chrome_version: $(
        "#change_chrome_version"
      ).is(":checked")
        ? true
        : "",
    
    };
    bootbox.confirm(
      "Update watch config?<br><pre>" +
        JSON.stringify(config, null, 2) +
        "</pre>",
      function (result) {
        if (result) {
          $.ajax({
            url: "/admin/config/post-update",
            type: "POST",
            data: JSON.stringify(config),
            contentType: "application/json; charset=utf-8",
          }).done(function (data) {
            location.reload();
          });
        }
      }
    );
  });

  // ... (ClipboardJS code from previous response)

  //   const showButton = document.querySelector(".show-button");
  //   const clientKeyInput = document.querySelector("#client_key");

  //   showButton.addEventListener("click", function () {
  //     if (clientKeyInput.type === "password") {
  //       clientKeyInput.type = "text";
  //     } else {
  //       clientKeyInput.type = "password";
  //     }
  //   });

  const showButton = document.querySelector(".show-button");
  const clientKeyInput = document.querySelector("#client_key");
  const copyButton = document.querySelector(".copy-button"); // Lấy tham chiếu đến nút copy

  showButton.addEventListener("click", function () {
    if (clientKeyInput.type === "password") {
      clientKeyInput.type = "text";
      showButton.innerHTML = '<i class="fas fa-eye-slash"></i>'; // Đổi icon thành mắt gạch ngang
      copyButton.style.display = "inline-block"; // Hiển thị nút copy
    } else {
      clientKeyInput.type = "password";
      showButton.innerHTML = '<i class="fas fa-eye"></i>'; // Đổi lại icon mắt
      copyButton.style.display = "none"; // Ẩn nút copy
    }
  });

  $("#resetInstalledMachines").on("click", function (e) {
    bootbox.confirm(
      "Bạn có chắc chắn muốn reset số máy đã cài về 0?",
      function (result) {
        if (result) {
          $.ajax({
            url: "/admin/config/reset-brave-installations",
            type: "POST",
            contentType: "application/json; charset=utf-8",
          }).done(function (data) {
            if (data.success) {
              $("#installed_machines").val(0);
              bootbox.alert("Đã reset số máy đã cài về 0");
            } else {
              bootbox.alert("Có lỗi xảy ra khi reset số máy đã cài");
            }
          });
        }
      }
    );
  });
})(jQuery); // End of use strict

$(document).ready(function () {
  updateBraveInstallations();
  // ... các đoạn mã khác ...

  function updateBraveInstallations() {
    $.ajax({
      url: "/admin/config/brave-installations",
      type: "GET",
      dataType: "json",
      success: function (data) {
        if (data.success) {
          $("#installed_machines").val(data.totalInstallations);
        } else {
          console.error("Failed to fetch Brave installations");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error fetching Brave installations:", error);
      },
    });
  }
});

const SCRIPT_CODES = {
    GET_OTP: 'get_otp',
    ADD_RECOVERY_MAIL: 'add_recovery_mail',
    SCAN_GROUP: 'scan_group',
    ADD_VIDEO_PLAYLIST: 'add_video_playlist',
    create_2fa: 'create_2fa',
    step_2_authentication: 'step_2_authentication',
    create_youtube_key: 'create_youtube_key',
    CREATE_BACKUP_CODES: 'create_backup_codes',
    DELETE_BACKUP_CODES: 'delete_backup_codes',
};

const WATCH_VIDEO_SCRIPTS = ['watch_video', 'watch_video_2', 'watch_video_3'];

const DECREMENT_CODES = [SCRIPT_CODES.create_2fa, SCRIPT_CODES.step_2_authentication, SCRIPT_CODES.create_youtube_key];

module.exports = { SCRIPT_CODES, WATCH_VIDEO_SCRIPTS, DECREMENT_CODES };

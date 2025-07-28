// Các định nghĩa script ở đây
// Các script mặc định sẽ được tạo khi khởi tạo hệ thống
const defaultScriptsData = [
    {
        name: 'Link trực tiếp',
        code: 'direct_link',
        example_data: `{
      "link": ""
    }`, // { code: '', name: '', type: 'text' }
        data_inputs: [{ code: 'link', name: 'Đường dẫn', type: 'text' }],
        script_type: ['system', 'youtube', 'tiktok', 'facebook', 'x', 'map'],
    },
    {
        name: 'Google Search',
        code: 'search',
        example_data: `{
      "search_keywords": "",
      "site_url": ""
    }`,
        script_type: ['youtube'],
    },
    {
        name: 'Add video playlist',
        code: 'add_video_playlist',
        example_data: `{
      "playlist_name": "",
      "suggest_channel": "",
      "playlist_url": "",
      "total_added_from_search": "",
      "total_added_from_channel": ""
    }`,
        script_type: ['youtube'],
    },

    {
        name: 'Create playlist',
        code: 'create_playlist',
        example_data: `{
      "playlist_name": "",
      "suggest_channel": "",
      "pll_description": "",
      "total_added_from_search": "",
      "total_added_from_channel": ""
    }`,
        script_type: ['youtube'],
    },
    {
        name: 'Youtube Sub',
        code: 'youtube_sub',
        example_data: `{ 
      "channel_id": "",
      "comment_percent": "",
      "like_percent": "",
      "sub_from_video_percent": "",
      "watch_time": "",
      "sub_from_search_video": ""
    }`,
        data_inputs: [{ code: 'channel_id', name: 'Channel ID', type: 'text' }],
        script_type: ['youtube'],
    },
    {
        name: 'Google Map',
        code: 'map',
        example_data: `{
      "seach_data": "",
      "comment": "",
      "5_star_percent": "70",
      "4_star_percent": "30",
      "3_star_percent": "0"
    }`,
        script_type: ['google_map'],
    },
    {
        name: 'Đổi tên google sang tiếng Việt',
        code: 'changing_to_vietnamese_name',
        example_data: `{}`,
        script_type: ['google_map'],
    },
    {
        name: 'Watch Youtube Playlist',
        code: 'watch',
        example_data: `{
      "playlist_url": "",
      "total_times_next_video": "",
      "watching_time_non_ads": "",
      "watching_time_ads_random": "",
      "watching_time_non_ads_random": "",
      "total_next_max": "",
      "percent_next_not_ads": "",
      "percent_next_ads": ""
    }`,
        data_inputs: [{ code: 'playlist_url', name: 'Playlist ID', type: 'text' }],
        script_type: ['youtube'],
    },
    {
        name: 'Like Youtube',
        code: 'like_youtube',
        example_data: `{
      "channel_id": "",
      "comment_percent": "",
      "like_percent": "",
      "sub_from_video_percent": "",
      "watch_time": "",
      "sub_from_search_video": ""
    }`,
        script_type: ['youtube'],
    },
    {
        name: 'Comment Youtube',
        code: 'comment_youtube',
        example_data: `{
      "channel_id": "",
      "number_of_videos": "",
      "video_ids": "",
      "playlist_ids": "",
      "commented_count_max": "",
      "comment_change_user": "",
      "is_rename_channel": "",
      "comment": ""
    }`,
        data_inputs: [{ code: 'channel_id', name: 'Link kênh', type: 'text' }],
        script_type: ['youtube'],
    },
    {
        name: 'Watch Youtube Video',
        code: 'watch_video',
        example_data: `{
      "keyword": "",
      "playlist_url": "",
      "watch_time": "",
      "search_percent": "",
      "direct_percent": "",
      "suggest_percent": "",
      "page_percent": "",
      "like_percent": "",
      "comment_percent": "",
      "suggest_channel_ids": ""
    }`,
        script_type: ['youtube'],
    },
    {
        name: 'Get Youtube Key',
        code: 'get_youtube_key',
        example_data: `{}`,
        script_type: ['youtube'],
    },
    {
        name: 'Channel Appeal',
        code: 'channel_appeal',
        example_data: `{}`,
        script_type: ['youtube'],
    },
    {
        name: 'Tạo mã 2FA',
        code: 'create_2fa',
        example_data: `{"create_2fa": "true"}`,
        script_type: ['youtube'],
    },
    {
        name: 'thay đổi mã 2FA',
        code: 'change_2fa',
        example_data: `{"change_2fa": "true"}`,
        script_type: ['youtube'],
    },
    {
        name: 'Create Youtube Key',
        code: 'create_youtube_key',
        example_data: `{}`,
        script_type: ['youtube'],
    },
    {
        name: 'xác thực bước 2 kênh Youtube',
        code: 'step_2_authentication',
        example_data: `{"step_2_authentication": "true"}`,
        script_type: ['youtube'],
    },
    {
        name: 'Comment bài viết FB',
        code: 'comment_fb_post',
        example_data: `{
      "post_link": "",
      "comment": "",
      "image_name": "",
      "total_image": ""
    }`,
        data_inputs: [
            { code: 'post_link', name: 'Link', type: 'text' },
            { code: 'is_random_image', name: 'Kèm ảnh', type: 'boolean' },
            {
                code: 'min_total_like',
                name: 'Lượt like tối thiểu của bài viết cần comment',
                type: 'number',
            },
        ],
        script_type: ['facebook'],
    },
    {
        name: 'Like FB Page',
        code: 'like_fb_page',
        example_data: `{
      "page_link": ""
    }`,
        data_inputs: [{ code: 'page_link', name: 'Link', type: 'text' }],
        script_type: ['facebook'],
    },
    {
        name: 'Scroll FB Home',
        code: 'view_fb_home',
        example_data: `{
      "scroll_time": "30000"
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'Tương tác fb profile',
        code: 'spam_fb_account',
        example_data: `{
      "fb_id": "",
      "comment": "",
      "fb_topic_code": ""
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'Like bài viết FB',
        code: 'like_fb_post',
        example_data: `{
      "post_link": ""
    }`,
        data_inputs: [{ code: 'post_link', name: 'Link', type: 'text' }],
        script_type: ['facebook'],
    },
    {
        name: 'FB Đăng story',
        code: 'fb_create_story',
        example_data: `{
      "content": "",
      "image_name": ""
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'FB Bình luận vào group',
        code: 'fb_comment_group',
        example_data: `{
      "comment": "",
      "group_link": "",
      "fb_topic_code": "",
      "random_post": "",
      "image_name": ""
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'Folow FB',
        code: 'folow_fb',
        example_data: `{
      "link": ""
    }`,
        data_inputs: [{ code: 'link', name: 'Link', type: 'text' }],
        script_type: ['facebook'],
    },
    {
        name: 'Đăng bài FB',
        code: 'post_fb',
        example_data: `{
      "group_link": "",
      "image_name": "",
      "total_image": "",
      "marketing_link": "",
      "fb_topic_code": ""
    }`,
        data_inputs: [
            { code: 'link', name: 'Link', type: 'text' },
            { code: 'total_image', name: 'Số lượng ảnh kèm theo', type: 'number' },
            {
                code: 'min_total_member',
                name: 'Số thành viên tối thiểu',
                type: 'number',
            },
            {
                code: 'min_total_post_a_day',
                name: 'Lượt bài đăng tối thiểu / ngày',
                type: 'number',
            },
        ],
        script_type: ['facebook'],
    },
    {
        name: 'Quét group FB',
        code: 'scan_group',
        example_data: `{
      "keyword": "",
      "fb_topic_code": ""
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'Quét page FB',
        code: 'scan_page',
        example_data: `{
      "keyword": "",
      "fb_topic_code": ""
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'Xem video FB',
        code: 'view_fb_video',
        example_data: `{
      "link": "",
      "watch_time": ""
    }`,
        data_inputs: [
            { code: 'link', name: 'Link', type: 'text' },
            { code: 'watch_time', name: 'Thời gian xem', type: 'text' },
        ],
        script_type: ['facebook'],
    },
    {
        name: 'Tạo page FB',
        code: 'create_fb_page',
        example_data: `{}`,
        script_type: ['facebook'],
    },
    {
        name: 'FB Thêm TV cho group',
        code: 'fb_add_member',
        example_data: `{
      "link": "",
      "total": ""
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'Quét acc FB',
        code: 'scan_profile',
        example_data: `{
      "group_link": "",
      "fb_topic_code": ""
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'Tương tác FB',
        code: 'fb_feed',
        example_data: `{
      "time": ""
    }`,
        script_type: ['facebook'],
    },
    {
        name: 'FB Add friend',
        code: 'fb_add_friend',
        example_data: `{
      "link": "",
      "count": "",
      "fb_topic_code": "",
      "get_from_profile": ""
    }`,
        data_inputs: [{ code: 'link', name: 'Link', type: 'text' }],
        script_type: ['facebook'],
    },
    {
        name: 'Trạng thái lấy OTP',
        code: 'get_otp',
        example_data: `{}`,
        script_type: ['system'],
    },
    {
        name: 'Thêm mail khôi phục',
        code: 'add_recovery_mail',
        example_data: `{}`,
        script_type: ['system', 'youtube'],
    },
    {
        name: 'Check mail khôi phục',
        code: 'check_recovery',
        example_data: `{}`,
        script_type: ['system'],
    },
    {
        name: 'Tiktok comment',
        code: 'tiktok_comment',
        example_data: `{
      "link": "",
      "comment": ""
    }`,
        data_inputs: [{ code: 'link', name: 'Link video', type: 'text' }],
        script_type: ['tiktok'],
    },
    {
        name: 'Tiktok tương tác',
        code: 'tiktok_feed',
        example_data: `{
      "time": ""
    }`,
        script_type: ['tiktok'],
    },
    {
        name: 'Youtube tương tác',
        code: 'youtube_feed',
        example_data: `{
      "time": ""
    }`,
        script_type: ['youtube'],
    },
    {
        name: 'Tạo user youtube',
        code: 'reg_user_youtube',
        example_data: `{}`,
        script_type: ['youtube'],
    },
    {
        name: 'Tạo channel youtube',
        code: 'create_channel_youtube',
        example_data: `{}`,
        script_type: ['youtube'],
    },

    // X (Twitter)
    {
        name: 'Follow X',
        code: 'follow_x',
        example_data: `{
      "link": ""
    }`,
        data_inputs: [{ code: 'link', name: 'Link', type: 'text' }],
        script_type: ['x'],
    },
    {
        name: 'Like bài viết X',
        code: 'like_x_post',
        example_data: `{
      "post_link": ""
    }`,
        data_inputs: [{ code: 'post_link', name: 'Link', type: 'text' }],
        script_type: ['x'],
    },
    {
        name: 'X comment',
        code: 'x_comment',
        example_data: `{
      "link": "",
      "comment": ""
    }`,
        data_inputs: [{ code: 'link', name: 'Link', type: 'text' }],
        script_type: ['x'],
    },
    {
        name: 'End Script',
        code: 'end_script',
        example_data: `{}`,
        script_type: ['system', 'youtube', 'tiktok', 'facebook', 'x', 'map'],
    },

    {
        name: 'Tạo Backup Codes',
        code: 'create_backup_codes',
        example_data: `{}`,
        script_type: ['youtube'],
    },
    {
        name: 'Delete Backup Codes',
        code: 'delete_backup_codes',
        example_data: `{}`,
        script_type: ['youtube'],
    },
];

module.exports = defaultScriptsData;

let a = [
  {
    "status": true,
    "script_code": "youtube_sub",
    "script_name": "Youtube Sub",
    "name": "Cơ bản",
    "value": 1050,
    "unit": "Lượt",
    "price": 200000,
    "vip_price": 155000,
    "old_price": 300000,
    "description": "- 1050 Người Đăng Ký Thật <br> - Quà tặng: <br>  &nbsp;&nbsp;+ 3000 Lượt Xem<br>  &nbsp;&nbsp;+ 500 Lượt Thích <br>  &nbsp;&nbsp;+ 100 Comment <br> - Thời Gian Hoàn Thành 2-10 Ngày <br> - Bảo Hành Tụt 3 Tháng",
    "after_description": "Thời Gian Hoàn Thành 2-10 Ngày và Bảo Hành Tụt 3 Tháng",
    "type": "run_service",
    "attributes": [
      {
        "label": "Channel ID",
        "code": "channel_id",
        "description": "vd: channel/abc123 hoặc c/abc123 hoặc user/abc123",
        "type": "text",
        "require": true
      }
    ]
  },
  {
    "status": true,
    "script_code": "watch_video",
    "script_name": "Youtube - 4k giờ xem",
    "name": "4k",
    "value": 7000,
    "unit": "Lượt",
    "price": 299000,
    "vip_price": 240000,
    "old_price": 0,
    "description": "- Chạy 4k giờ xem cho kênh. <br> - Lượt like ngẫu nhiên <br>  - Lượt sub ngẫu nhiên. <br> - Lượt bình luận ngẫu nhiên <br> - Thời gian hoàn thành từ 7 đến 10 ngày <br> - Giá 240k cho thành viên đối tác. <br> - Bảo hành 3 tháng.",
    "after_description": "Thời gian hoàn thành từ 7 đến 10 ngày. Vui lòng đợi",
    "type": "run_service",
    "attributes": [
      {
        "label": "Video ID (Vui lòng nhập đúng theo mẫu để tránh phát sinh lỗi)",
        "code": "playlist_url",
        "description": "vd: QqsrY7SyWyU hoặc https://www.youtube.com/watch?v=QqsrY7SyWyU",
        "type": "text",
        "require": true
      }
    ]
  },
  {
    "status": true,
    "script_code": "map",
    "script_name": "Đánh giá MAP",
    "name": "Cơ bản",
    "value": 100,
    "unit": "Lượt",
    "price": 1200000,
    "old_price": 0,
    "description": "- 100 lượt đánh giá <br> - Tài khoản guide cấp 5 ><br> - 300 lượt truy cập website (nếu có) <br> - Thời Gian Hoàn Thành 2-3 Ngày <br> - Bảo hành tụt vĩnh viễn",
    "after_description": "Thời Gian Hoàn Thành 2-3 Ngày và Bảo hành tụt vĩnh viễn",
    "type": "run_service",
    "attributes": [
      {
        "label": "Địa chỉ MAP",
        "code": "map_id",
        "description": "vd: /cty-tnhh-A",
        "type": "text",
        "require": true
      }
    ]
  },
  {
    "status": true,
    "script_code": "map",
    "script_name": "Đánh giá MAP",
    "name": "Cao cấp",
    "value": 500,
    "unit": "Lượt",
    "price": 5000000,
    "old_price": 0,
    "description": "- 500 lượt đánh giá <br> - Tài khoản guide cấp 5 ><br> - 2000 lượt truy cập website (nếu có) <br> - Thời Gian Hoàn Thành 7-10 Ngày <br> - Bảo hành tụt vĩnh viễn",
    "after_description": "Thời Gian Hoàn Thành 7-10 Ngày và Bảo hành tụt vĩnh viễn",
    "type": "run_service",
    "attributes": [
      {
        "label": "Địa chỉ MAP",
        "code": "map_id",
        "description": "vd: /cty-tnhh-A",
        "type": "text",
        "require": true
      }
    ]
  },
]
let multiple = []

let custom = [
  {
    "status": true,
    "script_code": "verify_mail",
    "script_name": "Verify Phone Gmail",
    "name": "Tùy chỉnh",
    "value": "",
    "unit": "",
    "price": 1111111111,
    "old_price": 0,
    "description": "- Verify Phone Gmail. <br> - Từ 1-500 mail giá 3k/1 <br> - Từ 500 mail giá 2k5/1. <br> - Từ 1000 mail giá 2k/1. <br> - Thời gian hoàn thành từ 1 - 2 ngày.",
    "after_description": "",
    "type": "run_service",
    "attributes": [],
    "is_custom": true,
    "item_name": "Mail",
    "example_item_data": "abc@gmail.com,passabc,recoveryabc@gmail.com",
    "price_levels": [
      {
        "total": 1000,
        "price": 2000
      },
      {
        "total": 500,
        "price": 2500
      },
      {
        "total": 0,
        "price": 3000
      }
    ]
  },
  {
    "status": true,
    "script_code": "youtube_sub",
    "script_name": "Youtube Sub",
    "name": "Tùy chỉnh",
    "value": 1050,
    "unit": "Lượt",
    "price": 1111111111,
    "old_price": 0,
    "description": "- Gói tùy chỉnh sô lượng kênh. <br> - Thời gian hoàn thành từ 5 - 10 ngày.  <br> - Bảo hành tụt 3 tháng .",
    "after_description": "",
    "type": "run_service",
    "attributes": [],
    "is_custom": true,
    "item_name": "Kênh",
    "example_item_data": "chanelID",
    "price_levels": [
      {
        "total": 0,
        "price": 200000
      }
    ]
  },
  {
    "status": true,
    "script_code": "youtube_sub",
    "script_name": "Youtube Sub",
    "name": "Tùy chỉnh Sub",
    "value": 0,
    "unit": "Sub",
    "price": 200,
    "vip_price": 155, 
    "old_price": 0,
    "description": "- Gói tùy chỉnh sô lượng sub. <br> - Tối thiểu 100 Sub. <br> - 300đ /sub <br> - Bảo hành tụt 3 tháng .",
    "after_description": "",
    "type": "run_service",
    "attributes": [],
    "is_custom": true,
    "is_custom_value": true,
    "min": 100,
    "attributes": [
      {
        "label": "Channel ID",
        "code": "channel_id",
        "description": "vd: channel/abc123 hoặc c/abc123 hoặc user/abc123",
        "type": "text",
        "require": true
      }
    ]
  },
  {
    "status": true,
    "script_code": "watch_video",
    "script_name": "4k giờ xem",
    "name": "Nhiều kênh",
    "value": 7000,
    "unit": "Lượt",
    "price": 1111111111,
    "old_price": 0,
    "description": "- Gói tùy chỉnh số lượng kênh cần chạy. <br> - Từ 1-9 kênh giá 299k/1 <br> - Từ 10 kênh giá 280k/1. <br> - Từ 30 kênh giá 260k/1. <br> - Thời gian hoàn thành từ 5 - 10 ngày.  <br> - Bảo hành 3 tháng .",
    "after_description": "",
    "type": "run_service",
    "attributes": [],
    "is_custom": true,
    "price_levels": [
      {
        "total": 30,
        "price": 260000
      },
      {
        "total": 10,
        "price": 280000
      },
      {
        "total": 0,
        "price": 299000
      }
    ]
  }
]

let gift = [
  {
    "status": true,
    "script_code": "youtube_sub",
    "script_name": "Youtube Sub",
    "name": "Quà tặng",
    "value": 30,
    "unit": "Lượt",
    "price": 0,
    "old_price": 0,
    "description": "",
    "after_description": "",
    "type": "run_service",
    "attributes": [
      {
        "label": "Channel ID",
        "code": "channel_id",
        "description": "vd: channel/abc123 hoặc c/abc123 hoặc user/abc123",
        "type": "text",
        "require": true
      }
    ],
    "is_gift": true
  }
]
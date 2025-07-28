const getVideosAndViews = (str) => {
  // Kiểm tra nếu str là null hoặc undefined
  if (!str) {
    console.log("Chuỗi đầu vào không hợp lệ.");
    return { videos: 0, views: 0 };
  }

  // Biểu thức chính quy để lấy số video và số views
  const regexVideos = /(\d+) videos/;
  const regexViews = /(\d[\d\.]*) views/;

  const matchVideos = str.match(regexVideos);
  const matchViews = str.match(regexViews);

  let videos = 0;
  let views = 0;

  if (matchVideos) {
    videos = parseInt(matchVideos[1], 10);
  } else {
    console.log("Không tìm thấy số video trong chuỗi.");
  }

  if (matchViews) {
    views = parseInt(matchViews[1].replace(/\./g, ""), 10);
  } else {
    console.log("Không tìm thấy số view trong chuỗi.");
  }

  console.log(`Số video là: ${videos}, Số view là: ${views}`);
  return { videos, views };
};

module.exports = getVideosAndViews;

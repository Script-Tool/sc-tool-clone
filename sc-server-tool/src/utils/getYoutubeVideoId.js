function getYoutubeVideoId(input) {
    // Nếu input chỉ là ID (kiểm tra độ dài và không chứa ký tự đặc biệt)
    if (/^[\w-]{11}$/.test(input)) {
        return input;
    }
    
    // Xử lý trường hợp là URL
    try {
        const urlObj = new URL(input);
        
        // Nếu là youtube.com
        if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            const searchParams = new URLSearchParams(urlObj.search);
            return searchParams.get('v');
        }
        
        // Nếu là youtu.be
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
    } catch (error) {
        return null;
    }
    
    return null;
}


// Cách sử dụng
// const url = 'https://www.youtube.com/watch?v=JzFZVmsZYOA';
// const videoId = getYoutubeVideoId(url);
// console.log(videoId); // JzFZVmsZYOA


module.exports = getYoutubeVideoId;
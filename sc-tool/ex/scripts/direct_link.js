
async function directLink(action) {
  try {
    // let targetUrl = window.location.toString();

    // const loadPromise = new Promise((resolve, reject) => {
    //   const handleLoad = () => {
    //     window.removeEventListener('load', handleLoad); // Xóa bỏ sự kiện load
    //     resolve(); // Giải quyết Promise khi sự kiện load xảy ra
    //   };

    //   window.addEventListener('load', handleLoad); // Thêm sự kiện load vào window

    //   // Nếu URL đã được tải xong trước khi thêm sự kiện load
    //   if (window.location.href === targetUrl) {
    //     resolve(); // Giải quyết Promise ngay lập tức
    //   }
    // });

    // // Điều hướng đến đường dẫn URL mục tiêu
    // window.location.href = targetUrl;

    // // Đợi cho đến khi URL được tải xong
    // await loadPromise;

    await reportScript(action)
  } catch (error) {
    console.log(error);
  }
}

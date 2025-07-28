const { autoSplitStory } = require("./splitStory");

/**
 * Chia nội dung thành các phần, mỗi phần có tối đa số ký tự được chỉ định
 * @param {string} content - Nội dung cần chia
 * @param {number} maxChunkSize - Số ký tự tối đa cho mỗi phần (mặc định: 1500)
 * @returns {string[]} Mảng các phần đã chia
 */
function splitContent(content, maxChunkSize = 1500) {
  if (!content) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < content.length) {
    // Tính vị trí kết thúc dựa trên kích thước tối đa
    let end = Math.min(start + maxChunkSize, content.length);

    // Tìm điểm ngắt tự nhiên nếu chưa đến cuối nội dung
    if (end < content.length) {
      // Tìm dấu ngắt câu gần vị trí kết thúc nhất
      let breakPoint = -1;

      // Ưu tiên các dấu ngắt câu trong tiếng Trung
      breakPoint = content.lastIndexOf("。", end);
      if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = content.lastIndexOf("!", end);
      }
      if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = content.lastIndexOf("?", end);
      }

      // Sau đó tìm các dấu ngắt câu tiếng Anh
      if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = content.lastIndexOf(".", end);
      }
      if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = content.lastIndexOf("!", end);
      }
      if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = content.lastIndexOf("?", end);
      }

      // Cuối cùng là dấu cách
      if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = content.lastIndexOf(" ", end);
      }

      // Nếu tìm thấy điểm ngắt phù hợp
      if (breakPoint > start) {
        end = breakPoint + 1;
      }
    }

    // Thêm phần vào mảng kết quả
    chunks.push(content.substring(start, end));
    start = end;
  }

  return chunks;
}

function handleContent(action, numberContent) {
  if (!action?.contentList || action.contentList.length === 0) {
    const contentList = autoSplitStory(action.content || "");
    if (contentList.length >= 20) {
      contentList = contentList.slice(0, 19);
    }
    action.contentList = contentList;
    action.contentLength = action.contentList.length;
    action.thumbnailsLength = action?.thumbnailsText?.length;
  }
  if (!action?.currentContent) {
    action.currentContent = 0;
  }
}

module.exports = { handleContent, splitContent };

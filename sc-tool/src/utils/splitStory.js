/**
 * Hàm chia một câu truyện thành các đoạn gần bằng nhau mà không cắt đứt câu
 * @param {string} story - Nội dung câu truyện đầy đủ
 * @param {number} numSegments - Số đoạn cần chia
 * @returns {string[]} Mảng chứa các đoạn đã được chia
 */
function splitStoryIntoSegments(story, numSegments) {
  // Kiểm tra đầu vào
  if (!story || typeof story !== "string") {
    throw new Error("Vui lòng cung cấp nội dung câu truyện");
  }

  if (!numSegments || numSegments <= 0) {
    throw new Error("Số đoạn phải lớn hơn 0");
  }

  // Xử lý trường hợp chỉ có 1 đoạn
  if (numSegments === 1) {
    return [story];
  }

  // Tìm tất cả các câu trong truyện
  // Xét các dấu câu phổ biến trong nhiều ngôn ngữ: dấu chấm, dấu chấm hỏi, dấu chấm than
  const sentenceRegex = /[^.!?。？！]+[.!?。？！]+/g;
  let sentences = [];
  let match;

  // Lấy ra tất cả các câu
  while ((match = sentenceRegex.exec(story)) !== null) {
    sentences.push(match[0]);
  }

  // Nếu regex không bắt được câu nào (ví dụ: không có dấu câu), coi toàn bộ là một câu
  if (sentences.length === 0) {
    sentences = [story];
  }

  // Nếu số câu ít hơn số đoạn yêu cầu, điều chỉnh số đoạn
  const adjustedNumSegments = Math.min(numSegments, sentences.length);

  // Tính số câu trung bình trên mỗi đoạn
  const sentencesPerSegment = Math.ceil(sentences.length / adjustedNumSegments);

  // Chia các câu thành các đoạn
  const segments = [];

  for (let i = 0; i < adjustedNumSegments; i++) {
    const startIndex = i * sentencesPerSegment;
    const endIndex = Math.min((i + 1) * sentencesPerSegment, sentences.length);

    if (startIndex < sentences.length) {
      segments.push(sentences.slice(startIndex, endIndex).join(""));
    }
  }

  return segments;
}

/**
 * Phiên bản nâng cao: Chia truyện dựa trên số từ chứ không phải số câu
 * @param {string} story - Nội dung câu truyện đầy đủ
 * @param {number} numSegments - Số đoạn cần chia
 * @returns {string[]} Mảng chứa các đoạn đã được chia
 */
function splitStoryByWords(story, numSegments) {
  // Kiểm tra đầu vào
  if (!story || typeof story !== "string") {
    throw new Error("Vui lòng cung cấp nội dung câu truyện");
  }

  if (!numSegments || numSegments <= 0) {
    throw new Error("Số đoạn phải lớn hơn 0");
  }

  // Tìm tất cả các câu trong truyện
  const sentenceRegex = /[^.!?。？！]+[.!?。？！]+/g;
  let sentences = [];
  let match;

  while ((match = sentenceRegex.exec(story)) !== null) {
    sentences.push(match[0]);
  }

  // Nếu regex không bắt được câu nào, thử chia theo dấu xuống dòng
  if (sentences.length === 0) {
    sentences = story.split(/\n+/).filter((s) => s.trim() !== "");

    // Nếu vẫn không có đoạn nào, coi toàn bộ là một câu
    if (sentences.length === 0) {
      sentences = [story];
    }
  }

  // Tính tổng số từ
  const words = story.split(/\s+/).filter((w) => w.trim() !== "");
  const totalWords = words.length;

  // Tính số từ lý tưởng cho mỗi đoạn
  const targetWordsPerSegment = Math.ceil(totalWords / numSegments);

  const segments = [];
  let currentSegment = "";
  let currentSegmentWordCount = 0;

  // Duyệt qua từng câu và phân bổ vào các đoạn dựa trên số từ
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceWordCount = sentence
      .split(/\s+/)
      .filter((w) => w.trim() !== "").length;

    // Nếu thêm câu hiện tại vào đoạn hiện tại không làm vượt quá số từ mục tiêu quá nhiều
    // hoặc nếu đoạn hiện tại còn trống, thêm câu vào đoạn
    if (
      currentSegment === "" ||
      currentSegmentWordCount + sentenceWordCount <=
        targetWordsPerSegment * 1.5 ||
      segments.length === numSegments - 1
    ) {
      currentSegment += sentence;
      currentSegmentWordCount += sentenceWordCount;
    } else {
      // Nếu thêm vào sẽ làm vượt quá, tạo đoạn mới
      segments.push(currentSegment);
      currentSegment = sentence;
      currentSegmentWordCount = sentenceWordCount;
    }
  }

  // Thêm đoạn cuối cùng nếu còn
  if (currentSegment !== "") {
    segments.push(currentSegment);
  }

  // Chắc chắn rằng số đoạn không vượt quá số đoạn yêu cầu
  while (segments.length > numSegments && segments.length > 1) {
    // Nối đoạn ngắn nhất với đoạn tiếp theo
    let minIndex = 0;
    let minLength = segments[0].length;

    for (let i = 1; i < segments.length; i++) {
      if (segments[i].length < minLength) {
        minLength = segments[i].length;
        minIndex = i;
      }
    }

    // Nối với đoạn liền kề (ưu tiên đoạn trước nếu có)
    if (minIndex > 0) {
      segments[minIndex - 1] += segments[minIndex];
      segments.splice(minIndex, 1);
    } else if (segments.length > 1) {
      segments[0] += segments[1];
      segments.splice(1, 1);
    }
  }

  return segments;
}

/**
 * Hàm chính: Tự động xác định số đoạn dựa trên độ dài chuỗi
 * @param {string} story - Nội dung câu truyện
 * @param {number} [customNumSegments] - Số đoạn do người dùng chỉ định (không bắt buộc)
 * @returns {string[]} - Mảng chứa các đoạn đã được chia
 */
function autoSplitStory(story, customNumSegments = null) {
  // Nếu người dùng chỉ định số đoạn, sử dụng giá trị đó
  if (customNumSegments) {
    return splitStoryByWords(story, customNumSegments);
  }

  // Tự động xác định số đoạn dựa trên độ dài chuỗi (số ký tự)
  // Sử dụng công thức: storyText.length / 1000
  const numSegments = Math.max(1, Math.ceil(story?.length / 700));
  return splitStoryByWords(story, numSegments);
}

// Xuất các hàm để có thể sử dụng
module.exports = {
  splitStoryIntoSegments,
  splitStoryByWords,
  autoSplitStory,
};

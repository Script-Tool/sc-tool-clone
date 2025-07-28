/**
 * Hàm chia một câu truyện thành các đoạn gần bằng nhau mà không cắt đứt câu
 * @param {string} story - Nội dung câu truyện đầy đủ
 * @param {number} numSegments - Số đoạn cần chia
 * @returns {string[]} Mảng chứa các đoạn đã được chia
 */

const MIN = 800;
const MAX = 1000;
function splitStoryIntoSegments(story, numSegments) {
    // Kiểm tra đầu vào
    if (!story || typeof story !== 'string') {
      throw new Error('Vui lòng cung cấp nội dung câu truyện');
    }
    
    if (!numSegments || numSegments <= 0) {
      throw new Error('Số đoạn phải lớn hơn 0');
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
        segments.push(sentences.slice(startIndex, endIndex).join(''));
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
    if (!story || typeof story !== 'string') {
      throw new Error('Vui lòng cung cấp nội dung câu truyện');
    }
    
    if (!numSegments || numSegments <= 0) {
      throw new Error('Số đoạn phải lớn hơn 0');
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
      sentences = story.split(/\n+/).filter(s => s.trim() !== '');
      
      // Nếu vẫn không có đoạn nào, coi toàn bộ là một câu
      if (sentences.length === 0) {
        sentences = [story];
      }
    }
    
    // Tính tổng số từ
    const words = story.split(/\s+/).filter(w => w.trim() !== '');
    const totalWords = words.length;
    
    // Tính số từ lý tưởng cho mỗi đoạn
    const targetWordsPerSegment = Math.ceil(totalWords / numSegments);
    
    const segments = [];
    let currentSegment = '';
    let currentSegmentWordCount = 0;
    
    // Duyệt qua từng câu và phân bổ vào các đoạn dựa trên số từ
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceWordCount = sentence.split(/\s+/).filter(w => w.trim() !== '').length;
      
      // Nếu thêm câu hiện tại vào đoạn hiện tại không làm vượt quá số từ mục tiêu quá nhiều
      // hoặc nếu đoạn hiện tại còn trống, thêm câu vào đoạn
      if (currentSegment === '' || 
          currentSegmentWordCount + sentenceWordCount <= targetWordsPerSegment * 1.5 ||
          segments.length === numSegments - 1) {
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
    if (currentSegment !== '') {
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

    // Sử dụng hàm splitStoryByCharLength để đảm bảo mỗi đoạn có độ dài từ MIN-MAX ký tự

    const segments = splitStoryByCharLength(story);

    return segments;
  }

  /**
   * Chia câu truyện thành các đoạn có độ dài từ MIN đến MAX ký tự
   * Đảm bảo không có từ nào bị chia cắt giữa hai đoạn
   * @param {string} story - Nội dung câu truyện đầy đủ
   * @returns {string[]} - Mảng chứa các đoạn đã được chia
   */
  function splitStoryByCharLength(story) {
    // Kiểm tra đầu vào
    if (!story || typeof story !== 'string') {
      throw new Error('Vui lòng cung cấp nội dung câu truyện');
    }

    // Nếu độ dài chuỗi ít hơn MIN, trả về nguyên chuỗi
    if (story.length <= MIN) {
      return [story];
    }

    // Hàm hỗ trợ để chia một câu dài thành các phần nhỏ hơn
    function splitLongSentence(sentence) {
      const parts = [];

      // Thử chia theo khoảng trắng trước
      const words = sentence.split(/\s+/);

      // Nếu không có khoảng trắng hoặc chỉ có một từ dài
      if (words.length <= 1) {
        // Chia thành các phần có độ dài tối đa MAX ký tự
        let remaining = sentence;
        while (remaining.length > MAX) {
          parts.push(remaining.substring(0, MAX));
          remaining = remaining.substring(MAX);
        }
        if (remaining.length > 0) {
          parts.push(remaining);
        }
        return parts;
      }

      let currentPart = '';

      for (const word of words) {
        // Nếu từ đơn lẻ quá dài (hiếm gặp)
        if (word.length > MAX) {
          // Lưu phần hiện tại nếu có
          if (currentPart) {
            parts.push(currentPart);
            currentPart = '';
          }

          // Chia từ dài thành các phần nhỏ hơn
          let remaining = word;
          while (remaining.length > MAX) {
            parts.push(remaining.substring(0, MAX));
            remaining = remaining.substring(MAX);
          }
          if (remaining.length > 0) {
            currentPart = remaining;
          }
          continue;
        }

        // Kiểm tra nếu thêm từ mới sẽ vượt quá giới hạn
        if (currentPart && currentPart.length + word.length + 1 > MAX) {
          parts.push(currentPart);
          currentPart = word;
        } else {
          currentPart += (currentPart ? ' ' : '') + word;
        }
      }

      // Thêm phần cuối cùng nếu còn
      if (currentPart) {
        parts.push(currentPart);
      }

      return parts;
    }

    // Tìm tất cả các câu trong truyện
    const sentenceRegex = /[^.!?。？！]+[.!?。？！]+/g;
    let sentences = [];
    let match;

    while ((match = sentenceRegex.exec(story)) !== null) {
      // Kiểm tra nếu câu quá dài (> MAX ký tự), chia nhỏ câu đó
      if (match[0].length > MAX) {
        // Chia câu dài thành các phần nhỏ hơn theo khoảng trắng
        const parts = splitLongSentence(match[0]);
        sentences = sentences.concat(parts);
      } else {
        sentences.push(match[0]);
      }
    }

    // Nếu regex không bắt được câu nào, thử chia theo dấu xuống dòng
    if (sentences.length === 0) {
      const paragraphs = story.split(/\n+/).filter(s => s.trim() !== '');

      // Xử lý từng đoạn văn
      for (const paragraph of paragraphs) {
        if (paragraph.length > MAX) {
          // Chia đoạn dài thành các phần nhỏ hơn
          const parts = splitLongSentence(paragraph);
          sentences = sentences.concat(parts);
        } else {
          sentences.push(paragraph);
        }
      }

      // Nếu vẫn không có đoạn nào, thử chia theo khoảng trắng
      if (sentences.length === 0) {
        sentences = story.split(/\s+/).filter(w => w.trim() !== '');

        // Nếu vẫn không có, coi toàn bộ là một câu và xử lý đặc biệt
        if (sentences.length === 0) {
          // Chia chuỗi thành các phần có độ dài tối đa MAX ký tự
          let remaining = story;
          while (remaining.length > MAX) {
            sentences.push(remaining.substring(0, MAX));
            remaining = remaining.substring(MAX);
          }
          if (remaining.length > 0) {
            sentences.push(remaining);
          }
          return sentences;
        }
      }
    }

    const segments = [];
    let currentSegment = '';

    // Duyệt qua từng câu và phân bổ vào các đoạn dựa trên số ký tự
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];

      // Kiểm tra nếu câu đơn lẻ quá dài
      if (sentence.length > MAX) {
        // Nếu đã có nội dung trong đoạn hiện tại, lưu lại trước
        if (currentSegment !== '') {
          segments.push(currentSegment);
          currentSegment = '';
        }

        // Chia câu dài thành các phần nhỏ hơn
        const parts = splitLongSentence(sentence);
        segments.push(...parts);
        continue;
      }

      // Nếu đoạn hiện tại còn trống, thêm câu vào đoạn
      if (currentSegment === '') {
        currentSegment = sentence;
      }
      // Nếu thêm câu hiện tại vào đoạn hiện tại không làm vượt quá MAX ký tự, thêm vào
      else if (currentSegment.length + sentence.length <= MAX) {
        currentSegment += sentence;
      }
      // Nếu đoạn hiện tại đã đạt ít nhất MIN ký tự và thêm câu mới sẽ vượt quá MAX ký tự
      else if (currentSegment.length >= MIN) {
        segments.push(currentSegment);
        currentSegment = sentence;
      }
      // Nếu đoạn hiện tại chưa đạt MIN ký tự nhưng thêm câu mới sẽ vượt quá MAX ký tự
      else {
        // Thử chia câu hiện tại theo khoảng trắng để không cắt từ
        const words = sentence.split(/\s+/);
        let partialSentence = '';

        // Thêm từng từ vào cho đến khi đạt giới hạn
        for (let j = 0; j < words.length; j++) {
          if (currentSegment.length + partialSentence.length + words[j].length + (partialSentence ? 1 : 0) <= MAX) {
            partialSentence += (partialSentence ? ' ' : '') + words[j];
          } else {
            // Đã đạt giới hạn, thêm phần đã xử lý vào đoạn hiện tại
            currentSegment += (partialSentence ? ' ' + partialSentence : partialSentence);
            segments.push(currentSegment);

            // Bắt đầu đoạn mới với các từ còn lại
            currentSegment = words.slice(j).join(' ');
            break;
          }
        }

        // Nếu đã xử lý hết các từ mà chưa tạo đoạn mới
        if (partialSentence && currentSegment !== words.join(' ')) {
          currentSegment += (partialSentence ? ' ' + partialSentence : partialSentence);
        }
      }
    }

    // Thêm đoạn cuối cùng nếu còn
    if (currentSegment !== '') {
      segments.push(currentSegment);
    }

    // Kiểm tra lại các đoạn để đảm bảo không có đoạn nào vượt quá MAX ký tự
    const finalSegments = [];
    for (const segment of segments) {
      if (segment.length > MAX) {
        // Chia đoạn dài thành các phần nhỏ hơn
        const parts = splitLongSentence(segment);
        finalSegments.push(...parts);
      } else {
        finalSegments.push(segment);
      }
    }
    return finalSegments;
  }
  
  // Ví dụ sử dụng
  function exampleUsage() {
    const storyText = ``;

    // Sử dụng hàm chia đoạn theo độ dài ký tự (MIN-MAX)
    const segments = splitStoryByCharLength(storyText);


    segments.forEach((segment, index) => {
    });
  }

  // Xuất các hàm để có thể sử dụng
  module.exports = {
    splitStoryIntoSegments,
    splitStoryByWords,
    autoSplitStory,
    splitStoryByCharLength
  };

// exampleUsage()
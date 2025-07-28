/**
 * Formats the OpenAI response text into structured content objects
 * @param {string} aiResponse - Raw text response from OpenAI
 * @returns {Array} Array of formatted content objects
 */
function formatOpenAIResponse(content) {
  const contentItems = [];
  const items = content.split(/\d+\.\s+/).filter(Boolean);

  for (const item of items) {
    try {
      // Extract title
      const titleMatch = item.match(/Title:\s*"([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : "";

      // Extract outline - fixed regex to capture indented items
      const outlineMatch = item.match(
        /\*\*Outline:\*\*\s*([\s\S]*?)\*\s+\*\*Target/
      );
      const outlineText = outlineMatch ? outlineMatch[1] : "";
      const outline = outlineText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && line.startsWith("*"))
        .map((line) => line.replace(/^\s*\*\s*/, ""));

      // Fixed target audience extraction
      const targetMatch = item.match(
        /\*\*Target Audience:\*\*\s*([\s\S]*?)\*\s+\*\*Keywords/
      );
      const target_audience = targetMatch
        ? targetMatch[1].replace(/^\s*\*?\s*/, "").trim()
        : "";

      // Fixed keywords extraction
      const keywordsMatch = item.match(
        /\*\*Keywords:\*\*\s*([\s\S]*?)\*\s+\*\*Duration/
      );
      const keywords = keywordsMatch
        ? keywordsMatch[1]
            .replace(/^\s*\*?\s*/, "")
            .trim()
            .split(/\s+/)
            .filter((k) => k.startsWith("#"))
        : [];

      // Fixed duration extraction
      const durationMatch = item.match(
        /\*\*Duration:\*\*\s*([\s\S]*?)(?=$|\n)/
      );
      const duration = durationMatch
        ? durationMatch[1].replace(/^\s*\*?\s*/, "").trim()
        : "";

      // Fixed thumbnail audience extraction
      const thumbnailMatch = item.match(
        /\*\*Thumbnail:\*\*\s*([\s\S]*?)(?=\*\*|$)/
      );
      const thumbnail = thumbnailMatch
        ? thumbnailMatch[1].replace(/^\s*\*?\s*/, "").trim()
        : "";

        const contentMatch = item.match(
          /\*\*Content:\*\*\s*([\s\S]*?)(?=\*\*|$)/
        );
        const content = contentMatch
          ? contentMatch[1].replace(/^\s*\*?\s*/, "").trim()
          : "";
  

      if (title) {
        contentItems.push({
          title,
          outline,
          target_audience,
          keywords,
          duration,
          thumbnail,
          content
        });
      }
    } catch (error) {
      console.error("Error parsing content item:", error);
      continue;
    }
  }

  return contentItems;
}

module.exports = { formatOpenAIResponse };

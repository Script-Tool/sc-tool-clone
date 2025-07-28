function extractUsernameOrChannelId(str) {
    const regex = /(?:@|channel\/)([^/?]+)/;
    const match = str.match(regex);
    
     if (match) {
      const prefix = match[0].startsWith("@") ? "@" : "channel/";
      return prefix + match[1];
    }
    
    return str;
}

module.exports = extractUsernameOrChannelId;

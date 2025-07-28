const TempMailSo = require("temp-mail-so");

// Initialize client
const client = new TempMailSo(
  "ff4d4ed95fmsh2999ad90babdaacp1fe745jsn5db51905f4f3",
  "E1D69FE3-8B6D-1E97-7CAB-4CC13C0499A9"
);

const DOMAINS = [
  "mailnuo.com",
  "mailbai.com",
  "mailshan.com",
  "driftz.net",
  "topvu.net",
  "dotvu.net",
  "flyzy.net",
  "mixzu.net",
  "drivz.net",
  "dotzi.net",
  "dotup.net",
  "vibzi.net",
  "spinly.net",
  "pixoledge.net",
  "quickblox.net",
  "zoomnavi.net",
  "swiftfynd.net",
  "flixtrend.net",
];

function generateRandomString(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const createTempMail = async () => {
  try {
    // Get available domains
    // const domains = await client.getDomains();
    const randomDomain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    const randomMailName = generateRandomString();

    // Create inbox (prefix, domain, lifetime in seconds)
    const inbox = await client.createInbox(randomMailName, randomDomain, 600);

    return {
      ...inbox,
      email: randomMailName + "@" + randomDomain,
      password: generateRandomString(12),
    };
  } catch (error) {
    console.error("Error:", error);
  }
};

const getListMails = async (inboxId) => {
  try {
    // Get received emails
    const emails = await client.listMails(inboxId);
    return emails;
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports.rapidAPI = { createTempMail, getListMails };

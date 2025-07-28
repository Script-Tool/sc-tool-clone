const DEFAULT_COUNTRIES = [
  {
    id: "0",
    name: "Russia",
  },
  {
    id: "10",
    name: "Việt Nam",
  },
  {
    id: "11",
    name: "Kyrgyzstan",
  },
  {
    id: "16",
    name: "United Kingdom (sms-activate, 5sim)",
    type: "smsactivate",
  },
  {
    id: "187",
    name: "United States (sms-activate)",
    type: "smsactivate",
  },
  {
    id: "31",
    name: "South Africa",
  },
  {
    id: "36",
    name: "Canada (sms-activate)",
    type: "smsactivate",
  },
  {
    id: "4",
    name: "Philippines",
  },
  {
    id: "40",
    name: "Uzbekistan",
  },
  {
    id: "52",
    name: "Thailand (sms-activate)",
    type: "smsactivate",
  },
  {
    id: "6",
    name: "Indonesia (sms-activate)",
    type: "smsactivate",
  },
  {
    id: "63",
    name: "Czech Republic",
  },
  {
    id: "7",
    name: "Malaysia",
  },
];

// Tạo danh sách tài khoản mặc định
async function initDefaultCountries() {
  const Country = getModel("Country");

  const countries = await Country.find({
    id: { $in: DEFAULT_COUNTRIES.map((item) => item.id) },
  });

  if (countries.length === DEFAULT_COUNTRIES.length) {
    return;
  }
  await Country.create(DEFAULT_COUNTRIES);
}

module.exports = initDefaultCountries;

const KHMER_SYNONYMS = [
  { terms: ["អ្នកចាប់ផ្តើម", "ចាប់ផ្តើម", "ដំបូង", "ងាយ", "ស្រួល"], tokens: "beginner starter easy" },
  { terms: ["ផលិតផល", "គ្រឿងបន្លាស់", "ឧបករណ៍", "មាន", "រក"], tokens: "product parts component find search" },
  { terms: ["ឈុត", "គម្រោង", "រ៉ូបូត", "ឡានរ៉ូបូត"], tokens: "kit project robot robot car" },
  { terms: ["ក្រោម", "តិចជាង", "ថោក", "តម្លៃថោក", "មិនលើស"], tokens: "under cheap budget affordable" },
  { terms: ["ត្រូវគ្នា", "ប្រើជាមួយ", "សាកសម", "អាចប្រើ", "ដំណើរការជាមួយ"], tokens: "compatible compatibility work with" },
  { terms: ["ត្រូវការ", "បានទេ"], tokens: "compatible need" },
  { terms: ["ដឹកជញ្ជូន", "ថ្លៃដឹក", "ផ្ញើ", "ទីតាំង"], tokens: "delivery shipping fee location" },
  { terms: ["បង់ប្រាក់", "ទូទាត់", "ធនាគារ"], tokens: "payment pay bank" },
  { terms: ["ប្រៀបធៀប", "មួយណាល្អ", "ខុសគ្នា"], tokens: "compare which is better difference" },
  { terms: ["សិនស័រ"], tokens: "sensor" },
  { terms: ["ម៉ូទ័រ"], tokens: "motor dc motor" },
  { terms: ["ថ្ម"], tokens: "battery power" },
  { terms: ["បន្ទះ"], tokens: "board controller" },
  { terms: ["ឧបសគ្គ"], tokens: "obstacle obstacle avoiding" },
  { terms: ["តាមខ្សែ"], tokens: "line follower" },
  { terms: ["សីតុណ្ហភាព", "សំណើម", "បរិស្ថាន", "វាស់"], tokens: "temperature humidity environment monitoring sensor" },
  { terms: ["យ៉ាងដូចម្តេច"], tokens: "how to build project" },
  { terms: ["restart", "រីស្តាត"], tokens: "restart brownout power troubleshooting" },
  { terms: ["ការបញ្ជាទិញ", "ស្ថានភាព", "តាមដាន"], tokens: "order status tracking" },
  { terms: ["ប្តូរ", "ត្រឡប់", "បោះបង់", "សងប្រាក់"], tokens: "return cancel refund" },
  { terms: ["ព័ត៌មាន", "ដំណឹង", "ព័ត៌មានថ្មី", "បច្ចុប្បន្នភាព"], tokens: "news latest headlines" },
  { terms: ["គម្រោងសាលា", "កិច្ចការសាលា"], tokens: "school project" },
  { terms: ["ចង់បាន", "ចង់ទិញ"], tokens: "want buy looking for" },
  { terms: ["របៀបធ្វើ", "ជំហាន", "ណែនាំ"], tokens: "how to steps instructions recommend" }
];

const FOLLOW_UP_TRANSLATIONS = {
  "Show cheaper": "បង្ហាញជម្រើសថោកជាង",
  "Beginner only": "សម្រាប់អ្នកចាប់ផ្តើម",
  "Compare options": "ប្រៀបធៀបជម្រើស",
  "Show kits": "បង្ហាញឈុតរ៉ូបូត",
  "Show parts": "បង្ហាញគ្រឿងបន្លាស់",
  "Check compatibility": "ពិនិត្យភាពត្រូវគ្នា",
  "Show motor drivers": "បង្ហាញ motor driver",
  "Show batteries": "បង្ហាញថ្ម",
  "Beginner robot car": "ឡានរ៉ូបូតសម្រាប់អ្នកចាប់ផ្តើម",
  "Show controllers": "បង្ហាញ controller",
  "Show beginner kits": "បង្ហាញឈុតសម្រាប់អ្នកចាប់ផ្តើម",
  "Show ultrasonic sensors": "បង្ហាញ ultrasonic sensor",
  "Robot under $30": "រ៉ូបូតក្រោម $30",
  "Find ESP32 products": "រកផលិតផល ESP32",
  "5V products": "ផលិតផល 5V",
  "Compare Arduino and ESP32": "ប្រៀបធៀប Arduino និង ESP32",
  "Show products": "បង្ហាញផលិតផល"
  ,
  "Is it compatible with Arduino?": "វាប្រើជាមួយ Arduino បានទេ?",
  "Show similar products": "បង្ហាញផលិតផលស្រដៀង",
  "Explain the controller": "ពន្យល់អំពី controller",
  "Latest robot news": "ព័ត៌មានរ៉ូបូតថ្មីៗ",
  "More robot news": "ព័ត៌មានរ៉ូបូតបន្ថែម",
  "Explain step by step": "ពន្យល់ជាជំហានៗ"
};

export function detectLanguage(text = "") {
  const value = String(text || "");
  const khmerCount = (value.match(/[\u1780-\u17ff]/g) || []).length;

  if (khmerCount === 0) {
    return "en";
  }

  const latinCount = (value.match(/[A-Za-z]/g) || []).length;

  // Pure-Khmer messages (no Latin letters) stay Khmer. For mixed messages,
  // reply in whichever script the customer used more \u2014 so a mostly-English
  // question with a stray Khmer word still gets an English answer.
  return khmerCount >= latinCount ? "km" : "en";
}

export function normalizeKhmerQuery(text = "") {
  const input = String(text || "").toLowerCase();
  const tokens = [];

  for (const synonym of KHMER_SYNONYMS) {
    if (synonym.terms.some((term) => input.includes(term.toLowerCase()))) {
      tokens.push(synonym.tokens);
    }
  }

  return tokens.length ? `${input} ${tokens.join(" ")}` : input;
}

export function localizeFollowUps(followUps = [], language = "en") {
  if (language !== "km") {
    return followUps;
  }

  return followUps.map((followUp) => FOLLOW_UP_TRANSLATIONS[followUp] || followUp);
}

import { localizeFollowUps } from "@/modules/chatbot/chatbot.language";

export function getLowConfidenceReply(language = "en") {
  return language === "km"
    ? "ខ្ញុំមិនទាន់យល់ច្បាស់ពីសំណួររបស់អ្នកនៅឡើយទេ។ អ្នកអាចសួរអំពីផលិតផល និងឈុតរ៉ូបូត គ្រឿងបន្លាស់សម្រាប់អ្នកចាប់ផ្តើម ភាពត្រូវគ្នា គម្រោងរ៉ូបូត តម្លៃ ការដឹកជញ្ជូន ការទូទាត់ KHQR ឬស្ថានភាពនៃការបញ្ជាទិញ។"
    : "I'm not sure I understood that yet. You can ask about products and robot kits, beginner parts, compatibility, robot projects, prices, delivery, KHQR payment, or your order status.";
}

export function getClarifyingCatalogFollowUps(language = "en") {
  return language === "km"
    ? ["តើអ្នកចង់បានសេនស័ររ៉ូបូតទេ?", "តើអ្នកកំពុងធ្វើរ៉ូបូតដើរតាមខ្សែទេ?", "តើអ្នកត្រូវការ Arduino beginner parts ទេ?"]
    : ["Do you want robot sensors?", "Are you building a line-following robot?", "Do you need Arduino beginner parts?"];
}

export function getEmptyResponse(language) {
  if (language === "km") {
    return {
      reply: "សូមសួរអំពីផលិតផល ឈុតរ៉ូបូត ភាពត្រូវគ្នា ការទូទាត់ KHQR ឬការដឹកជញ្ជូន។",
      catalogSummary: null,
      catalogMatches: [],
      followUps: localizeFollowUps(["Beginner only", "Find ESP32 products", "Show kits"], language),
      language
    };
  }

  return {
    reply: "Ask about products, robot kits, compatibility, KHQR payment, or delivery.",
    catalogSummary: null,
    catalogMatches: [],
    followUps: ["I'm a beginner", "Find ESP32 products", "Suggest a line follower kit"],
    language
  };
}

export function localizeMatchedRuleAnswer(answer, language) {
  if (language !== "km") {
    return answer;
  }

  if (answer.includes("Delivery fee")) {
    return "ថ្លៃដឹកជញ្ជូនគឺ $1.50 សម្រាប់ភ្នំពេញ និង $2.50 សម្រាប់ខេត្តផ្សេងៗ។";
  }

  if (answer.includes("KHQR") || answer.includes("payment")) {
    return "យើងទទួលយក KHQR payment។ សូម scan QR code នៅ checkout ដើម្បីបញ្ចប់ការបញ្ជាទិញ។";
  }

  if (answer.includes("beginners") || answer.includes("beginner")) {
    return "សម្រាប់អ្នកចាប់ផ្តើម សូមចាប់ផ្តើមជាមួយ 4WD Smart Robot Car Kit, ESP32 Dev Board និង Ultrasonic Distance Sensor។";
  }

  if (answer.includes("ESP32 works")) {
    return "ESP32 ប្រើបានល្អជាមួយ ultrasonic sensors, motor drivers, OLED displays និង 4WD Smart Robot Car Kit។";
  }

  return answer;
}

export function getDirectFaqResponse(input, language) {
  if (input.includes("return") || input.includes("cancel") || input.includes("refund")) {
    return {
      reply:
        language === "km"
          ? "ដើម្បីស្នើសុំការប្តូរ ការបោះបង់ ឬការសងប្រាក់ សូមទាក់ទងហាងដោយផ្តល់លេខបញ្ជាទិញរបស់អ្នក ហើយយើងនឹងជួយដោះស្រាយជូន។"
          : "To request a return, cancellation, or refund, please contact the store with your order number and we'll help you sort it out.",
      catalogSummary: null,
      catalogMatches: [],
      followUps: [],
      language
    };
  }

  if (
    input.includes("order status") ||
    input.includes("my order") ||
    input.includes("where is my order") ||
    input.includes("track") ||
    (input.includes("order") && input.includes("status"))
  ) {
    return {
      reply:
        language === "km"
          ? "ដើម្បីពិនិត្យការបញ្ជាទិញ សូមចូលគណនី រួចបើកទំព័រ Orders របស់អ្នក ដែលបង្ហាញស្ថានភាពចុងក្រោយនៃការបញ្ជាទិញនីមួយៗ។ បើមានបញ្ហា សូមទាក់ទងហាង យើងនឹងជួយ។"
          : "To check an order, sign in and open your Orders page in your account — it shows the latest status for each order. If something looks wrong, contact the store and we'll help.",
      catalogSummary: null,
      catalogMatches: [],
      followUps: [],
      language
    };
  }

  if (input.includes("delivery") || input.includes("shipping") || input.includes("fee") || input.includes("location")) {
    return {
      reply:
        language === "km"
          ? "ថ្លៃដឹកជញ្ជូនគឺ $1.50 សម្រាប់ភ្នំពេញ និង $2.50 សម្រាប់ខេត្តផ្សេងៗ។"
          : "Delivery fee is 1.5 for Phnom Penh and 2.5 for other provinces.",
      catalogSummary: null,
      catalogMatches: [],
      followUps: [],
      language
    };
  }

  if (input.includes("payment") || input.includes("khqr") || input.includes("aba") || input.includes("bank") || input.includes("pay")) {
    return {
      reply:
        language === "km"
          ? "យើងទទួលយក KHQR payment។ សូម scan QR code នៅ checkout ដើម្បីបញ្ចប់ការបញ្ជាទិញ។"
          : "We accept KHQR payment. Scan the QR code shown at checkout to complete your order.",
      catalogSummary: null,
      catalogMatches: [],
      followUps: [],
      language
    };
  }

  return null;
}

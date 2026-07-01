const BASE_URL = process.env.CHATBOT_SMOKE_URL || "http://localhost:3000";

const khmerPattern = /[\u1780-\u17ff]/;

const cases = [
  {
    name: "khmer hc-sr04 detail",
    message: "តើ HC-SR04 ប្រើសម្រាប់អ្វី?",
    expectedItems: ["HC-SR04"],
    expectedReply: ["HC-SR04"],
    requireKhmer: true,
  },
  {
    name: "khmer arduino detail",
    message: "ពន្យល់ Arduino Uno",
    expectedItems: ["Arduino Uno"],
    expectedReply: ["Arduino Uno"],
    requireKhmer: true,
  },
  {
    name: "khmer tcrt5000 detail",
    message: "តើ TCRT5000 ប្រើសម្រាប់អ្វី?",
    expectedItems: ["TCRT5000"],
    expectedReply: ["TCRT5000"],
    requireKhmer: true,
  },
  {
    name: "khmer arduino esp32 comparison",
    message: "ប្រៀបធៀប Arduino Uno និង ESP32",
    expectedItems: ["Arduino Uno", "ESP32"],
    expectedReply: ["Arduino Uno", "ESP32"],
    requireKhmer: true,
  },
];

async function ask(message) {
  const response = await fetch(`${BASE_URL}/api/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.data || payload;
}

function assertIncludes(text, expected, label) {
  for (const value of expected) {
    if (!String(text || "").includes(value)) {
      throw new Error(`${label} missing "${value}"`);
    }
  }
}

async function run() {
  for (const testCase of cases) {
    const result = await ask(testCase.message);
    const itemNames = (result.items || []).map((item) => item.name).join(" | ");

    if (result.language !== "km") {
      throw new Error(`${testCase.name}: expected language km, got ${result.language}`);
    }

    assertIncludes(itemNames, testCase.expectedItems, `${testCase.name}: items`);
    assertIncludes(result.reply, testCase.expectedReply, `${testCase.name}: reply`);

    if (testCase.requireKhmer && !khmerPattern.test(result.reply)) {
      throw new Error(`${testCase.name}: reply is not Khmer`);
    }

    console.log(`ok - ${testCase.name}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

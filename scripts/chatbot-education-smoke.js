const BASE_URL = process.env.CHATBOT_SMOKE_URL || "http://localhost:3000";

const khmerPattern = /[\u1780-\u17ff]/;

const cases = [
  {
    name: "line follower explanation",
    message: "What is a line-following robot?",
    expect: ({ data, names }) =>
      /line/i.test(data.reply || "") &&
      /sensor|controller|motor/i.test(data.reply || "") &&
      names.every(Boolean),
  },
  {
    name: "obstacle avoider explanation",
    message: "How does obstacle avoiding robot work?",
    expect: ({ data, names }) =>
      /obstacle|distance|sensor/i.test(data.reply || "") &&
      /controller|motor/i.test(data.reply || "") &&
      names.every(Boolean),
  },
  {
    name: "line follower how to build",
    message: "How to build a line-following robot?",
    expect: ({ data, names }) =>
      /parts|wiring|logic|sensor/i.test(data.reply || "") &&
      names.some((name) => /TCRT5000|Motor Driver|TT DC/i.test(name)),
  },
  {
    name: "black line troubleshooting",
    message: "My robot cannot detect the black line",
    expect: ({ data }) => /power|wiring|threshold|sensor|test/i.test(data.reply || ""),
  },
  {
    name: "dc motor troubleshooting",
    message: "Why are my DC motors not moving?",
    expect: ({ data }) => /power|battery|wiring|motor driver|test/i.test(data.reply || ""),
  },
  {
    name: "khmer line follower explanation",
    message: "រ៉ូបូតដើរតាមខ្សែគឺជាអ្វី?",
    expect: ({ data }) =>
      data.language === "km" &&
      khmerPattern.test(data.reply || "") &&
      /TCRT5000|sensor|controller|motor/i.test(data.reply || ""),
  },
  {
    name: "khmer obstacle avoider explanation",
    message: "រ៉ូបូតគេចឧបសគ្គដំណើរការយ៉ាងដូចម្តេច?",
    expect: ({ data }) =>
      data.language === "km" &&
      khmerPattern.test(data.reply || "") &&
      /HC-SR04|sensor|controller|motor/i.test(data.reply || ""),
  },
  {
    name: "khmer line follower how to build",
    message: "តើត្រូវការអ្វីខ្លះដើម្បីធ្វើរ៉ូបូតដើរតាមខ្សែ?",
    expect: ({ data, names }) =>
      data.language === "km" &&
      khmerPattern.test(data.reply || "") &&
      /TCRT5000|sensor|controller|motor/i.test(data.reply || "") &&
      names.some((name) => /TCRT5000|Motor Driver|TT DC/i.test(name)),
  },
  {
    name: "khmer black line troubleshooting",
    message: "រ៉ូបូតខ្ញុំរកខ្សែខ្មៅមិនឃើញ",
    expect: ({ data }) => data.language === "km" && khmerPattern.test(data.reply || "") && /sensor|threshold|wiring|Power|ថ្ម|pin/i.test(data.reply || ""),
  },
];

async function postChatbot(message) {
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

async function main() {
  for (const testCase of cases) {
    const data = await postChatbot(testCase.message);
    const names = (data.items || []).map((item) => item.name || "");
    const hasRawRoute = /\/products\/|\/robot-kits\//.test(data.reply || "");
    const hasInvalidCard = (data.items || []).some((item) => !item.id || !item.name || !item.type);

    if (hasRawRoute || hasInvalidCard || !testCase.expect({ data, names })) {
      throw new Error(`Failed: ${testCase.name}\nReply: ${data.reply}\nItems: ${names.join(", ")}`);
    }

    console.log(`ok - ${testCase.name}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

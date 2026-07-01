const BASE_URL = process.env.CHATBOT_SMOKE_URL || "http://localhost:3000";

const khmerPattern = /[\u1780-\u17ff]/;

const cases = [
  {
    name: "products more expensive than Arduino Uno",
    message: "What products are more expensive than Arduino Uno?",
    type: "listing",
    expect: ({ data, names }) => data.items.length > 0 && data.items.every((item) => item.type === "product") && !names.some((name) => /Arduino Uno/i.test(name))
  },
  {
    name: "products cheaper than ESP32",
    message: "Show products cheaper than ESP32",
    type: "listing",
    expect: ({ data, names }) => data.items.length > 0 && data.items.every((item) => item.type === "product") && !names.some((name) => /ESP32/i.test(name))
  },
  {
    name: "kits under 100",
    message: "Show kits under $100",
    type: "listing",
    expect: ({ data }) => data.items.length > 0 && data.items.every((item) => item.type === "kit" && Number(item.price) <= 100)
  },
  {
    name: "products between 5 and 10",
    message: "Products between $5 and $10",
    type: "listing",
    expect: ({ data }) => data.items.length > 0 && data.items.every((item) => item.type === "product" && Number(item.price) >= 5 && Number(item.price) <= 10)
  },
  {
    name: "weather station",
    message: "Can I build a weather station with your products?",
    type: "educational",
    expect: ({ data, names }) => /sensor|temperature|humidity|environment|monitor/i.test(data.reply || "") && names.length > 0
  },
  {
    name: "DHT11 and OLED project",
    message: "What project can I build with DHT11 and OLED?",
    type: "educational",
    expect: ({ data, names }) => /DHT11|OLED|sensor|display|environment|monitor/i.test(`${data.reply} ${names.join(" ")}`) && names.length > 0
  },
  {
    name: "Bluetooth robot car",
    message: "Which parts are better for a Bluetooth robot car?",
    type: "educational",
    expect: ({ data, names }) => /bluetooth|wireless|controller|motor|driver/i.test(`${data.reply} ${names.join(" ")}`) && names.length > 0
  },
  {
    name: "phone controlled robot",
    message: "How can I make my robot controlled by phone?",
    type: "educational",
    expect: ({ data, names }) => /phone|wireless|bluetooth|controller|robot/i.test(`${data.reply} ${names.join(" ")}`) && names.length > 0
  },
  {
    name: "khmer more expensive",
    message: "ផលិតផលថ្លៃជាង Arduino Uno",
    type: "listing",
    expect: ({ data }) => data.language === "km" && data.items.length > 0 && data.items.every((item) => item.type === "product")
  },
  {
    name: "khmer under 10",
    message: "ផលិតផលក្រោម 10 ដុល្លារ",
    type: "listing",
    expect: ({ data }) => data.language === "km" && data.items.length > 0 && data.items.every((item) => item.type === "product" && Number(item.price) <= 10)
  },
  {
    name: "khmer DHT11 project",
    message: "តើខ្ញុំអាចធ្វើ project អ្វីបានជាមួយ DHT11?",
    type: "educational",
    expect: ({ data, names }) => data.language === "km" && khmerPattern.test(data.reply || "") && /DHT11|temperature|humidity|sensor/i.test(`${data.reply} ${names.join(" ")}`)
  },
  {
    name: "khmer greenhouse sensor",
    message: "តើ sensor មួយណាសាកសមសម្រាប់ greenhouse project?",
    type: "educational",
    expect: ({ data, names }) => data.language === "km" && khmerPattern.test(data.reply || "") && /sensor|temperature|humidity|soil|DHT/i.test(`${data.reply} ${names.join(" ")}`)
  },
  {
    name: "khmer phone robot",
    message: "តើធ្វើ robot បញ្ជាដោយទូរស័ព្ទយ៉ាងដូចម្តេច?",
    type: "educational",
    expect: ({ data, names }) => data.language === "km" && khmerPattern.test(data.reply || "") && /wireless|bluetooth|controller|robot|ESP32/i.test(`${data.reply} ${names.join(" ")}`)
  }
];

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasNoProductNames(reply = "", names = []) {
  return names.every((name) => {
    const cleaned = String(name || "").trim();
    return !cleaned || !new RegExp(`\\b${escapeRegExp(cleaned)}\\b`, "i").test(reply);
  });
}

function hasNoInternalWording(reply = "") {
  return !/(Recommended matches|Matched products|Matched kits|score|ranking|top matched|\/products\/|\/robot-kits\/)/i.test(String(reply || ""));
}

function hasCompactListingReply(reply = "", names = []) {
  const sentences = String(reply || "")
    .split(/[.!?។]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return sentences.length <= 2 && hasNoProductNames(reply, names) && hasNoInternalWording(reply);
}

function assertValidCards(items = []) {
  return items.every(
    (item) =>
      item &&
      item.id &&
      item.name &&
      ["product", "kit"].includes(item.type) &&
      item.routeUrl &&
      !/invented|example|placeholder/i.test(item.name)
  );
}

async function postChatbot(message) {
  const response = await fetch(`${BASE_URL}/api/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
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
    const validCards = assertValidCards(data.items || []);
    const validListing = testCase.type !== "listing" || hasCompactListingReply(data.reply, names);
    const validEducational = testCase.type !== "educational" || hasNoInternalWording(data.reply);

    if (!validCards || !validListing || !validEducational || !testCase.expect({ data, names })) {
      throw new Error(`Failed: ${testCase.name}\nReply: ${data.reply}\nItems: ${names.join(", ")}`);
    }

    console.log(`ok - ${testCase.name}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

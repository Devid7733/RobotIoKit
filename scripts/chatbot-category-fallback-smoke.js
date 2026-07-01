const BASE_URL = process.env.CHATBOT_SMOKE_URL || "http://localhost:3000";

const khmerPattern = /[\u1780-\u17ff]/;

const cases = [
  {
    name: "dht11 detail",
    message: "What is DHT11?",
    expectedItems: ["DHT11 Temperature & Humidity Sensor"],
    expect: ({ data }) => /temperature|humidity|sensor/i.test(data.reply || ""),
  },
  {
    name: "environment monitoring how to",
    message: "How to build environment monitoring project?",
    expectedItemPattern: /DHT11|DHT22|BME280|BMP280|Soil|Water|Rain/i,
    expect: ({ data }) => /environment|sensor|temperature|humidity|monitor/i.test(data.reply || ""),
  },
  {
    name: "nrf24l01 detail",
    message: "Explain NRF24L01",
    expectedItems: ["NRF24L01 Wireless Module"],
    expect: ({ data }) => /wireless|communication|2\.4|robot/i.test(data.reply || ""),
  },
  {
    name: "esp32 restarting troubleshooting",
    message: "Why is my ESP32 restarting?",
    expectedItemPattern: /LM2596|Power|Battery|Converter|Regulator/i,
    expect: ({ data }) => /power|voltage|brownout|restart|regulator/i.test(data.reply || ""),
  },
  {
    name: "arduino safe power",
    message: "How to power Arduino safely?",
    expectedItemPattern: /LM2596|Power|Battery|Adapter|Regulator/i,
    expect: ({ data }) => /power|voltage|regulator|battery|safety|safe/i.test(data.reply || ""),
  },
  {
    name: "compare dht11 dht22",
    message: "Compare DHT11 and DHT22",
    expectedItems: ["DHT11 Temperature & Humidity Sensor", "DHT22 Temperature & Humidity Sensor"],
    expect: ({ data }) => /DHT11|DHT22|compare|vs/i.test(data.reply || ""),
  },
  {
    name: "khmer dht11 detail",
    message: "តើ DHT11 ប្រើសម្រាប់អ្វី?",
    expectedItems: ["DHT11 Temperature & Humidity Sensor"],
    expect: ({ data }) => data.language === "km" && khmerPattern.test(data.reply || "") && /DHT11/.test(data.reply || ""),
  },
  {
    name: "khmer temperature project",
    message: "តើធ្វើ project វាស់សីតុណ្ហភាពយ៉ាងដូចម្តេច?",
    expectedItemPattern: /DHT11|DHT22|BME280|BMP280/i,
    expect: ({ data }) => data.language === "km" && khmerPattern.test(data.reply || "") && /temperature|sensor|DHT/i.test(data.reply || ""),
  },
  {
    name: "khmer nrf24l01 detail",
    message: "ពន្យល់ NRF24L01",
    expectedItems: ["NRF24L01 Wireless Module"],
    expect: ({ data }) => data.language === "km" && khmerPattern.test(data.reply || "") && /NRF24L01/.test(data.reply || ""),
  },
  {
    name: "khmer esp32 restart",
    message: "ហេតុអ្វី ESP32 restart?",
    expectedItemPattern: /LM2596|Power|Battery|Converter|Regulator/i,
    expect: ({ data }) => data.language === "km" && khmerPattern.test(data.reply || "") && /ESP32|power|voltage|LM2596/i.test(data.reply || ""),
  },
  {
    name: "khmer lm2596 detail",
    message: "តើ LM2596 ប្រើសម្រាប់អ្វី?",
    expectedItems: ["LM2596 DC-DC Buck Converter"],
    expect: ({ data }) => data.language === "km" && khmerPattern.test(data.reply || "") && /LM2596/.test(data.reply || ""),
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

function assertExpectedItems(testCase, names) {
  if (testCase.expectedItems) {
    for (const expected of testCase.expectedItems) {
      if (!names.includes(expected)) {
        throw new Error(`missing expected item "${expected}"`);
      }
    }
  }

  if (testCase.expectedItemPattern && !names.some((name) => testCase.expectedItemPattern.test(name))) {
    throw new Error(`missing item matching ${testCase.expectedItemPattern}`);
  }
}

async function main() {
  for (const testCase of cases) {
    const data = await postChatbot(testCase.message);
    const names = (data.items || []).map((item) => item.name || "");
    const hasRawRoute = /\/products\/|\/robot-kits\//.test(data.reply || "");
    const hasInvalidCard = (data.items || []).some((item) => !item.id || !item.name || !item.type);

    try {
      assertExpectedItems(testCase, names);
    } catch (error) {
      throw new Error(`Failed: ${testCase.name}\n${error.message}\nReply: ${data.reply}\nItems: ${names.join(", ")}`);
    }

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

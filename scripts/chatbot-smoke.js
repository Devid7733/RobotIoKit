const BASE_URL = process.env.CHATBOT_SMOKE_URL || "http://localhost:3000";
const EXPECTED_FOLLOW_UPS = ["What robot projects can I build?", "Store location", "Delivery fee Information"];

const cases = [
  {
    name: "kits only",
    message: "Show robot kits only",
    expect: ({ data, names }) =>
      data.items.every((item) => item.type === "kit") &&
      hasCompactListingReply(data.reply, names) &&
      (data.items.every((item) => Number(item.stock || 0) <= 0)
        ? /out of stock|not in stock|unavailable/i.test(data.reply || "")
        : true)
  },
  {
    name: "cheap sensors",
    message: "Show cheap sensors",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      data.items.every((item) => item.type === "product" && item.category === "Sensors") &&
      hasCompactListingReply(data.reply, names) &&
      hasAnyTerm(data.reply, ["sensor", "option", "match", "catalog"])
  },
  {
    name: "line follower",
    message: "I want to build a line-following robot",
    expect: ({ data, names }) =>
      names.some((name) => name.includes("TCRT5000")) &&
      names.some((name) => /Motor Driver|Chassis|Battery/i.test(name)) &&
      hasStructuredItems(data.items) &&
      hasOnlyBuildableItems(data.items) &&
      hasCompactListingReply(data.reply, names) &&
      hasAnyTerm(data.reply, ["line", "robot", "part", "project", "build"])
  },
  {
    name: "line-following robot parts",
    message: "Show me line-following robot parts",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      names.some((name) => name.includes("TCRT5000")) &&
      names.some((name) => /Motor Driver|TT DC|Chassis/i.test(name)) &&
      hasStructuredItems(data.items) &&
      hasOnlyBuildableItems(data.items)
  },
  {
    name: "obstacle avoider",
    message: "What do I need for obstacle avoiding robot?",
    expect: ({ data, names }) =>
      names.some((name) => name.includes("HC-SR04")) &&
      names.some((name) => name.includes("Motor Driver")) &&
      hasCompactListingReply(data.reply, names) &&
      hasAnyTerm(data.reply, ["obstacle", "robot", "part", "project", "build"])
  },
  {
    name: "robot car build",
    message: "Build a robot car",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      names.some((name) => /Arduino|ESP32/i.test(name)) &&
      names.some((name) => /Motor Driver/i.test(name)) &&
      names.some((name) => /Chassis/i.test(name)) &&
      hasCompactListingReply(data.reply, names)
  },
  {
    name: "robot project builders",
    message: "What robot projects can I build?",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      hasProjectCards(data.items) &&
      !data.items.some((item) => item.type === "product" || item.type === "kit") &&
      names.some((name) => /line-following robot/i.test(name)) &&
      names.some((name) => /obstacle-avoiding robot/i.test(name)) &&
      names.some((name) => /bluetooth robot car/i.test(name)) &&
      /choose a robot project/i.test(data.reply || "")
  },
  {
    name: "selected robot project products",
    message: "Build a line-following robot",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      data.items.every((item) => item.type === "product" || item.type === "kit") &&
      names.some((name) => name.includes("TCRT5000")) &&
      names.some((name) => /Motor Driver|TT DC|Chassis/i.test(name)) &&
      hasStructuredItems(data.items) &&
      hasOnlyBuildableItems(data.items) &&
      hasCompactListingReply(data.reply, names)
  },
  {
    name: "robot kits can build",
    message: "What robot kits can I build?",
    expect: ({ data }) =>
      data.items.length > 0 &&
      data.items.some((item) => item.type === "kit" || /robot|chassis|motor|sensor|controller/i.test(`${item.title || item.name} ${item.category || ""}`)) &&
      hasStructuredItems(data.items) &&
      hasOnlyBuildableItems(data.items)
  },
  {
    name: "bluetooth robot car build",
    message: "Build a Bluetooth robot car",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      names.some((name) => /Bluetooth|HC-05|ESP32|Wireless|NRF24/i.test(name)) &&
      names.some((name) => /Motor Driver/i.test(name)) &&
      names.some((name) => /Chassis/i.test(name)) &&
      hasCompactListingReply(data.reply, names)
  },
  {
    name: "esp32 iot project",
    message: "Recommend parts for an ESP32 IoT project",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      names.some((name) => /ESP32/i.test(name)) &&
      data.items.some((item) => item.category === "Controllers" || item.category === "Sensors" || item.category === "IoT & Communication" || item.category === "Accessories") &&
      hasNoInternalWording(data.reply || "")
  },
  {
    name: "products under 20",
    message: "Recommend products under $20",
    expect: ({ data }) => data.items.length > 0 && data.items.every((item) => item.type === "product" && Number(item.price) <= 20) && /under|below|\$20/i.test(data.reply || "")
  },
  {
    name: "sensors under 10",
    message: "Show sensors under $10",
    expect: ({ data }) => data.items.length > 0 && data.items.every((item) => item.type === "product" && item.category === "Sensors" && Number(item.price) <= 10)
  },
  {
    name: "products above 50",
    message: "Show products above $50",
    expect: ({ data }) => data.items.length > 0 && data.items.every((item) => item.type === "product" && Number(item.price) >= 50)
  },
  {
    name: "robot kits below 100",
    message: "Show robot kits below $100",
    expect: ({ data }) => data.items.length > 0 && data.items.every((item) => item.type === "kit" && Number(item.price) <= 100)
  },
  {
    name: "arduino between 5 and 30",
    message: "Find Arduino products between $5 and $30",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      data.items.every((item) => item.type === "product" && Number(item.price) >= 5 && Number(item.price) <= 30) &&
      names.some((name) => /arduino/i.test(name))
  },
  {
    name: "categories under 20",
    message: "What categories have products under $20?",
    expect: ({ data }) => data.items.length > 0 && /categories/i.test(data.reply || "") && data.items.every((item) => item.type === "product" && Number(item.price) <= 20)
  },
  {
    name: "cheaper than esp32",
    message: "Show products cheaper than ESP32",
    expect: ({ data, names }) =>
      data.items.length > 0 &&
      data.items.every((item) => item.type === "product") &&
      !names.some((name) => /esp32/i.test(name)) &&
      hasAnyTerm(data.reply, ["cheaper", "lower-priced", "lower price", "budget", "more affordable", "affordable options", "under $"])
  },
  {
    name: "kits more expensive than beginner kit",
    message: "Show kits more expensive than beginner robot kit",
    expect: ({ data }) =>
      data.items.length > 0 &&
      data.items.every((item) => item.type === "kit") &&
      hasAnyTerm(data.reply, ["more expensive", "higher-priced", "higher price", "priced higher"])
  },
  {
    name: "arduino sensors",
    message: "Can I use Arduino with sensors?",
    expect: ({ data }) => data.items.some((item) => item.category === "Sensors")
  },
  {
    name: "sensor concept does",
    message: "what does Sensor do?",
    expect: ({ data }) =>
      data.items.length <= 4 &&
      /sensor/i.test(data.reply || "") &&
      /environment|detect|distance|light|temperature|obstacles/i.test(data.reply || "") &&
      !/I found a few suitable options/i.test(data.reply || "")
  },
  {
    name: "sensor concept what",
    message: "what is a sensor?",
    expect: ({ data }) => data.items.length <= 4 && /sensor/i.test(data.reply || "") && /robot/i.test(data.reply || "")
  },
  {
    name: "motor driver concept",
    message: "what does a motor driver do?",
    expect: ({ data }) => data.items.length <= 4 && /motor driver/i.test(data.reply || "") && /current|voltage|speed|direction/i.test(data.reply || "")
  },
  {
    name: "water level typo detail",
    message: "What is Water Level Sensor Modue?",
    expect: ({ data, names }) =>
      data.items.length === 1 &&
      names[0] &&
      /water level sensor/i.test(names[0]) &&
      /water|tank|level|leak|3\.3V|5V|arduino|esp32/i.test(data.reply || "") &&
      !/I cannot confirm this from the product data/i.test(data.reply || "")
  },
  {
    name: "robot products discovery",
    message: "Do you know any robot products?",
    expect: ({ data }) =>
      data.items.length > 0 &&
      data.items.length <= 8 &&
      data.items.some((item) => item.type === "kit" || /chassis|motor|driver|sensor|controller|arduino|esp32/i.test(`${item.name} ${item.category || ""}`)) &&
      /robot kits|robot-building parts|building robots/i.test(data.reply || "")
  },
  {
    name: "show robot parts",
    message: "Show robot parts",
    expect: ({ data }) =>
      data.items.length > 0 &&
      data.items.length <= 8 &&
      data.items.some((item) => /chassis|motor|driver|sensor|controller|arduino|esp32|robot/i.test(`${item.name} ${item.category || ""}`))
  },
  {
    name: "products to build robot",
    message: "What products can I use to build a robot?",
    expect: ({ data }) => data.items.length > 0 && data.items.length <= 8 && /robot|building/i.test(data.reply || "")
  },
  {
    name: "most expensive product",
    message: "What is the most expensive product in the store?",
    expect: ({ data, names }) =>
      data.items.length === 1 &&
      data.items[0].type === "product" &&
      Number.isFinite(Number(data.items[0].price)) &&
      data.reply.includes(names[0]) &&
      data.reply.includes(`$${Number(data.items[0].price).toFixed(2)}`) &&
      /most expensive/i.test(data.reply || "")
  },
  {
    name: "cheapest robot kit",
    message: "What is the cheapest robot kit?",
    expect: ({ data, names }) =>
      data.items.length === 1 &&
      data.items[0].type === "kit" &&
      Number.isFinite(Number(data.items[0].price)) &&
      data.reply.includes(names[0]) &&
      data.reply.includes(`$${Number(data.items[0].price).toFixed(2)}`) &&
      /cheapest/i.test(data.reply || "")
  },
  {
    name: "sensors in stock",
    message: "Which sensors are in stock?",
    expect: ({ data }) =>
      data.items.length > 0 &&
      data.items.every((item) => item.type === "product" && item.category === "Sensors" && Number(item.stock || 0) > 0) &&
      /stock/i.test(data.reply || "")
  },
  {
    name: "products out of stock",
    message: "What products are out of stock?",
    expect: ({ data }) =>
      data.items.every((item) => item.type === "product" && Number(item.stock || 0) <= 0) &&
      /out of stock|could not find/i.test(data.reply || "")
  },
  {
    name: "category most products",
    message: "Which category has the most products?",
    expect: ({ data }) =>
      data.items.length > 0 &&
      data.items.every((item) => item.type === "product") &&
      /category with the most products/i.test(data.reply || "") &&
      /with \d+ products/i.test(data.reply || "")
  },
  {
    name: "store product count",
    message: "hi how many products in the store?",
    expect: ({ data }) => data.items.length === 0 && /there are \d+ products? in the store/i.test(data.reply || "")
  },
  {
    name: "products do you have count",
    message: "How many products do you have?",
    expect: ({ data }) => data.items.length === 0 && /there are \d+ products? in the store/i.test(data.reply || "")
  },
  {
    name: "robot kit count",
    message: "How many robot kits do you have?",
    expect: ({ data }) => data.items.length === 0 && /there are \d+ robot kits? in the store/i.test(data.reply || "")
  },
  {
    name: "available sensor count",
    message: "How many sensors are available?",
    expect: ({ data }) => data.items.length === 0 && /there are \d+ sensors available in the store/i.test(data.reply || "")
  },
  {
    name: "available 5v sensor count",
    message: "How many 5V sensors are available?",
    expect: ({ data }) => data.items.length === 0 && /there are \d+ 5V sensors available in the store/i.test(data.reply || "")
  },
  {
    name: "category count",
    message: "How many categories are there?",
    expect: ({ data }) => data.items.length === 0 && /there are \d+ product categor(?:y|ies) in the store/i.test(data.reply || "")
  },
  {
    name: "out of stock product count",
    message: "How many products are out of stock?",
    expect: ({ data }) => data.items.length === 0 && /there are \d+ products? out of stock in the store/i.test(data.reply || "")
  },
  {
    name: "store location support",
    message: "Store location",
    expect: ({ data }) => {
      const reply = data.reply || "";
      const hasMapLinkOrMissingAddress = /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/i.test(reply) || /not configured/i.test(reply);

      return data.items.length === 0 && /store location/i.test(reply) && !/delivery fee is/i.test(reply) && hasMapLinkOrMissingAddress && (data.locationLink || /not configured/i.test(reply));
    }
  },
  {
    name: "delivery fee support",
    message: "Delivery fee information",
    expect: ({ data }) => {
      const reply = data.reply || "";
      const hasPickupMapWhenPickupShown = !/Store pickup is available/i.test(reply) || /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/i.test(reply);

      return data.items.length === 0 && /delivery fee/i.test(reply) && /\$1\.50/.test(reply) && /\$2\.50/.test(reply) && hasPickupMapWhenPickupShown;
    }
  },
  {
    name: "beginner products",
    message: "What products are good for beginners?",
    expect: ({ data }) => data.items.length > 0 && data.items.every((item) => item.type === "product") && /beginner/i.test(data.reply || "")
  },
  {
    name: "khmer obstacle avoider",
    message: "ខ្ញុំចង់ធ្វើរ៉ូបូតគេចឧបសគ្គ",
    expect: ({ data, names }) => names.some((name) => name.includes("HC-SR04")) && hasCompactListingReply(data.reply, names)
  },
  {
    name: "khmer line follower",
    message: "ខ្ញុំចង់ធ្វើរ៉ូបូតដើរតាមខ្សែ",
    expect: ({ data, names }) => names.some((name) => name.includes("TCRT5000")) && hasCompactListingReply(data.reply, names)
  },
  {
    name: "khmer cheap sensors",
    message: "តើមានសេនស័រថោកៗទេ?",
    expect: ({ data, names }) => data.items.length > 0 && data.items.every((item) => item.category === "Sensors") && hasCompactListingReply(data.reply, names)
  },
  {
    name: "nonsense",
    message: "asdf banana spaceship",
    expect: ({ data }) => data.items.length === 0 && data.followUps.length > 0
  },
  {
    name: "hc-sr04 detail",
    message: "Tell me about HC-SR04",
    expect: ({ data, names }) => names.some((name) => name.includes("HC-SR04")) && /ultrasonic|distance|obstacle/i.test(data.reply || "")
  },
  {
    name: "tcrt5000 detail",
    message: "What is TCRT5000?",
    expect: ({ data, names }) => names.some((name) => name.includes("TCRT5000")) && /line|reflectance|sensor/i.test(data.reply || "")
  },
  {
    name: "compare arduino esp32",
    message: "Compare Arduino Uno and ESP32",
    expect: ({ data, names }) => names.some((name) => name.includes("Arduino Uno")) && names.some((name) => name.includes("ESP32")) && /compare|vs|arduino|esp32/i.test(data.reply || "")
  },
  {
    name: "pwm education",
    message: "What is PWM?",
    expect: ({ data }) => data.items.length === 0 && /PWM|Pulse Width Modulation/i.test(data.reply || "") && /motor|LED|power|signal/i.test(data.reply || "")
  },
  {
    name: "line follower education",
    message: "How does a line-following robot work?",
    expect: ({ data }) => /line|sensor|controller|motor/i.test(data.reply || "") && hasNoInternalWording(data.reply || "")
  },
  {
    name: "motor driver education",
    message: "Why do I need a motor driver?",
    expect: ({ data }) => /motor driver|current|voltage|controller/i.test(data.reply || "") && hasNoInternalWording(data.reply || "")
  },
  {
    name: "khmer payment question",
    message: "តើខ្ញុំអាចបង់ប្រាក់ដោយ KHQR បានទេ?",
    expect: ({ data }) => data.language === "km" && data.items.length === 0 && hasKhmerText(data.reply) && hasNoInternalWording(data.reply || "")
  },
  {
    name: "mixed mostly english",
    message: "Do you have a cheap sensor ផលិតផល?",
    expect: ({ data }) => data.language === "en" && hasNoInternalWording(data.reply || "")
  },
  {
    name: "mixed mostly khmer",
    message: "ខ្ញុំចង់ទិញ sensor ថោកៗ",
    expect: ({ data }) => data.language === "km" && hasNoInternalWording(data.reply || "")
  },
  {
    name: "translation style",
    message: "How do you say sensor in Khmer?",
    expect: ({ data }) =>
      typeof data.reply === "string" && data.reply.length > 0 && data.followUps.length > 0 && hasNoInternalWording(data.reply || "")
  },
  {
    name: "unclear question",
    message: "Do you like pizza?",
    expect: ({ data }) => data.items.length === 0 && data.followUps.length > 0 && hasNoInternalWording(data.reply || "")
  },
  {
    name: "order status guidance",
    message: "Where is my order?",
    expect: ({ data }) =>
      data.items.length === 0 && /order|account|status|sign in|contact/i.test(data.reply || "") && hasNoInternalWording(data.reply || "")
  },
  {
    name: "return cancel guidance",
    message: "How do I return a product or cancel my order?",
    expect: ({ data }) =>
      data.items.length === 0 && /return|cancel|refund|contact/i.test(data.reply || "") && hasNoInternalWording(data.reply || "")
  }
];

function hasNoListingDescription(reply = "") {
  const text = String(reply || "").toLowerCase();
  return ![
    "standard hc-sr04",
    "ir reflectance sensor",
    "the tcrt5000 reflects",
    "the most popular beginner microcontroller",
    "dual-core wi-fi",
    "acrylic 4-wheel"
  ].some((phrase) => text.includes(phrase));
}

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

function hasAnyTerm(reply = "", terms = []) {
  const text = String(reply || "").toLowerCase();
  return terms.some((term) => text.includes(String(term).toLowerCase()));
}

function hasKhmerText(reply = "") {
  return /[ក-៿]/.test(String(reply || ""));
}

function hasCompactListingReply(reply = "", names = []) {
  const sentences = String(reply || "")
    .split(/[.!?។]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return sentences.length <= 2 && hasNoListingDescription(reply) && hasNoProductNames(reply, names) && hasNoInternalWording(reply);
}

function hasExpectedFollowUps(followUps = []) {
  return (
    Array.isArray(followUps) &&
    followUps.length === EXPECTED_FOLLOW_UPS.length &&
    EXPECTED_FOLLOW_UPS.every((followUp, index) => followUps[index] === followUp)
  );
}

function hasOnlyBuildableItems(items = []) {
  return items.every((item) => Number(item.stock || 0) > 0);
}

function hasStructuredItems(items = []) {
  return items.every((item) => {
    const hasDetailRoute = item.routeUrl && /^\/(?:products|robot-kits)\//.test(item.routeUrl);
    const hasTitle = item.title && item.title === item.name;
    const hasImageWhenExpected = !item.imageUrl || typeof item.imageUrl === "string";

    return hasTitle && hasDetailRoute && hasImageWhenExpected && (item.type === "product" || item.type === "kit");
  });
}

function hasProjectCards(items = []) {
  return items.every((item) => {
    return (
      item.type === "project" &&
      typeof item.title === "string" &&
      item.title.length > 0 &&
      typeof item.slug === "string" &&
      item.slug.length > 0 &&
      typeof item.query === "string" &&
      /^Build /.test(item.query) &&
      !item.routeUrl &&
      !item.price &&
      !item.stock
    );
  });
}

// The /api/chatbot endpoint streams newline-delimited JSON events
// (meta / text / done / error) as text/plain. Rebuild the legacy
// { ok, data: { reply, items, followUps, locationLink, language } } shape
// the assertions below expect.
function parseChatbotStream(body) {
  const data = { reply: "", items: [], followUps: [], locationLink: "", language: "en" };
  let ok = true;

  for (const line of String(body || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let event;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue;
    }

    if (event.type === "meta") {
      data.items = event.items || [];
      data.followUps = event.followUps || [];
      data.locationLink = event.locationLink || "";
      data.language = event.language || "en";
    } else if (event.type === "text") {
      data.reply += event.delta || "";
    } else if (event.type === "done") {
      if (typeof event.cleanedText === "string") {
        data.reply = event.cleanedText;
      }
    } else if (event.type === "error") {
      ok = false;
    }
  }

  data.reply = data.reply.trim();
  return { ok, data };
}

async function postChatbot(message) {
  const response = await fetch(`${BASE_URL}/api/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return parseChatbotStream(await response.text());
}

async function main() {
  const failures = [];
  for (const testCase of cases) {
    const result = await postChatbot(testCase.message);
    const data = result.data || {};
    const names = (data.items || []).map((item) => item.name || item.title || "");
    const hasRawRoute = /\/products\/|\/robot-kits\//.test(data.reply || "");

    if (!result.ok || hasRawRoute || !hasExpectedFollowUps(data.followUps) || !testCase.expect({ data, names })) {
      console.log(`FAIL - ${testCase.name} :: ${data.reply}`);
      failures.push(testCase.name);
      continue;
    }

    console.log(`ok - ${testCase.name}`);
  }
  if (failures.length) {
    throw new Error(`${failures.length} failures: ${failures.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

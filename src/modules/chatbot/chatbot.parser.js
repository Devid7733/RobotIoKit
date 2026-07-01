import { normalizeKhmerQuery } from "@/modules/chatbot/chatbot.language";

const PRODUCT_TERMS = [
  "product",
  "products",
  "part",
  "parts",
  "component",
  "components",
  "board",
  "module",
  "sensor",
  "motor",
  "driver",
  "esp32",
  "arduino",
  "microcontroller",
  "controller",
  "raspberry",
  "l298n",
  "ultrasonic",
  "servo",
  "battery",
  "iot",
  "wifi",
  "bluetooth",
  "lora",
  "gpio",
  "pwm",
  "i2c",
  "spi",
  "uart",
  "stm32",
  "rfid",
  "gps",
  "lcd",
  "flame",
  "rain",
  "soil",
  "sound",
  "ldr",
  "hall",
  "mg996r",
  "bts7960",
  "uln2003",
  "drv8833"
];

const KIT_TERMS = ["kit", "kits", "robot kit", "robot kits"];
const PART_TERMS = ["part", "parts", "component", "components", "module", "sensor", "motor", "driver", "controller", "board", "battery", "wire", "wires", "wiring", "breadboard", "chassis", "wheel", "wheels"];
const COMPATIBILITY_TERMS = ["compatible", "compatibility", "work with", "works with", "use with", "can i use", "support", "supports", "for dc motor", "for motor", "what battery"];
const COMPARISON_TERMS = ["compare", "comparison", " vs ", " versus ", "which is better", "better than", "ល្អជាង"];
const FAQ_TERMS = ["delivery", "shipping", "fee", "payment", "khqr", "order", "checkout", "return", "cancel", "refund", "track", "status"];
const BUDGET_TERMS = ["under", "below", "less than", "above", "over", "more than", "cheaper than", "more expensive than", "cheap", "budget", "affordable", "between", "from"];
const DIFFICULTY_TERMS = ["beginner", "starter", "intermediate", "advanced"];
const COUNT_PATTERNS = [
  /\bhow many\b/i,
  /\bcount\b/i,
  /\btotal\b/i,
  /\bnumber of\b/i
];

const CATEGORY_KEYWORDS = [
  ["sensor", "Sensors"],
  ["ultrasonic", "Sensors"],
  ["ir sensor", "Sensors"],
  ["line tracking", "Sensors"],
  ["gyroscope", "Sensors"],
  ["rfid", "Sensors"],
  ["flame", "Sensors"],
  ["rain", "Sensors"],
  ["soil", "Sensors"],
  ["sound", "Sensors"],
  ["ldr", "Sensors"],
  ["hall", "Sensors"],
  ["bme280", "Sensors"],
  ["bmp280", "Sensors"],
  ["temperature", "Sensors"],
  ["humidity", "Sensors"],
  ["motor driver", "Motors & Drivers"],
  ["bts7960", "Motors & Drivers"],
  ["uln2003", "Motors & Drivers"],
  ["drv8833", "Motors & Drivers"],
  ["mg996r", "Motors & Drivers"],
  ["driver", "Motors & Drivers"],
  ["motor", "Motors & Drivers"],
  ["servo", "Motors & Drivers"],
  ["stepper", "Motors & Drivers"],
  ["controller", "Controllers"],
  ["esp32", "Controllers"],
  ["arduino", "Controllers"],
  ["stm32", "Controllers"],
  ["raspberry pi", "Controllers"],
  ["nodemcu", "Controllers"],
  ["battery", "Power"],
  ["power", "Power"],
  ["charger", "Power"],
  ["buck converter", "Power"],
  ["boost converter", "Power"],
  ["bluetooth", "IoT & Communication"],
  ["wifi", "IoT & Communication"],
  ["lora", "IoT & Communication"],
  ["wireless", "IoT & Communication"],
  ["gsm", "IoT & Communication"],
  ["nrf24", "IoT & Communication"],
  ["gps", "IoT & Communication"],
  ["lcd", "IoT & Communication"],
  ["rfid", "IoT & Communication"],
  ["relay", "IoT & Communication"],
  ["buzzer", "IoT & Communication"],
  ["jumper", "Accessories"],
  ["breadboard", "Accessories"],
  ["wheel", "Accessories"],
  ["chassis", "Accessories"],
  ["oled", "Accessories"],
  ["display", "Accessories"],
  ["bracket", "Accessories"]
];

const PROJECT_KEYWORDS = [
  ["line follower", "line follower"],
  ["line-following", "line follower"],
  ["obstacle avoiding", "obstacle avoiding"],
  ["obstacle avoidance", "obstacle avoiding"],
  ["robot car", "robot car"],
  ["bluetooth robot", "bluetooth robot"],
  ["wifi robot", "wifi robot"],
  ["iot", "iot"],
  ["arm", "robot arm"],
  ["dc motor", "dc motor"],
  ["servo", "servo motor"]
];

const COMPLETE_ROBOT_CAR_PATTERNS = [
  "build a complete robot car",
  "build a robot car",
  "complete robot car",
  "robot car parts",
  "robot car build",
  "robot car components",
  "ធ្វើឡានរ៉ូបូតពេញលេញ",
  "ឡានរ៉ូបូតពេញលេញ"
];

const KIT_ONLY_PATTERNS = [
  "show robot kits only",
  "robot kits only",
  "show kits only",
  "បង្ហាញ robot kits ប៉ុណ្ណោះ"
];

const BOTH_PATTERNS = [
  "kits and parts",
  "kits and components",
  "kit and parts",
  "kit and components",
  "complete kit and parts"
];

const PROJECT_OPTION_PATTERNS = [
  "arduino beginner projects",
  "esp32 iot projects",
  "គម្រោង arduino",
  "គម្រោង esp32"
];

function normalizeVoltageValue(value) {
  return String(value || "")
    .replace(/\s+to\s+/gi, "-")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function includesAny(input, terms) {
  return terms.some((term) => input.includes(term));
}

function collectKeywords(input) {
  const normalized = input.replace(/[^a-z0-9\s-]/g, " ");
  const words = normalized.split(/\s+/).filter((word) => word.length > 2 && !BUDGET_TERMS.includes(word));
  const phrases = [...CATEGORY_KEYWORDS, ...PROJECT_KEYWORDS]
    .map(([phrase]) => phrase)
    .filter((phrase) => input.includes(phrase));

  return [...new Set([...phrases, ...words])].slice(0, 8);
}

function detectCategory(input) {
  const match = CATEGORY_KEYWORDS.find(([keyword]) => input.includes(keyword));
  return match ? match[1] : null;
}

function detectProjectType(input) {
  const match = PROJECT_KEYWORDS.find(([keyword]) => input.includes(keyword));
  return match ? match[1] : null;
}

function detectDifficulty(input) {
  const match = DIFFICULTY_TERMS.find((term) => input.includes(term));
  return match || null;
}

function detectStockFilter(input) {
  if (/\bout of stock\b|\bunavailable\b/.test(input)) {
    return "out_of_stock";
  }

  if (/\bin stock\b|\bavailable\b|\bbuildable\b|\bcan i build\b|\bi can build\b/.test(input)) {
    return "in_stock";
  }

  return "any";
}

function detectMaxPrice(input) {
  const match = input.match(/(?:under|below|less than|cheaper than)\s*\$?\s*(\d+(?:\.\d+)?)/i);

  if (match) {
    return Number(match[1]);
  }

  const khmerMatch = input.match(/(?:ក្រោម|តិចជាង|មិនលើស)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  if (khmerMatch) {
    return Number(khmerMatch[1]);
  }

  const compactMatch = input.match(/\$\s*(\d+(?:\.\d+)?)\s*(?:or less|max|budget)/i);
  return compactMatch ? Number(compactMatch[1]) : null;
}

function detectPriceFilter(input) {
  const range =
    input.match(/\bbetween\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*\$?\s*(\d+(?:\.\d+)?)/i) ||
    input.match(/\bfrom\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*\$?\s*(\d+(?:\.\d+)?)/i) ||
    input.match(/\$?\s*(\d+(?:\.\d+)?)\s*-\s*\$?\s*(\d+(?:\.\d+)?)/i);

  if (range) {
    const first = Number(range[1]);
    const second = Number(range[2]);
    return {
      operator: "between",
      min: Math.min(first, second),
      max: Math.max(first, second),
      reference: null
    };
  }

  const under = input.match(/\b(?:under|below|less than|cheaper than)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  if (under) {
    return {
      operator: "lte",
      min: null,
      max: Number(under[1]),
      reference: null
    };
  }

  const over = input.match(/\b(?:above|over|more than|greater than|more expensive than)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  if (over) {
    return {
      operator: "gte",
      min: Number(over[1]),
      max: null,
      reference: null
    };
  }

  const relative =
    input.match(/\b(?:cheaper than|below the price of|less than|lower than)\s+(.+)$/i) ||
    input.match(/\b(?:more expensive than|above the price of|higher than|greater than)\s+(.+)$/i);

  if (relative && !/^\$?\s*\d/.test(relative[1])) {
    const operator = /\b(?:cheaper than|below the price of|less than|lower than)\b/i.test(input) ? "lt" : "gt";
    return {
      operator,
      min: null,
      max: null,
      reference: relative[1]
        .replace(/\b(products?|items?|ones?|this one|that one)\b/gi, "")
        .trim()
    };
  }

  return null;
}

function detectVoltage(input) {
  const match = input.match(/\b(\d+(?:\.\d+)?\s*v(?:\s*(?:-|\/|to)\s*\d+(?:\.\d+)?\s*v)?)\b/i);
  return match ? normalizeVoltageValue(match[1]) : null;
}

export function parseCatalogQuery(message = "") {
  const input = normalizeKhmerQuery(message).trim().toLowerCase();
  const maxPrice = detectMaxPrice(input);
  const price = detectPriceFilter(input);
  const voltage = detectVoltage(input);
  const difficulty = detectDifficulty(input);
  const projectType = detectProjectType(input);
  const category = detectCategory(input);
  const stock = detectStockFilter(input);
  const keywords = collectKeywords(input);

  const wantsCompleteRobotCar = includesAny(input, COMPLETE_ROBOT_CAR_PATTERNS);
  const wantsKitsOnly = includesAny(input, KIT_ONLY_PATTERNS);
  const wantsProjectOptions = includesAny(input, PROJECT_OPTION_PATTERNS);
  const wantsCategories = /\bcategories\b|\bcategory\b/.test(input);
  const wantsCount = COUNT_PATTERNS.some((pattern) => pattern.test(input));
  const wantsBoth = includesAny(input, BOTH_PATTERNS) || wantsProjectOptions;
  const wantsProduct = includesAny(input, PRODUCT_TERMS) || includesAny(input, PART_TERMS);
  const wantsKit = wantsKitsOnly || includesAny(input, KIT_TERMS) || Boolean(projectType && input.includes("kit"));
  const wantsBudget = maxPrice !== null || price !== null || includesAny(input, ["cheap", "budget", "affordable"]);
  const wantsCompatibility = includesAny(input, COMPATIBILITY_TERMS) || /\bdoes\b.+\bwork\b/.test(input);
  const wantsCompare = includesAny(input, COMPARISON_TERMS);
  const wantsFaq = includesAny(input, FAQ_TERMS);
  const wantsCatalog = wantsProduct || wantsKit || wantsBudget || voltage || difficulty || projectType || category;

  let intent = "unknown";

  if (wantsCount && (wantsProduct || wantsKit || wantsCategories || category || input.includes("store") || stock !== "any")) {
    intent = "catalog_aggregate";
  } else if (wantsCompleteRobotCar) {
    intent = "complete_build";
  } else if (wantsCompare) {
    intent = "compare";
  } else if (wantsCompatibility) {
    intent = "compatibility";
  } else if ((wantsBudget || wantsCategories) && price) {
    intent = "catalog_filter";
  } else if (wantsBudget) {
    intent = "budget_search";
  } else if (wantsKit && !wantsProduct) {
    intent = "kit_search";
  } else if (wantsCatalog) {
    intent = "catalog_search";
  } else if (wantsFaq) {
    intent = "faq";
  }

  let entityType = null;

  if (wantsCategories) {
    entityType = "category";
  } else if (wantsCompleteRobotCar) {
    entityType = "product";
  } else if (wantsKitsOnly) {
    entityType = "kit";
  } else if (wantsBoth) {
    entityType = "both";
  } else if (wantsCompatibility) {
    entityType = "product";
  } else if (wantsProduct && wantsKit) {
    entityType = "both";
  } else if (wantsKit || intent === "kit_search") {
    entityType = "kit";
  } else if (wantsBudget && !wantsProduct) {
    entityType = "both";
  } else if (wantsProduct || voltage || category) {
    entityType = "product";
  } else if (wantsBudget || wantsCompatibility || wantsCompare) {
    entityType = "both";
  }

  const confidenceSignals = [
    intent !== "unknown",
    entityType !== null,
    keywords.length > 0,
    maxPrice !== null,
    voltage !== null,
    difficulty !== null,
    category !== null,
    projectType !== null
  ].filter(Boolean).length;

  return {
    intent,
    entityType,
    keywords,
    filters: {
      maxPrice,
      price,
      voltage,
      difficulty,
      category,
      projectType,
      stock
    },
    confidence: Math.min(1, Number((confidenceSignals / 6).toFixed(2)))
  };
}

export function extractKeywords(message = "") {
  const input = normalizeKhmerQuery(message).trim().toLowerCase();
  return collectKeywords(input);
}

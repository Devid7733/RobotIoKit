import { detectLanguage, localizeFollowUps, normalizeKhmerQuery } from "@/modules/chatbot/chatbot.language";
import { parseCatalogQuery } from "@/modules/chatbot/chatbot.parser";
import { findMatchingRule } from "@/modules/chatbot/chatbot.rules";
import {
  buildAiChatPlan,
  buildSafeCatalogSummary,
  getKnownProjectTypes
} from "@/modules/chatbot/chatbot.ai-planner";
import {
  getClarifyingCatalogFollowUps as getClarifyingCatalogFollowUpsFromResponse,
  getDirectFaqResponse as getDirectFaqResponseFromResponse,
  getEmptyResponse as getEmptyResponseFromResponse,
  getLowConfidenceReply as getLowConfidenceReplyFromResponse,
  localizeMatchedRuleAnswer as localizeMatchedRuleAnswerFromResponse
} from "@/modules/chatbot/chatbot.response";
import { isInShopScope as isInShopScopeFromScope } from "@/modules/chatbot/chatbot.scope";
import { detectNewsIntent, getNewsResponse } from "@/modules/chatbot/chatbot.news";
import {
  buildGroundedOllamaPrompt as buildCatalogGroundedOllamaPrompt,
  buildFallbackMetadataForItem,
  detectProjectTypes,
  getCatalogMatchReason,
  normalizeQuery,
  shouldIncludeProductDescriptions
} from "@/modules/chatbot/chatbot.catalog";
import {
  executeChatbotRecommendationPlan,
  findDeterministicCatalogRecommendations,
  recommendationGroupMatches
} from "@/modules/chatbot/chatbot.recommender";
import { listStorefrontProducts, scoreCompatibleProduct } from "@/services/productService";
import { listStorefrontRobotKits } from "@/services/robotKitService";
import { formatDeliveryFeeText, getPublicStoreSupportSettings } from "@/services/storeSupportService";

const STOP_WORDS = new Set([
  "about",
  "does",
  "find",
  "have",
  "need",
  "please",
  "show",
  "suggest",
  "that",
  "this",
  "what",
  "which",
  "with",
  "work",
  "works",
  "would",
  "looking",
  "some",
  "thing",
  "stuff",
  "under",
  "below",
  "less",
  "than",
  "products",
  "product",
  "robot",
  "robots",
  "kits",
  "kit",
  "search",
  "cheap",
  "budget"
]);

const PROJECT_GUIDANCE = {
  "dc motor": {
    reply:
      "For a DC motor project, you usually need a motor driver because microcontrollers cannot safely drive motors directly. Add a suitable battery or power supply for the motor voltage.",
    replyKm:
      "សម្រាប់គម្រោង DC motor អ្នកត្រូវការ motor driver ព្រោះ microcontroller មិនអាចបើកម៉ូទ័រដោយផ្ទាល់បានសុវត្ថិភាពទេ។ គួរបន្ថែមថ្ម ឬ power supply ដែលត្រូវនឹងវ៉ុលរបស់ម៉ូទ័រ។",
    keywords: ["motor driver", "l298n", "dc motor", "battery"],
    followUps: ["Show motor drivers", "Show batteries", "Beginner robot car"]
  },
  "servo motor": {
    reply:
      "Servo projects usually need a controller signal plus stable external power when the servo draws more current than a board can provide.",
    replyKm:
      "គម្រោង servo ត្រូវការសញ្ញាពី controller និងថាមពលខាងក្រៅដែលមានស្ថេរភាព ប្រសិនបើ servo ប្រើចរន្តច្រើនជាង board អាចផ្គត់ផ្គង់បាន។",
    keywords: ["servo", "controller", "arduino", "esp32"],
    followUps: ["Show controllers", "Show beginner kits", "Compare options"]
  },
  "line follower": {
    reply:
      "For a line follower robot, look for IR sensors, a motor driver, a chassis, motors, wheels, and a controller such as Arduino or ESP32.",
    replyKm:
      "សម្រាប់ line follower robot អ្នកគួរមើល IR sensors, motor driver, chassis, motors, wheels និង controller ដូចជា Arduino ឬ ESP32។",
    keywords: ["line follower", "ir sensor", "motor driver", "chassis", "controller"],
    followUps: ["Show kits", "Show parts", "Beginner only"]
  },
  "obstacle avoiding": {
    reply:
      "For obstacle avoiding robots, an ultrasonic sensor detects distance while a controller and motor driver steer the chassis.",
    replyKm:
      "សម្រាប់រ៉ូបូតជៀសឧបសគ្គ ultrasonic sensor ជួយវាស់ចម្ងាយ ខណៈ controller និង motor driver ជួយបញ្ជា chassis។",
    keywords: ["obstacle", "ultrasonic", "motor driver", "robot car", "controller"],
    followUps: ["Show kits", "Show ultrasonic sensors", "Robot under $30"]
  },
  "bluetooth robot": {
    reply:
      "A Bluetooth robot car usually combines a Bluetooth module, controller, motor driver, motors, chassis, and battery.",
    replyKm: "ឡានរ៉ូបូត Bluetooth ជាទូទៅត្រូវការ Bluetooth module, controller, motor driver, motors, chassis និងថ្ម។",
    keywords: ["bluetooth", "controller", "motor driver", "robot car"],
    followUps: ["Show kits", "Show parts", "Check compatibility"]
  },
  "wifi robot": {
    reply:
      "For a WiFi robot, ESP32 is a strong controller choice because WiFi is built in and it works well with common sensors and motor drivers.",
    replyKm:
      "សម្រាប់ WiFi robot, ESP32 ជាជម្រើស controller ល្អ ព្រោះមាន WiFi ស្រាប់ និងប្រើបានល្អជាមួយ sensors និង motor drivers ទូទៅ។",
    keywords: ["wifi", "esp32", "motor driver", "robot car"],
    followUps: ["Find ESP32 products", "Show kits", "Compare Arduino and ESP32"]
  }
};

const PRODUCT_DETAIL_TERMS = [
  "explain",
  "what is",
  "tell me about",
  "used for",
  "use for",
  "good for",
  "compatible",
  "compatibility",
  "can i use",
  "can it work",
  "work with",
  "works with",
  "compare",
  "difference",
  "which is better",
  "better than",
  "ល្អជាង",
  "ពន្យល់",
  "ប្រើធ្វើអ្វី",
  "ប្រើសម្រាប់អ្វី",
  "ប្រើជាមួយ",
  "ប្រៀបធៀប",
  "compatible"
];

const DIRECT_FACT_TERMS = [
  "compatible",
  "compatibility",
  "can i use",
  "can it work",
  "work with",
  "works with",
  "price",
  "stock",
  "available",
  "voltage",
  "ប៉ុន្មាន",
  "មានទេ",
  "បានទេ",
  "វ៉ុល"
];

const CATALOG_ALIAS_RULES = [
  { term: "hc sr04", targets: ["hc-sr04", "hc sr04", "ultrasonic"] },
  { term: "hc-sr04", targets: ["hc-sr04", "hc sr04", "ultrasonic"] },
  { term: "ultrasonic", targets: ["hc-sr04", "ultrasonic"] },
  { term: "ultrasnic", targets: ["hc-sr04", "ultrasonic"] },
  { term: "ardu in", targets: ["arduino uno", "arduino uno r3"], prefer: ["arduino uno", "arduino uno r3"] },
  { term: "arduin", targets: ["arduino uno", "arduino uno r3"], prefer: ["arduino uno", "arduino uno r3"] },
  { term: "arduino", targets: ["arduino uno", "arduino uno r3"], prefer: ["arduino uno", "arduino uno r3"] },
  { term: "esp 32", targets: ["esp32"], prefer: ["esp32 dev board", "esp32"] },
  { term: "esp32", targets: ["esp32"] },
  { term: "motor driver", targets: ["l298n", "l293d", "tb6612", "motor driver"] },
  { term: "controller", targets: ["arduino uno", "esp32"], prefer: ["arduino uno", "esp32"] },
  { term: "controller board", targets: ["arduino uno", "esp32"], prefer: ["arduino uno", "esp32"] }
];

const EXACT_CATALOG_PHRASES = ["arduino uno", "esp32", "hc sr04", "tcrt5000", "l298n", "l293d", "tb6612"];

const CONCEPT_EXPLANATIONS = {
  sensor:
    "A sensor helps a robot detect information from the environment, such as distance, light, temperature, humidity, water level, or obstacles. Robots use sensors to decide how to move or react.",
  controller:
    "A controller is the brain of a robot. It reads sensor signals, runs your program, and sends commands to motors, lights, displays, or other modules.",
  "motor driver":
    "A motor driver lets a low-power controller safely run motors that need more current or a different voltage. It also helps control motor direction and speed.",
  motor:
    "A motor turns electrical power into motion. Robots use motors to drive wheels, move arms, spin mechanisms, or create controlled movement.",
  servo:
    "A servo is a motor with position control. It is useful when a robot needs to turn to a specific angle, such as steering, pan-tilt mounts, or small robot arms.",
  "robot kit":
    "A robot kit bundles parts for a complete or guided robot build. Kits are useful when you want matched components and a clearer build path.",
  battery:
    "A battery powers a robot when it is not connected by USB or a wall adapter. The important details are voltage, capacity, current output, and safe charging.",
  "power module":
    "A power module regulates or converts voltage so boards, sensors, and motors receive the level they need. It helps keep robot electronics stable and safer.",
  "communication module":
    "A communication module lets a robot send or receive data wirelessly or over a wired interface. Common uses include Bluetooth control, WiFi IoT data, GPS, LoRa, or remote commands.",
  display:
    "A display shows information from a robot, such as sensor readings, status, menus, or debugging messages. Small OLED and LCD displays are common in Arduino and ESP32 projects."
};

const CONCEPT_CARD_QUERIES = {
  sensor: "robot sensor ultrasonic line tracking water level temperature",
  controller: "arduino esp32 controller board",
  "motor driver": "motor driver l298n tb6612 drv8833",
  motor: "dc motor servo robot motor",
  servo: "servo motor pan tilt bracket",
  "robot kit": "robot kit robot car beginner",
  battery: "battery holder power robot",
  "power module": "power module regulator converter battery",
  "communication module": "bluetooth wifi lora wireless module",
  display: "oled lcd display"
};

const ROBOT_DISCOVERY_QUERY = "robot kit robot car chassis motor driver dc motor wheel ultrasonic line tracking arduino esp32 controller battery";

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function normalizeProductMention(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeVoltageText(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+TO\s+/g, "-")
    .replace(/\s+/g, "");
}

function getImageUrl(item, type) {
  return type === "kit" ? item.image || null : item.imageUrl || item.image || null;
}

function getRouteUrl(item, type) {
  if (!item?.slug) {
    return type === "kit" ? `/robot-kits/${item?.id}` : `/products/${item?.id}`;
  }

  return type === "kit" ? `/robot-kits/${item.slug}` : `/products/${item.slug}`;
}

function getSearchableText(item) {
  const specText = Array.isArray(item.specifications)
    ? item.specifications.map((spec) => `${spec?.label || ""} ${spec?.value || ""}`).join(" ")
    : "";
  const listText = [...(Array.isArray(item.features) ? item.features : []), ...(Array.isArray(item.compatibility) ? item.compatibility : [])].join(" ");
  const voltageText = Array.isArray(item.voltages) ? item.voltages.join(" ") : item.voltage;

  return normalizeText([item.name, item.description, item.overview, item.category, item.level, voltageText, specText, listText].join(" "));
}

function getProductVoltages(item) {
  return Array.isArray(item?.voltages) && item.voltages.length ? item.voltages : item?.voltage ? [item.voltage] : [];
}

function formatList(items) {
  const values = [...new Set(items.filter(Boolean))];

  if (values.length <= 1) {
    return values[0] || "";
  }

  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function getSharedVoltages(firstItem, secondItem) {
  const firstVoltages = getProductVoltages(firstItem);
  const secondVoltages = getProductVoltages(secondItem);
  return secondVoltages.filter((voltage) => firstVoltages.includes(voltage));
}

function getEffectiveKeywords(parsedQuery, compatibilityKeywords = []) {
  return [...new Set([...(parsedQuery.keywords || []), ...compatibilityKeywords])]
    .map((keyword) => normalizeText(keyword).trim())
    .filter((keyword) => keyword && !STOP_WORDS.has(keyword) && keyword.length > 1);
}

function voltageMatches(item, requestedVoltage) {
  const itemVoltages = Array.isArray(item?.voltages) && item.voltages.length ? item.voltages : item?.voltage ? [item.voltage] : [];

  if (!itemVoltages.length || !requestedVoltage) {
    return false;
  }

  const normalizedRequest = normalizeVoltageText(requestedVoltage);
  return itemVoltages.some((itemVoltage) => normalizeVoltageText(itemVoltage) === normalizedRequest);
}

function priceIsWithinBudget(item, maxPrice) {
  return maxPrice === null || Number(item.price || 0) <= maxPrice;
}

function getCatalogStock(item, type) {
  if (type === "kit") {
    return Number(item.stockQuantity ?? item.stock ?? 0);
  }

  return item.stock === undefined || item.stock === null ? null : Number(item.stock);
}

function isCatalogItemBuildable(item, type) {
  return Number(getCatalogStock(item, type) || 0) > 0;
}

function shouldRequireBuildableStock(parsedQuery = {}) {
  return (parsedQuery.filters?.stock || "any") !== "out_of_stock";
}

function logChatbotServiceEvent(event, details = {}) {
  console.info(`[chatbot] ${event}`, details);
}

function getAvailabilityText(item, type, language = "en") {
  const stock = getCatalogStock(item, type);

  if (stock === null) {
    return language === "km" ? "សូមពិនិត្យលទ្ធភាពទំនិញនៅទំព័រផលិតផល។" : "Check the product page for current availability.";
  }

  return stock > 0
    ? language === "km"
      ? `មានក្នុងស្តុក ${stock}`
      : `In stock: ${stock}`
    : language === "km"
      ? "អស់ពីស្តុកឥឡូវនេះ"
      : "Out of stock right now";
}

function getSupportInfo(item, type) {
  if (type === "kit") {
    return item.level ? `Skill level: ${item.level}` : null;
  }

  const voltages = getProductVoltages(item);
  return voltages.length ? `Voltage: ${voltages.join(", ")}` : null;
}

function formatSpecifications(specifications) {
  if (!Array.isArray(specifications)) {
    return [];
  }

  return specifications
    .map((spec) => `${spec?.label || ""}: ${spec?.value || ""}`.trim())
    .filter((spec) => spec !== ":")
    .slice(0, 4);
}

function getReasonText(reasonCodes, type, language = "en") {
  if (language === "km") {
    const reasonMap = {
      exactName: "ត្រូវនឹងអ្វីដែលអ្នកសួរ",
      keywordName: "ឈ្មោះត្រូវនឹងសំណើរបស់អ្នក",
      category: "ប្រភេទត្រូវនឹងសំណើរបស់អ្នក",
      projectType: "សាកសមនឹងគម្រោងដែលអ្នកចង់ធ្វើ",
      beginner: "សាកសមសម្រាប់អ្នកចាប់ផ្តើម",
      budget: "ត្រូវនឹងថវិការបស់អ្នក",
      stock: "មានក្នុងស្តុក",
      voltage: "វ៉ុលត្រូវនឹងសំណើរបស់អ្នក",
      description: "ពណ៌នា ឬលក្ខណៈបច្ចេកទេសត្រូវនឹងសំណើ",
      featured: "ជាផលិតផលណែនាំ",
      dcMotor: "មានប្រយោជន៍សម្រាប់គ្រប់គ្រង DC motor",
      controller: "ប្រើញឹកញាប់ជាមួយ ESP32/Arduino"
    };
    const reasons = [...new Set(reasonCodes)].map((code) => reasonMap[code]).filter(Boolean);
    return reasons.length
      ? `ណែនាំ ព្រោះ${reasons.slice(0, 3).join(", ")}។`
      : type === "kit"
        ? "ណែនាំ ព្រោះវាសាកសមសម្រាប់គម្រោងរ៉ូបូត។"
        : "ណែនាំ ព្រោះវាសាកសមសម្រាប់តម្រូវការទិញគ្រឿងរ៉ូបូត។";
  }

  const reasonMap = {
    exactName: "Exact match for what you asked for",
    keywordName: "Name matches your request",
    category: "Category matches your request",
    projectType: "Related to your requested project type",
    beginner: "Suitable for beginner projects",
    budget: "Matches your budget",
    stock: "In stock",
    voltage: "Voltage matches your request",
    description: "Description or specs match your request",
    featured: "Featured catalog item",
    dcMotor: "Useful for DC motor control",
    controller: "Commonly used with ESP32/Arduino projects"
  };
  const reasons = [...new Set(reasonCodes)].map((code) => reasonMap[code]).filter(Boolean);

  if (!reasons.length) {
    return type === "kit" ? "Recommended because it is relevant to robotics projects." : "Recommended because it matches robotics shopping needs.";
  }

  return `Recommended because ${reasons.slice(0, 3).join(", ").replace(/, ([^,]*)$/, " and $1").toLowerCase()}.`;
}

function getVoltageExplanation(item, { baseProduct = null, parsedQuery = null, language = "en" } = {}) {
  const voltages = getProductVoltages(item);
  const sharedVoltages = baseProduct ? getSharedVoltages(baseProduct, item) : [];
  const queryVoltage = parsedQuery?.filters?.voltage;
  const text = getSearchableText(item);
  const isKhmer = language === "km";

  if (baseProduct && sharedVoltages.length) {
    const baseText = getSearchableText(baseProduct);

    if (baseText.includes("esp32") && sharedVoltages.includes("3.3V")) {
      return isKhmer ? "វ៉ុលរបស់វាសមស្របជាមួយ ESP32។" : "Compatible with ESP32 voltage levels.";
    }

    if (baseText.includes("arduino") && sharedVoltages.includes("5V")) {
      return isKhmer ? "សាកសមសម្រាប់គម្រោង Arduino 5V។" : "Suitable for Arduino 5V projects.";
    }

    return isKhmer
      ? `មានវ៉ុល ${sharedVoltages.join(", ")} ត្រូវគ្នាជាមួយ ${baseProduct.name}។`
      : `Shares ${formatList(sharedVoltages)} compatibility with ${baseProduct.name}.`;
  }

  if (queryVoltage && voltageMatches(item, queryVoltage)) {
    return isKhmer ? `ត្រូវនឹងតម្រូវការវ៉ុល ${queryVoltage} របស់អ្នក។` : `Matches your ${queryVoltage} voltage requirement.`;
  }

  if (voltages.includes("3.3V") && voltages.includes("5V")) {
    return isKhmer ? "គាំទ្រប្រព័ន្ធ 3.3V និង 5V។" : "Supports both 3.3V and 5V systems.";
  }

  if (text.includes("esp32") && voltages.includes("3.3V")) {
    return isKhmer ? "វ៉ុលរបស់វាសមស្របជាមួយ ESP32។" : "Compatible with ESP32 voltage levels.";
  }

  if (text.includes("arduino") && voltages.includes("5V")) {
    return isKhmer ? "សាកសមសម្រាប់គម្រោង Arduino 5V។" : "Suitable for Arduino 5V projects.";
  }

  return null;
}

function getProjectExplanation(item, parsedQuery = null, language = "en") {
  const text = getSearchableText(item);
  const nameText = normalizeText(item.name);
  const primaryText = normalizeText([item.name, item.description].join(" "));
  const projectType = normalizeText(parsedQuery?.filters?.projectType);
  const keywords = (parsedQuery?.keywords || []).map(normalizeText);
  const queryText = [...keywords, projectType].join(" ");
  const isKhmer = language === "km";

  if (nameText.includes("chassis") || nameText.includes("wheel")) {
    return isKhmer
      ? "ប្រើជាគ្រោងមេកានិចសម្រាប់ឡានរ៉ូបូតជៀសឧបសគ្គ និង Line Following។"
      : "Commonly used as the mechanical base for obstacle avoidance and line-following cars.";
  }

  if (nameText.includes("ultrasonic") || nameText.includes("hc-sr04")) {
    return isKhmer
      ? "ប្រើសម្រាប់រកឧបសគ្គ និងវាស់ចម្ងាយក្នុងឡានរ៉ូបូត។"
      : "Used for obstacle avoidance and distance sensing in robot cars.";
  }

  if (nameText.includes("line tracking") || nameText.includes("tcrt5000") || nameText.includes("ir sensor")) {
    return isKhmer
      ? "សាកសមសម្រាប់ Line Following Robot ដើម្បីចាប់សញ្ញាផ្ទៃខ្មៅ និងស។"
      : "Useful for line-following robots that need to detect dark and light surfaces.";
  }

  if (nameText.includes("l298n") || nameText.includes("tb6612") || nameText.includes("drv8833") || nameText.includes("motor driver")) {
    return isKhmer
      ? "ប្រើសម្រាប់បញ្ជា DC Motor ដែលជាទូទៅប្រើក្នុងឡានរ៉ូបូត 2WD និង 4WD។"
      : "Controls DC motors commonly used in 2WD and 4WD robot cars.";
  }

  if (nameText.includes("tt motor") || nameText.includes("gear motor")) {
    return isKhmer
      ? "ប្រើជាមួយកង់ និង chassis ទូទៅសម្រាប់ប្រព័ន្ធបើកបរឡានរ៉ូបូត។"
      : "Pairs with common robot wheels and chassis kits for robot-car drivetrains.";
  }

  if (primaryText.includes("servo")) {
    return isKhmer
      ? "មានប្រយោជន៍ពេលគម្រោងត្រូវការចលនាបញ្ជា ការបត់ ឬការដំឡើង sensor។"
      : "Useful when a robotics project needs controlled movement, steering, or sensor mounting.";
  }

  if (primaryText.includes("oled") || primaryText.includes("lcd") || primaryText.includes("wifi") || primaryText.includes("bluetooth") || primaryText.includes("lora")) {
    return isKhmer
      ? "ល្អសម្រាប់គម្រោង IoT robotics ដែលត្រូវការអេក្រង់ ឬការទំនាក់ទំនងឥតខ្សែ។"
      : "Good for IoT robotics projects that need display or wireless communication.";
  }

  if (queryText.includes("line follower") && text.includes("line follower")) {
    return isKhmer
      ? "មានប្រយោជន៍សម្រាប់ Line Following Robot ដែលត្រូវការ sensor, controller និងប្រព័ន្ធបើកបរតូច។"
      : "Useful for line-following robots that need sensing, control, and a small drivetrain.";
  }

  return null;
}

function getCategoryExplanation(item, { baseProduct = null, language = "en" } = {}) {
  const category = item.category || "";
  const baseCategory = baseProduct?.category || "";
  const text = getSearchableText(item);
  const isKhmer = language === "km";

  if (category === "Controllers") {
    if (text.includes("arduino") || text.includes("esp32")) {
      return isKhmer ? "Board នេះគេប្រើញឹកញាប់ក្នុងគម្រោងរ៉ូបូតសម្រាប់អ្នកចាប់ផ្តើម។" : "This board is commonly used in beginner robotics projects.";
    }

    return isKhmer
      ? "Controller នេះអាចទំនាក់ទំនងជាមួយ sensor, module និង motor driver។"
      : "This controller can communicate with sensors, modules, and motor drivers.";
  }

  if (category === "Sensors") {
    if (text.includes("dht") || text.includes("soil") || text.includes("gas")) {
      return isKhmer
        ? "Sensor នេះអាចប្រើជាមួយគម្រោងតាមដានទិន្នន័យ Arduino និង ESP32 បាន។"
        : "This sensor works with common Arduino and ESP32 monitoring projects.";
    }

    return isKhmer ? "Sensor នេះផ្ញើទិន្នន័យពីពិភពពិតទៅ controller បាន។" : "This sensor can send real-world readings to a controller.";
  }

  if (category === "Motors & Drivers") {
    if (text.includes("motor driver") || text.includes("l298n")) {
      return isKhmer
        ? "Motor driver នេះអាចបញ្ជា motor ដែល controller មិនអាចផ្គត់ផ្គង់ថាមពលដោយផ្ទាល់បាន។"
        : "This motor driver can control motors that a controller cannot power directly.";
    }

    return isKhmer ? "Motor ទាំងនេះសាកសមជាមួយ chassis រ៉ូបូតទូទៅ។" : "These motors are compatible with common robot chassis builds.";
  }

  if (category === "Power") {
    return isKhmer
      ? "ផ្នែក power នេះជួយផ្គត់ផ្គង់ថាមពលឱ្យមានស្ថេរភាពសម្រាប់ controller, motor ឬ module។"
      : "This power part helps provide stable power for controllers, motors, or modules.";
  }

  if (category === "Accessories") {
    if (text.includes("jumper")) {
      return isKhmer ? "Jumper wires ចាំបាច់សម្រាប់ភ្ជាប់ sensor ជាមួយ controller។" : "Jumper wires are needed to connect sensors and controllers.";
    }

    if (text.includes("breadboard")) {
      return isKhmer
        ? "Breadboard មានប្រយោជន៍សម្រាប់សាកល្បងសៀគ្វីរ៉ូបូតមុនពេល solder។"
        : "Breadboards are useful for prototyping robotics circuits before soldering.";
    }

    if (text.includes("chassis") || text.includes("wheel")) {
      return isKhmer
        ? "គ្រឿងបន្លាស់នេះជួយបង្កើត electronics ឱ្យក្លាយជាឡានរ៉ូបូតពេញលេញ។"
        : "This accessory helps turn electronics into a complete robot-car build.";
    }

    return isKhmer
      ? "គ្រឿងបន្លាស់នេះជួយការភ្ជាប់ខ្សែ ការដំឡើង ឬការប្រមូលផ្តុំគម្រោងរ៉ូបូត។"
      : "This accessory helps with wiring, mounting, or assembling robotics projects.";
  }

  if (category === "IoT & Communication" || baseCategory === "IoT & Communication") {
    return isKhmer
      ? "Module នេះជួយឱ្យគម្រោងរ៉ូបូតបង្ហាញទិន្នន័យ ទំនាក់ទំនង ឬភ្ជាប់ឥតខ្សែ។"
      : "This module helps robotics projects communicate, display data, or connect wirelessly.";
  }

  return null;
}

function getCompatibilityExplanation(item, { baseProduct = null, parsedQuery = null, compatibilityReasons = [], language = "en" } = {}) {
  const candidates = [
    getProjectExplanation(item, parsedQuery, language),
    getVoltageExplanation(item, { baseProduct, parsedQuery, language }),
    getCategoryExplanation(item, { baseProduct, language })
  ].filter(Boolean);

  const explanation = candidates[0] || getReasonText(compatibilityReasons, item.type || "product", language);
  const secondSentence = candidates.find((candidate) => candidate !== explanation && candidate.length < 95);

  return secondSentence && explanation.length < 95 ? `${explanation} ${secondSentence}` : explanation;
}

function getReasonLabel(code, language = "en") {
  const englishLabels = {
    voltage: "Voltage match",
    category: "Category fit",
    projectType: "Project fit",
    dcMotor: "Motor control",
    controller: "Arduino/ESP32",
    budget: "Budget fit",
    stock: "In stock",
    exactName: "Name match",
    keywordName: "Keyword match",
    description: "Spec match",
    featured: "Featured",
    "Same voltage": "Same voltage",
    "Works with controllers": "Works with controllers",
    "Robot car build": "Robot car build",
    "Line follower build": "Line follower build",
    "Arduino build": "Arduino build",
    "ESP32 build": "ESP32 build",
    "Motor drive pair": "Motor drive pair",
    "Robot drivetrain": "Robot drivetrain",
    "Servo project": "Servo project",
    "Power pairing": "Power pairing",
    "Useful accessory": "Useful accessory",
    "Similar function": "Similar function",
    "Compatible category": "Compatible category",
    "Motor build": "Motor build"
  };
  const khmerLabels = {
    voltage: "វ៉ុលត្រូវគ្នា",
    category: "ប្រភេទឧបករណ៍សមស្រប",
    projectType: "សមស្របនឹងគម្រោង",
    dcMotor: "បញ្ជា DC Motor",
    controller: "ប្រើជាមួយ Arduino/ESP32",
    budget: "ត្រូវនឹងថវិកា",
    stock: "មានក្នុងស្តុក",
    exactName: "ត្រូវនឹងឈ្មោះ",
    keywordName: "ត្រូវនឹងពាក្យស្វែងរក",
    description: "លក្ខណៈសម្បត្តិត្រូវគ្នា",
    featured: "ផលិតផលណែនាំ",
    "Same voltage": "វ៉ុលត្រូវគ្នា",
    "Works with controllers": "ប្រើជាមួយ controller",
    "Robot car build": "សម្រាប់បង្កើតឡានរ៉ូបូត",
    "Line follower build": "សម្រាប់ Line Following Robot",
    "Arduino build": "សម្រាប់គម្រោង Arduino",
    "ESP32 build": "សម្រាប់គម្រោង ESP32",
    "Motor drive pair": "គូសម្រាប់បញ្ជា motor",
    "Robot drivetrain": "ប្រព័ន្ធបើកបររ៉ូបូត",
    "Servo project": "សម្រាប់គម្រោង servo",
    "Power pairing": "ផ្គូផ្គង power",
    "Useful accessory": "គ្រឿងបន្លាស់ចាំបាច់",
    "Similar function": "មុខងារស្រដៀងគ្នា",
    "Compatible category": "ប្រភេទឧបករណ៍សមស្រប",
    "Motor build": "សម្រាប់ប្រព័ន្ធ motor"
  };

  return language === "km" ? khmerLabels[code] || englishLabels[code] || code : englishLabels[code] || code;
}

function getReasonLabels(reasonCodes = [], item = null, language = "en") {
  const labels = [...new Set(reasonCodes)]
    .map((code) => getReasonLabel(code, language))
    .filter(Boolean);

  const accessoryLabel = getReasonLabel("Useful accessory", language);

  if (item?.category === "Accessories" && !labels.includes(accessoryLabel)) {
    labels.push(accessoryLabel);
  }

  return labels.slice(0, 3);
}

function getProjectCompatibilityTerms(projectType) {
  const normalizedProjectType = normalizeText(projectType);

  if (normalizedProjectType === "line follower") {
    return ["line tracking", "tcrt5000", "ir sensor", "motor driver", "chassis", "wheel", "tt motor", "arduino", "esp32", "jumper"];
  }

  if (normalizedProjectType === "robot car" || normalizedProjectType === "obstacle avoiding") {
    return ["chassis", "wheel", "motor driver", "l298n", "tb6612", "tt motor", "battery", "holder", "arduino", "esp32", "ultrasonic"];
  }

  return [];
}

const CORE_BUILD_GROUPS = [
  {
    group: "Controller",
    missing: "Controller",
    matcher: isRobotCarController,
    prefer: ["arduino uno", "esp32", "microcontroller", "controller board", "beginner"]
  },
  {
    group: "Motor Driver",
    missing: "Motor Driver",
    matcher: isRobotCarMotorDriver,
    prefer: ["l298n", "tb6612", "l293d", "h-bridge", "motor driver", "beginner"]
  },
  {
    group: "Motors",
    missing: "Motors",
    matcher: isRobotCarMotor,
    prefer: ["tt dc motor", "tt", "dc gear motor", "geared motor", "bo motor"]
  },
  {
    group: "Chassis",
    missing: "Chassis",
    matcher: isRobotCarChassis,
    prefer: ["2wd", "4wd", "car"]
  },
  {
    group: "Wheels",
    missing: "Wheels",
    matcher: isRobotCarWheel,
    prefer: ["wheel", "pair"]
  },
  {
    group: "Power",
    missing: "Power",
    matcher: isRobotCarPower,
    prefer: ["battery holder", "battery pack", "18650 holder", "li-ion battery holder"],
    fallbackOnly: isRobotCarPowerFallback
  },
  {
    group: "Wiring/Prototyping",
    missing: "Wiring/Prototyping",
    matcher: isRobotCarWiring,
    prefer: ["jumper", "breadboard"]
  }
];

// Voltage-sensitive roles that must actually agree on a supply voltage —
// Chassis/Wheels/Wiring/Sensor don't participate in the power rail.
const VOLTAGE_SENSITIVE_BUILD_GROUPS = ["Controller", "Motor Driver", "Motors", "Power"];

const BUILD_GROUPS_BY_PROJECT_TYPE = {
  "robot car": [
    ...CORE_BUILD_GROUPS,
    {
      group: "Optional Sensor",
      missing: "Optional Sensor",
      matcher: isRobotCarOptionalSensor,
      prefer: ["ultrasonic", "hc-sr04", "ir sensor"]
    }
  ],
  "obstacle avoiding": [
    ...CORE_BUILD_GROUPS,
    {
      group: "Obstacle Sensor",
      missing: "Obstacle Sensor",
      matcher: isRobotCarOptionalSensor,
      prefer: ["ultrasonic", "hc-sr04", "ir sensor"]
    }
  ],
  "line follower": [
    ...CORE_BUILD_GROUPS,
    {
      group: "Line Sensor",
      missing: "Line Sensor",
      matcher: isLineFollowerSensor,
      prefer: ["tcrt5000", "line tracking", "line sensor"]
    }
  ]
};

const BUILD_SET_LABEL_TEXT = {
  "robot car": {
    en: "Here is a complete robot car build set using real catalog items, preferring in-stock products.",
    km: "នេះជាបញ្ជីគ្រឿងបន្លាស់ពេញលេញសម្រាប់ធ្វើឡានរ៉ូបូត ដោយប្រើទំនិញពិតក្នុង catalog និងផ្តល់អាទិភាពដល់ទំនិញមានក្នុងស្តុក។",
    label: "complete robot car build set"
  },
  "line follower": {
    en: "Here is a complete line-following robot build set using real catalog items, preferring in-stock products.",
    km: "នេះជាបញ្ជីគ្រឿងបន្លាស់ពេញលេញសម្រាប់ធ្វើឡានតាមបន្ទាត់ ដោយប្រើទំនិញពិតក្នុង catalog និងផ្តល់អាទិភាពដល់ទំនិញមានក្នុងស្តុក។",
    label: "complete line-following robot build set"
  },
  "obstacle avoiding": {
    en: "Here is a complete obstacle-avoiding robot build set using real catalog items, preferring in-stock products.",
    km: "នេះជាបញ្ជីគ្រឿងបន្លាស់ពេញលេញសម្រាប់ធ្វើឡានចៀសវាងរបាំង ដោយប្រើទំនិញពិតក្នុង catalog និងផ្តល់អាទិភាពដល់ទំនិញមានក្នុងស្តុក។",
    label: "complete obstacle-avoiding robot build set"
  }
};

const ROBOT_PROJECT_CARD_DEFINITIONS = [
  {
    title: "Line-Following Robot",
    slug: "line-following-robot",
    query: "Build a line-following robot",
    projectTypes: ["line_follower"]
  },
  {
    title: "Obstacle-Avoiding Robot",
    slug: "obstacle-avoiding-robot",
    query: "Build an obstacle-avoiding robot",
    projectTypes: ["obstacle_avoider"]
  },
  {
    title: "Bluetooth Robot Car",
    slug: "bluetooth-robot-car",
    query: "Build a Bluetooth robot car",
    projectTypes: ["wireless_control", "robot_car"]
  }
];

function includesAnyTerm(text, terms = []) {
  return terms.some((term) => text.includes(term));
}

function getRobotCarRoleText(product) {
  return normalizeText([product.name, product.category, product.description, product.overview].join(" "));
}

function getRobotCarNameText(product) {
  return normalizeText(product.name);
}

function isRobotCarController(product) {
  const text = getRobotCarRoleText(product);

  return (
    includesAnyTerm(text, ["arduino", "arduino uno", "esp32", "microcontroller", "controller board"]) &&
    !includesAnyTerm(text, ["sensor", "motor", "wheel", "tire", "tyre", "chassis", "power module", "battery", "charger"])
  );
}

function isRobotCarMotorDriver(product) {
  const text = getRobotCarRoleText(product);
  const name = getRobotCarNameText(product);
  const hasDriverTerm = includesAnyTerm(text, ["l298n", "l293d", "tb6612", "motor driver", "h-bridge", "h bridge"]);

  return (
    hasDriverTerm &&
    !includesAnyTerm(name, ["tt dc motor", "dc gear motor", "geared motor", "bo motor", "wheel", "tire", "tyre", "chassis", "sensor"]) &&
    !includesAnyTerm(text, ["wheel only"])
  );
}

function isRobotCarMotor(product) {
  const text = getRobotCarRoleText(product);
  const name = getRobotCarNameText(product);

  return (
    includesAnyTerm(text, ["tt dc motor", "dc gear motor", "geared motor", "bo motor"]) &&
    !includesAnyTerm(text, ["motor driver", "h-bridge", "h bridge", "l298n", "l293d", "tb6612"]) &&
    !includesAnyTerm(name, ["chassis", "wheel", "wheels", "tire", "tires", "tyre", "tyres"])
  );
}

function isRobotCarChassis(product) {
  const text = getRobotCarRoleText(product);
  const name = getRobotCarNameText(product);

  return includesAnyTerm(text, ["chassis", "robot car frame", "car base", "2wd chassis", "4wd chassis"]) && !includesAnyTerm(name, ["wheel", "wheels", "tire", "tires", "tyre", "tyres", "motor"]);
}

function isRobotCarWheel(product) {
  const name = getRobotCarNameText(product);

  return includesAnyTerm(name, ["wheel", "wheels", "tire", "tires", "tyre", "tyres", "caster wheel"]);
}

function isRobotCarPowerFallback(product) {
  const text = getRobotCarRoleText(product);

  return includesAnyTerm(text, ["tp4056", "lm2596"]);
}

function isRobotCarPower(product) {
  const text = getRobotCarRoleText(product);
  const name = getRobotCarNameText(product);

  return includesAnyTerm(name, ["battery holder", "battery pack", "18650 holder", "li-ion battery holder", "li ion battery holder", "power module", "tp4056", "lm2596"]);
}

function isRobotCarWiring(product) {
  const name = getRobotCarNameText(product);

  return includesAnyTerm(name, ["jumper wire", "jumper wires", "dupont wire", "dupont wires", "breadboard", "wire kit"]);
}

function isRobotCarOptionalSensor(product) {
  const text = getRobotCarRoleText(product);

  return (
    includesAnyTerm(text, ["ultrasonic sensor", "hc-sr04", "ir sensor", "line tracking sensor", "obstacle avoidance sensor"]) &&
    !includesAnyTerm(text, ["soil moisture", "temperature", "humidity", "dht11", "dht22"])
  );
}

function isLineFollowerSensor(product) {
  const text = getRobotCarRoleText(product);

  return (
    includesAnyTerm(text, ["tcrt5000", "line tracking", "line sensor", "ir reflectance"]) &&
    !includesAnyTerm(text, ["soil moisture", "temperature", "humidity", "dht11", "dht22"])
  );
}

function scoreBuildGroupProduct(product, groupConfig) {
  const text = getSearchableText(product);
  const name = normalizeText(product.name);

  if (!groupConfig.matcher(product)) {
    return 0;
  }

  let score = 10;

  if (Number(product.stock || 0) > 0) {
    score += 10;
  }

  if (groupConfig.prefer.some((term) => name.includes(term) || text.includes(term))) {
    score += 5;
  }

  if (text.includes("beginner")) {
    score += 3;
  }

  if (normalizeText(product.level).includes("beginner")) {
    score += 3;
  }

  if (product.featured || product.badge) {
    score += 1;
  }

  return score;
}

function buildCompleteRobotCarItems(products, groups, language = "en") {
  const items = [];
  const missingGroups = [];
  const usedProductIds = new Set();

  for (const groupConfig of groups) {
    const match = products
      .filter((product) => !usedProductIds.has(product.id || product.slug || product.name))
      .map((product) => ({
        product,
        score: scoreBuildGroupProduct(product, groupConfig)
      }))
      .filter((entry) => entry.score > 0)
      .sort((first, second) => {
        const firstInStock = Number(first.product.stock || 0) > 0 ? 1 : 0;
        const secondInStock = Number(second.product.stock || 0) > 0 ? 1 : 0;
        const firstFallbackOnly = groupConfig.fallbackOnly?.(first.product) ? 1 : 0;
        const secondFallbackOnly = groupConfig.fallbackOnly?.(second.product) ? 1 : 0;

        return (
          firstFallbackOnly - secondFallbackOnly ||
          secondInStock - firstInStock ||
          second.score - first.score ||
          Number(first.product.price || 0) - Number(second.product.price || 0)
        );
      })[0];

    if (!match) {
      missingGroups.push(groupConfig.missing);
      continue;
    }

    usedProductIds.add(match.product.id || match.product.slug || match.product.name);
    items.push(
      normalizeCatalogItem(match.product, "product", ["projectType", "stock"], language, {
        group: groupConfig.group
      })
    );
  }

  const pricedItems = items.filter((item) => item.price !== null && item.price !== undefined);
  const totalPrice = pricedItems.length ? pricedItems.reduce((sum, item) => sum + item.price, 0) : null;

  return { items, missingGroups, totalPrice };
}

function getBuildVoltageWarning(items, language = "en") {
  const relevant = items.filter((item) => VOLTAGE_SENSITIVE_BUILD_GROUPS.includes(item.group) && item.voltages?.length);

  if (relevant.length < 2) {
    return null;
  }

  const sharedVoltage = relevant[0].voltages.filter((voltage) => relevant.every((item) => item.voltages.includes(voltage)));

  if (sharedVoltage.length) {
    return null;
  }

  const detail = relevant.map((item) => `${item.group} (${item.voltages.join("/")})`).join(", ");

  return language === "km"
    ? `ចំណាំ៖ គ្រឿងបន្លាស់ទាំងនេះអាចនឹងមិនប្រើវ៉ូល​ដូចគ្នា សូមពិនិត្យមុនទិញ៖ ${detail}។`
    : `Note: these parts may not share a common voltage — please double-check before buying: ${detail}.`;
}

function normalizeCatalogItem(item, type, reasonCodes, language = "en", options = {}) {
  const fallbackMetadata = buildFallbackMetadataForItem(item, type);
  const reason =
    type === "product"
      ? getCompatibilityExplanation(item, {
          parsedQuery: options.parsedQuery,
          baseProduct: options.baseProduct,
          compatibilityReasons: reasonCodes,
          language
        })
      : getReasonText(reasonCodes, type, language);

  return {
    type,
    id: item.id || item.slug || item.name,
    name: item.name,
    title: item.name,
    slug: item.slug || null,
    routeUrl: getRouteUrl(item, type),
    price: item.price === undefined || item.price === null ? null : Number(item.price),
    imageUrl: getImageUrl(item, type),
    stock: getCatalogStock(item, type),
    availability: getAvailabilityText(item, type, language),
    voltage: item.voltage || null,
    voltages: Array.isArray(item.voltages) ? item.voltages : item.voltage ? [item.voltage] : [],
    category: type === "product" ? item.category || null : null,
    subcategories: fallbackMetadata.subcategories || [],
    projectTypes: fallbackMetadata.projectTypes || [],
    useCases: fallbackMetadata.useCases || [],
    tags: fallbackMetadata.tags || [],
    khmerSummary: fallbackMetadata.khmerSummary || "",
    level: type === "kit" ? item.level || null : null,
    description: item.description || item.overview || null,
    supportInfo: getSupportInfo(item, type),
    compatibilityInfo: Array.isArray(item.compatibility) ? item.compatibility.slice(0, 5) : [],
    specifications: formatSpecifications(item.specifications),
    parts: options.parts || (options.group ? [options.group] : []),
    group: options.group || null,
    includeDescription: Boolean(options.includeDescription),
    displayMode: options.includeDescription ? "detail" : "listing",
    reason,
    reasonLabels: getReasonLabels(reasonCodes, item, language)
  };
}

function scoreCatalogItem(item, parsedQuery, type, compatibilityKeywords = []) {
  const searchableText = getSearchableText(item);
  const name = normalizeText(item.name);
  const category = normalizeText(item.category);
  const level = normalizeText(item.level);
  const projectType = normalizeText(parsedQuery.filters.projectType);
  const requestedCategory = normalizeText(parsedQuery.filters.category);
  const requestedDifficulty = normalizeText(parsedQuery.filters.difficulty);
  const keywords = getEffectiveKeywords(parsedQuery, compatibilityKeywords);
  const reasonCodes = [];
  let score = 0;

  if (parsedQuery.intent === "kit_search" && type === "kit") {
    score += 2;
    reasonCodes.push("projectType");
  }

  if (parsedQuery.entityType === "product" && type === "product") {
    score += 2;
    reasonCodes.push("entityType");
  }

  if (keywords.some((keyword) => name === keyword || name.includes(keyword))) {
    score += 10;
    reasonCodes.push("exactName");
  }

  if (keywords.some((keyword) => name.includes(keyword))) {
    score += 7;
    reasonCodes.push("keywordName");
  }

  if (requestedCategory && category.includes(requestedCategory.toLowerCase())) {
    score += 6;
    reasonCodes.push("category");
  }

  if (projectType && searchableText.includes(projectType)) {
    score += 6;
    reasonCodes.push("projectType");
  }

  if (requestedDifficulty && level.includes(requestedDifficulty)) {
    score += 5;
    reasonCodes.push("beginner");
  }

  if (parsedQuery.filters.maxPrice !== null && priceIsWithinBudget(item, parsedQuery.filters.maxPrice)) {
    score += 4;
    reasonCodes.push("budget");
  }

  if (Number(getCatalogStock(item, type) || 0) > 0) {
    score += 4;
    reasonCodes.push("stock");
  }

  if (voltageMatches(item, parsedQuery.filters.voltage)) {
    score += 3;
    reasonCodes.push("voltage");
  }

  if (keywords.some((keyword) => searchableText.includes(keyword))) {
    score += 2;
    reasonCodes.push("description");
  }

  const projectCompatibilityTerms = parsedQuery.intent === "compatibility" ? getProjectCompatibilityTerms(projectType) : [];

  if (type === "product" && projectCompatibilityTerms.length && includesAny(searchableText, projectCompatibilityTerms)) {
    score += 6;
    reasonCodes.push("projectType");
  }

  if (item.featured) {
    score += 1;
    reasonCodes.push("featured");
  }

  if (searchableText.includes("dc motor") || searchableText.includes("motor driver") || searchableText.includes("l298n")) {
    reasonCodes.push("dcMotor");
  }

  if (searchableText.includes("esp32") || searchableText.includes("arduino") || searchableText.includes("controller")) {
    reasonCodes.push("controller");
  }

  if (parsedQuery.filters.maxPrice !== null && !priceIsWithinBudget(item, parsedQuery.filters.maxPrice)) {
    score -= 3;
  }

  const relevanceReasons = new Set(["exactName", "keywordName", "category", "projectType", "beginner", "budget", "voltage", "description"]);
  const hasPrimaryRelevance = reasonCodes.some((reasonCode) => relevanceReasons.has(reasonCode));

  if (!hasPrimaryRelevance) {
    score = 0;
  }

  return { item, type, score, reasonCodes };
}

function getRetrievalConfidence(entry, parsedQuery) {
  const reasons = new Set(entry.reasonCodes || []);
  let confidence = 0;

  if (reasons.has("exactName")) confidence += 0.45;
  if (reasons.has("keywordName")) confidence += 0.35;
  if (reasons.has("category") && parsedQuery.filters.category) confidence += 0.3;
  if (reasons.has("projectType") && parsedQuery.filters.projectType) confidence += 0.3;
  if (reasons.has("budget") && parsedQuery.filters.maxPrice !== null) confidence += 0.2;
  if (reasons.has("voltage") && parsedQuery.filters.voltage) confidence += 0.25;
  if (reasons.has("beginner") && parsedQuery.filters.difficulty) confidence += 0.15;
  if (reasons.has("description")) confidence += 0.1;

  if (parsedQuery.intent === "kit_search" && entry.type === "kit") confidence += 0.35;
  if (parsedQuery.intent === "budget_search" && (parsedQuery.filters.category || parsedQuery.filters.maxPrice !== null)) confidence += 0.15;
  if (parsedQuery.intent === "catalog_search" && (parsedQuery.filters.category || parsedQuery.filters.projectType || parsedQuery.filters.voltage)) confidence += 0.15;
  if (parsedQuery.intent === "compatibility" || parsedQuery.intent === "compare") confidence += 0.25;
  if (Number(getCatalogStock(entry.item, entry.type) || 0) > 0) confidence += 0.05;

  return Math.min(1, Number(confidence.toFixed(2)));
}

function hasEnoughRetrievalConfidence(entry, parsedQuery) {
  const confidence = getRetrievalConfidence(entry, parsedQuery);
  const reasons = new Set(entry.reasonCodes || []);

  if (reasons.has("exactName") || reasons.has("keywordName")) {
    return confidence >= 0.4;
  }

  if (parsedQuery.intent === "kit_search" && entry.type === "kit") {
    return confidence >= 0.35;
  }

  if (parsedQuery.intent === "budget_search" && (parsedQuery.filters.category || parsedQuery.filters.maxPrice !== null)) {
    return confidence >= 0.35;
  }

  if (parsedQuery.filters.category || parsedQuery.filters.projectType || parsedQuery.filters.voltage) {
    return confidence >= 0.35;
  }

  return false;
}

function rankCatalogItems({ products, robotKits, parsedQuery, compatibilityKeywords = [], language = "en" }) {
  const includeProducts = parsedQuery.entityType !== "kit";
  const includeKits = parsedQuery.entityType !== "product";
  const scoredItems = [
    ...(includeProducts ? products.map((item) => scoreCatalogItem(item, parsedQuery, "product", compatibilityKeywords)) : []),
    ...(includeKits ? robotKits.map((item) => scoreCatalogItem(item, parsedQuery, "kit", compatibilityKeywords)) : [])
  ];
  const requireBuildableStock = shouldRequireBuildableStock(parsedQuery);

  return scoredItems
    .filter((entry) => entry.score > 0 && hasEnoughRetrievalConfidence(entry, parsedQuery))
    .filter((entry) => (requireBuildableStock ? isCatalogItemBuildable(entry.item, entry.type) : true))
    .sort((first, second) => {
      const firstInStock = Number(getCatalogStock(first.item, first.type) || 0) > 0 ? 1 : 0;
      const secondInStock = Number(getCatalogStock(second.item, second.type) || 0) > 0 ? 1 : 0;
      const stockDifference = secondInStock - firstInStock;

      if (parsedQuery.intent === "budget_search" || parsedQuery.filters.maxPrice !== null) {
        if (stockDifference) {
          return stockDifference;
        }

        const priceDifference = Number(first.item.price || 0) - Number(second.item.price || 0);

        if (priceDifference) {
          return priceDifference;
        }
      }

      const scoreDifference = second.score - first.score;

      if (scoreDifference) {
        return scoreDifference;
      }

      if (stockDifference) {
        return stockDifference;
      }

      return (
        Number(getCatalogStock(second.item, second.type) || 0) - Number(getCatalogStock(first.item, first.type) || 0) ||
        Number(second.item.featured || false) - Number(first.item.featured || false)
      );
    })
    .slice(0, 5)
    .map((entry) =>
      normalizeCatalogItem(entry.item, entry.type, entry.reasonCodes, language, {
        parsedQuery,
        group: parsedQuery.entityType === "both" ? (entry.type === "kit" ? "Robot Kits" : "Individual Components") : null
      })
    );
}

function findMentionedProduct(input, products) {
  const normalizedInput = normalizeProductMention(input);

  return products.find((product) => {
    const name = normalizeProductMention(product.name);
    const slug = normalizeProductMention(product.slug);
    const sku = normalizeProductMention(product.sku);
    const significantNameTerms = name.split(/\s+/).filter((term) => term.length > 2);

    return (
      (name && normalizedInput.includes(name)) ||
      (slug && normalizedInput.includes(slug)) ||
      (sku && normalizedInput.includes(sku)) ||
      (significantNameTerms.length >= 2 && significantNameTerms.every((term) => normalizedInput.includes(term)))
    );
  });
}

function rankCompatibleProductItems(products, baseProduct, language = "en") {
  return products
    .filter((product) => product.id !== baseProduct.id && isCatalogItemBuildable(product, "product"))
    .map((product) => {
      const result = scoreCompatibleProduct(baseProduct, product);
      return { product, score: result.score, reasons: result.reasons };
    })
    .filter((entry) => entry.score > 0)
    .sort((first, second) => second.score - first.score || Number(second.product.stock || 0) - Number(first.product.stock || 0))
    .slice(0, 5)
    .map((entry) => ({
      ...normalizeCatalogItem(entry.product, "product", entry.reasons.length ? entry.reasons : ["voltage"], language, {
        baseProduct,
        compatibilityReasons: entry.reasons
      }),
      reasonLabels: getReasonLabels(entry.reasons.length ? entry.reasons : ["voltage"], entry.product, language)
    }));
}

function formatItemList(items) {
  return items.map((item) => item.name).join(", ");
}

function formatPrice(value) {
  return value === null || value === undefined ? "price unavailable" : `$${Number(value).toFixed(2)}`;
}

function formatItemListWithLinks(items) {
  return items.map((item) => item.name).join(", ");
}

function getOutOfStockNote(items, language = "en") {
  const outOfStockItems = items.filter((item) => item.stock !== null && item.stock !== undefined && Number(item.stock) <= 0);

  if (!outOfStockItems.length) {
    return "";
  }

  const names = formatItemList(outOfStockItems);
  return language === "km"
    ? ` ${names} អស់ពីស្តុកឥឡូវនេះ ដូច្នេះសូមពិចារណាជម្រើសផ្សេងដែលមានក្នុងស្តុក។`
    : ` ${names} is out of stock right now, so consider the in-stock alternatives listed.`;
}

function getStockSummary(items = []) {
  const knownStockItems = items.filter((item) => item.stock !== null && item.stock !== undefined);
  const availableCount = knownStockItems.filter((item) => Number(item.stock) > 0).length;
  const outOfStockCount = knownStockItems.filter((item) => Number(item.stock) <= 0).length;

  return {
    availableCount,
    outOfStockCount,
    allOutOfStock: knownStockItems.length > 0 && availableCount === 0 && outOfStockCount > 0,
    hasAvailable: availableCount > 0,
    hasUnavailable: outOfStockCount > 0
  };
}

function detectResponseMode({ intent, parsedIntent, normalizedQuery, detectedProjectTypes = [], matchedItems = [] } = {}) {
  const query = normalizeQuery(normalizedQuery || "");

  if (!matchedItems.length) {
    return "fallback";
  }

  if (intent === "compare_products" || parsedIntent === "compare" || /\b(compare|comparison|vs|versus|difference)\b/.test(query)) {
    return "comparison";
  }

  if (matchedItems.some((item) => item.includeDescription)) {
    return "detail";
  }

  if (
    shouldIncludeProductDescriptions({
      normalizedQuery: query,
      intent: intent || "unknown",
      matchedItems: matchedItems.map((item) => ({ item, score: 140 }))
    })
  ) {
    return "detail";
  }

  if (intent === "recommend_project_parts" || parsedIntent === "complete_build" || detectedProjectTypes.length) {
    return "project_recommendation";
  }

  return "listing";
}

function buildCompactChatReply({
  intent,
  responseMode,
  normalizedQuery,
  detectedProjectTypes = [],
  matchedItems = [],
  itemType,
  language = "en"
} = {}) {
  const query = normalizeQuery(normalizedQuery || "");
  const stock = getStockSummary(matchedItems);

  if (responseMode === "fallback" || !matchedItems.length) {
    return language === "km"
      ? "ខ្ញុំរកមិនឃើញទំនិញដែលត្រូវនឹងសំណួរនេះទេ។ សូមបញ្ជាក់ថាអ្នកចង់បាន sensor, line-following robot, obstacle-avoiding robot ឬ Arduino beginner parts។"
      : "I could not find a reliable match for that. Try asking for robot sensors, line-following robot parts, obstacle-avoiding robot parts, or Arduino beginner parts.";
  }

  if (responseMode === "detail" || responseMode === "comparison") {
    return null;
  }

  if (itemType === "kit" || intent === "recommend_kit") {
    if (stock.allOutOfStock) {
      return language === "km"
        ? "ខ្ញុំរកឃើញ robot kits ទាំងនេះ ប៉ុន្តែពេលនេះអស់ពីស្តុក។ អ្នកអាចមើលវា ឬឲ្យខ្ញុំណែនាំគ្រឿងបន្លាស់ដែលមានក្នុងស្តុកជំនួសបាន។"
        : "I found these robot kits, but they are currently out of stock. You can view them, or I can suggest available individual parts instead.";
    }

    if (stock.hasAvailable && stock.hasUnavailable) {
      return language === "km"
        ? "នេះជា robot kits ដែលខ្ញុំរកឃើញសម្រាប់អ្នក។ Kits ដែលអស់ស្តុកនឹងមានសញ្ញា Out of stock ក្នុងកាត។"
        : "Here are the robot kits I found for you. Out-of-stock kits are marked in the cards.";
    }

    return language === "km" ? "នេះជា robot kits ដែលខ្ញុំរកឃើញសម្រាប់អ្នក។" : "Here are the robot kits I found for you.";
  }

  if (responseMode === "project_recommendation") {
    if (detectedProjectTypes.includes("line_follower") || /line[\s-]*(following|follower|follow)/.test(query)) {
      return language === "km"
        ? "នេះជាគ្រឿងបន្លាស់ដែលអាចជួយអ្នកធ្វើរ៉ូបូតដើរតាមខ្សែ។"
        : "Here are parts that can help you build a line-following robot.";
    }

    if (detectedProjectTypes.includes("obstacle_avoider") || /obstacle[\s-]*(avoiding|avoidance|avoid)/.test(query)) {
      return language === "km"
        ? "នេះជាគ្រឿងបន្លាស់ដែលអាចជួយអ្នកធ្វើរ៉ូបូតគេចឧបសគ្គ។"
        : "Here are parts that can help you build an obstacle-avoiding robot.";
    }

    if (detectedProjectTypes.includes("arduino_beginner") || query.includes("beginner")) {
      return language === "km"
        ? "នេះជា Arduino parts សម្រាប់អ្នកចាប់ផ្តើម។"
        : "These beginner-friendly Arduino parts are a good starting point.";
    }

    return language === "km"
      ? "នេះជាគ្រឿងបន្លាស់ដែលអាចជួយគម្រោងរ៉ូបូតរបស់អ្នក។"
      : "Here are parts that can help with your robot project.";
  }

  if (intent === "budget_recommendation" || query.includes("cheap") || query.includes("budget") || query.includes("low price")) {
    if (query.includes("sensor") || matchedItems.every((item) => item.category === "Sensors")) {
      return language === "km" ? "នេះជា sensors តម្លៃទាបដែលខ្ញុំរកឃើញ។" : "Here are some low-priced sensors I found.";
    }

    return language === "km" ? "នេះជាជម្រើសតម្លៃទាបដែលខ្ញុំរកឃើញ។" : "Here are some low-priced options I found.";
  }

  if (query.includes("sensor") || matchedItems.every((item) => item.category === "Sensors")) {
    return language === "km" ? "ខ្ញុំរកឃើញ sensors មួយចំនួនសម្រាប់អ្នក។" : "I found a few suitable sensors for you.";
  }

  return language === "km" ? "ខ្ញុំរកឃើញជម្រើសមួយចំនួនសម្រាប់អ្នក។" : "I found a few suitable options for you.";
}

function buildCatalogReply(parsedQuery, items, language = "en") {
  if (language === "km") {
    if (!items.length) {
      return "ខ្ញុំរកមិនឃើញទំនិញក្នុង catalog ដែលត្រូវនឹងសំណើនេះទេ។ សូមសាកល្បងឈ្មោះផលិតផល ប្រភេទឈុត ថវិកា ឬវ៉ុល។";
    }

    if (parsedQuery.intent === "kit_search") {
      return `ខ្ញុំរកឃើញឈុតរ៉ូបូតទាំងនេះ៖ ${formatItemListWithLinks(items)}។`;
    }

    if (parsedQuery.intent === "budget_search" && parsedQuery.filters.maxPrice !== null) {
      return `នេះជាជម្រើសក្នុង catalog ក្រោម $${parsedQuery.filters.maxPrice}៖ ${formatItemListWithLinks(items)}។${getOutOfStockNote(items, language)}`;
    }

    if (parsedQuery.filters.voltage) {
      return `នេះជាជម្រើស ${parsedQuery.filters.voltage} ដែលពាក់ព័ន្ធ៖ ${formatItemListWithLinks(items)}។${getOutOfStockNote(items, language)}`;
    }

    return `ខ្ញុំរកឃើញជម្រើសដែលពាក់ព័ន្ធទាំងនេះ៖ ${formatItemListWithLinks(items)}។${getOutOfStockNote(items, language)}`;
  }

  if (!items.length) {
    return "I couldn't find a matching product right now.";
  }

  if (parsedQuery.intent === "kit_search") {
    return "I found a few robot kit options for you. You can review them in the cards below.";
  }

  if (parsedQuery.intent === "budget_search" && parsedQuery.filters.maxPrice !== null) {
    return `I found a few options under $${parsedQuery.filters.maxPrice}. You can compare them in the cards below.${getOutOfStockNote(items, language)}`;
  }

  if (parsedQuery.filters.voltage) {
    return `These ${parsedQuery.filters.voltage} products may work for your project. Details are in the cards below.${getOutOfStockNote(items, language)}`;
  }

  return `I found a few suitable options that may help.${getOutOfStockNote(items, language)}`;
}

function buildCatalogGroundingSummary(label, items) {
  if (!items.length) {
    return `Catalog results: no ${label} were selected.`;
  }

  return `Catalog results for ${label}: ${items
    .map((item) => {
      const fields = [`name=${item.name}`, `type=${item.type}`];

      if (item.price !== null) {
        fields.push(`price=$${Number(item.price).toFixed(2)}`);
      }

      if (item.stock !== null) {
        fields.push(`stock=${item.stock}`);
      }

      if (item.availability) {
        fields.push(`availability=${item.availability}`);
      }

      if (item.voltages?.length) {
        fields.push(`voltages=${item.voltages.join("/")}`);
      } else if (item.voltage) {
        fields.push(`voltage=${item.voltage}`);
      }

      if (item.category) {
        fields.push(`category=${item.category}`);
      }

      if (item.group) {
        fields.push(`group=${item.group}`);
      }

      if (item.level) {
        fields.push(`level=${item.level}`);
      }

      if (item.compatibilityInfo?.length) {
        fields.push(`compatibility=${item.compatibilityInfo.join("/")}`);
      }

      if (item.specifications?.length) {
        fields.push(`specifications=${item.specifications.join("/")}`);
      }

      if (item.reason) {
        fields.push(`reason=${item.reason}`);
      }

      return fields.join(", ");
    })
    .join(" | ")}.`;
}

export function buildChatbotContext(items = []) {
  return {
    includeDescriptions: items.some((item) => item.includeDescription),
    items: items.map((item) => ({
      name: item.name,
      type: item.type === "kit" ? "robot kit" : "product",
      price: item.price,
      stock: item.stock,
      availability: item.availability,
      category: item.category,
      subcategories: item.subcategories || [],
      projectTypes: item.projectTypes || [],
      useCases: item.useCases || [],
      tags: item.tags || [],
      khmerSummary: item.khmerSummary || "",
      group: item.group,
      level: item.level,
      voltage: item.voltage,
      voltages: item.voltages || [],
      supportInfo: item.supportInfo,
      compatibilityInfo: item.compatibilityInfo || [],
      specifications: item.specifications || [],
      ...(item.includeDescription ? { description: item.description } : {}),
      reason: item.reason
    }))
  };
}

export function buildChatbotPrompt({ message, draftReply, catalogContext, language }) {
  const responseLanguage = language === "km" ? "Khmer" : "English";

  return `User message:
${message}

Response language:
${responseLanguage}

Database catalog context, containing the only products and robot kits you may recommend:
${JSON.stringify(catalogContext)}

Grounded draft reply:
${draftReply}

Rules:
- Respond in ${responseLanguage}.
- Only recommend product or robot kit names that appear in the database catalog context.
- Do not invent product names, prices, stock, voltage, compatibility, skill level, links, or URLs.
- Do not expose internal routes like /products/... or /robot-kits/... in the natural reply.
- If no matching item is in the context, say that no matching item is currently available.
- For compatibility questions, use voltage, compatibility, and specifications from the context first.
- If the context does not confirm a detail, say "I cannot confirm from the product data."
- Mention out-of-stock products clearly and suggest in-stock alternatives from the context when available.
- If catalogContext.includeDescriptions is false, return only a short customer-facing introduction. Do not list product names, do not describe each product, do not repeat stock item by item, and do not mention "Recommended matches".
- If catalogContext.includeDescriptions is true, you may briefly explain the specific product or comparison using only the provided data.
- Keep the answer beginner-friendly, concise, and shopping-focused.`;
}

function buildGroundedModelPrompt({ message, catalogContext, recentContext = [], language, mode = "explain" }) {
  const responseLanguage = language === "km" ? "Khmer" : "English";

  return `User message:
${message}

Detected language:
${responseLanguage}

Answer mode:
${mode}

includeDescriptions:
true

Matched database catalog context. These are the only catalog items you may discuss:
${JSON.stringify(catalogContext)}

Recent referenced items, if the user used words like this, it, first one, controller, or similar:
${JSON.stringify(recentContext)}

Strict rules:
- Answer only from the provided catalog context.
- Do not invent product names, prices, stock, voltage, compatibility, specifications, links, or availability.
- If a fact is missing, say exactly: "I cannot confirm from the product data."
- Recommend only real catalog items shown in the context.
- For compatibility questions, use compatibility, voltage, description, and specifications from the context only.
- Do not expose internal routes like /products/... or /robot-kits/... in the natural reply.
- Keep official product and model names exactly as provided in the catalog context, in English.
- If the detected language is Khmer, explain naturally in Khmer while preserving technical names such as Arduino Uno, ESP32, HC-SR04, TCRT5000, L298N, TB6612FNG, DRV8833, SG90, Raspberry Pi, and DHT11 in English.
- Explain in beginner-friendly language.
- Answer in ${responseLanguage}.
- Directly answer the user's question with enough detail to be genuinely useful — don't sacrifice clarity or completeness for brevity.`;
}

function buildEducationalModelPrompt({ message, educationIntent, projectTypes = [], catalogContext = [], language = "en" }) {
  const responseLanguage = language === "km" ? "Khmer" : "English";

  return `User message:
${message}

Detected language:
${responseLanguage}

Educational intent:
${educationIntent}

Detected project types:
${projectTypes.join(", ") || "none"}

A. STORE TRUTH:
Only these products/kits exist in the RobotIoKit store. Product cards are rendered by the application from this same data:
${JSON.stringify(catalogContext)}

Inferred metadata in STORE TRUTH, when present:
- category and subcategories
- projectTypes
- useCases
- tags
- khmerSummary

B. GENERAL KNOWLEDGE:
You may use general robotics/electronics knowledge to explain concepts, project logic, algorithms, wiring concepts, and troubleshooting.

Rules:
- Use general robotics knowledge for education, but never invent store product names, prices, stock, URLs, or availability.
- If mentioning store products, mention only products/kits from STORE TRUTH.
- Do not expose internal routes like /products/... or /robot-kits/... in the natural reply.
- Keep official product and model names exactly as provided, in English.
- If the detected language is Khmer, explain naturally in Khmer while preserving technical names such as Arduino Uno, ESP32, HC-SR04, TCRT5000, L298N, TB6612FNG, DRV8833, SG90, Raspberry Pi, and DHT11 in English.
- For project explanations, include a simple explanation, main components, and basic working principle.
- For how-to questions, include required parts, wiring overview, basic logic/algorithm, and testing tips.
- For troubleshooting, include likely causes, checks, and safe fixes.
- Add a beginner-friendly safety/wiring note when motors, batteries, or power are involved.
- Use short sections or bullets so it's easy to scan, but include enough detail (wiring steps, values, reasoning) to be genuinely useful — don't sacrifice completeness for brevity.
- Answer in ${responseLanguage}.`;
}

function getCategoryAwareFollowUps(item, language = "en") {
  if (!item) {
    return [];
  }

  const name = normalizeText(item.name);
  const category = normalizeText(item.category);
  const subcategories = Array.isArray(item.subcategories) ? item.subcategories : [];
  const projectTypes = Array.isArray(item.projectTypes) ? item.projectTypes : [];
  const isKhmer = language === "km";

  if (name.includes("dht11") || subcategories.includes("environment_monitoring") || projectTypes.includes("environment_monitoring")) {
    return isKhmer
      ? ["តើភ្ជាប់ DHT11 ជាមួយ Arduino ដូចម្តេច?", "Show environment monitoring parts", "Compare DHT11 and DHT22"]
      : ["How to connect DHT11 to Arduino?", "Show environment monitoring parts", "Compare DHT11 and DHT22"];
  }

  if (name.includes("nrf24") || subcategories.includes("wireless_communication") || projectTypes.includes("wireless_control")) {
    return isKhmer
      ? ["How to build wireless robot communication?", "Compare NRF24L01 and LoRa", "Show Arduino-compatible wireless modules"]
      : ["How to build wireless robot communication?", "Compare NRF24L01 and LoRa", "Show Arduino-compatible wireless modules"];
  }

  if (name.includes("lm2596") || subcategories.includes("power_management") || category.includes("power") || projectTypes.includes("power_system")) {
    return isKhmer
      ? ["How to power ESP32 safely?", "Show power modules", "តើអាចប្រើជាមួយ battery បានទេ?"]
      : ["How to power ESP32 safely?", "Show power modules", "Can I use it with a battery?"];
  }

  if (subcategories.includes("display")) {
    return isKhmer
      ? ["How to show sensor readings?", "Show display modules", "តើប្រើជាមួយ Arduino បានទេ?"]
      : ["How to show sensor readings?", "Show display modules", "Is it compatible with Arduino?"];
  }

  return [];
}

function getProductDetailFollowUps(input, language = "en", item = null) {
  if (DIRECT_FACT_TERMS.some((term) => input.includes(term))) {
    return [];
  }

  const categoryAware = getCategoryAwareFollowUps(item, language);
  if (categoryAware.length) {
    return categoryAware.slice(0, 3);
  }

  return localizeFollowUps(["Is it compatible with Arduino?", "Show similar products"], language).slice(0, 2);
}

function getRobotCarBuildFollowUps(language = "en") {
  return localizeFollowUps(["Show beginner kits", "Explain the controller"], language);
}

function buildFollowUps(parsedQuery, items, language = "en") {
  if (!items.length || parsedQuery.confidence < 0.35 || parsedQuery.intent === "compatibility" || parsedQuery.intent === "compare") {
    return [];
  }

  if (parsedQuery.intent === "kit_search") {
    return localizeFollowUps(["Show parts"], language);
  }

  if (parsedQuery.intent === "budget_search" && parsedQuery.filters.maxPrice === null) {
    return localizeFollowUps(["Show cheaper"], language);
  }

  if (parsedQuery.intent === "catalog_search" && parsedQuery.filters.projectType) {
    return localizeFollowUps(["Show kits"], language);
  }

  return [];

  const followUps = [];

  if (items.length) {
    followUps.push(
      ...(language === "km"
        ? ["ពន្យល់អំពីទីមួយ", "វាប្រើជាមួយ Arduino បានទេ?", "មួយណាល្អសម្រាប់អ្នកចាប់ផ្តើម?", "ប្រៀបធៀបទីមួយ និងទីពីរ"]
        : ["Explain the first one", "Is it compatible with Arduino?", "Which one is best for beginners?", "Compare the first and second"])
    );
  }

  if (items.some((item) => item.type === "product")) {
    followUps.push("Show kits");
  }

  if (items.some((item) => item.type === "kit")) {
    followUps.push("Show parts");
  }

  if (parsedQuery.filters.maxPrice === null) {
    followUps.push("Show cheaper");
  }

  if (parsedQuery.filters.difficulty !== "beginner") {
    followUps.push("Beginner only");
  }

  if (parsedQuery.intent !== "compare") {
    followUps.push("Compare options");
  }

  if (parsedQuery.intent !== "compatibility") {
    followUps.push("Check compatibility");
  }

  return localizeFollowUps([...new Set(followUps)].slice(0, 4), language);
}

function normalizeContextItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .slice(0, 10)
    .map((item) => ({
      id: item.id || "",
      name: item.name || "",
      type: item.type || "product",
      slug: item.slug || "",
      routeUrl: item.routeUrl || "",
      category: item.category || "",
      price: item.price ?? null,
      stock: item.stock ?? null,
      description: item.description || "",
      specifications: Array.isArray(item.specifications) ? item.specifications : [],
      voltage: item.voltage || "",
      voltages: Array.isArray(item.voltages) ? item.voltages : [],
      compatibilityInfo: Array.isArray(item.compatibilityInfo) ? item.compatibilityInfo : Array.isArray(item.compatibility) ? item.compatibility : [],
      group: item.group || "",
      level: item.level || ""
    }))
    .filter((item) => item.name);
}

function getCatalogSearchName(item) {
  return normalizeProductMention([item.name, item.slug, item.sku].filter(Boolean).join(" "));
}

function getCatalogSearchText(item) {
  return normalizeProductMention([
    item.name,
    item.slug,
    item.sku,
    item.category,
    item.level,
    item.description,
    item.overview,
    ...(Array.isArray(item.features) ? item.features : []),
    ...(Array.isArray(item.compatibility) ? item.compatibility : [])
  ].join(" "));
}

function getSignificantTerms(value) {
  return normalizeProductMention(value)
    .split(/\s+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

function scoreCatalogMention(input, item) {
  const normalizedInput = normalizeProductMention(input);
  const name = getCatalogSearchName(item);
  const text = getCatalogSearchText(item);
  const slug = normalizeProductMention(item.slug);
  const sku = normalizeProductMention(item.sku);
  const nameTerms = getSignificantTerms(item.name);

  if (!normalizedInput || !name) {
    return 0;
  }

  if ((name && normalizedInput.includes(name)) || (slug && normalizedInput.includes(slug)) || (sku && normalizedInput.includes(sku))) {
    return 100;
  }

  for (const phrase of EXACT_CATALOG_PHRASES) {
    if (!normalizedInput.includes(phrase) || !name.includes(phrase)) {
      continue;
    }

    if (phrase === "esp32") {
      return name.startsWith("esp32 dev board") ? 99 : 88;
    }

    return name.startsWith(phrase) ? 99 : 84;
  }

  for (const alias of CATALOG_ALIAS_RULES) {
    if (!normalizedInput.includes(alias.term)) {
      continue;
    }

    const targetMatch = alias.targets.some((target) => name.includes(normalizeProductMention(target)));
    if (!targetMatch) {
      continue;
    }

    const preferred = alias.prefer?.some((preferredTerm) => name.startsWith(normalizeProductMention(preferredTerm)));
    return preferred ? 95 : 86;
  }

  if (nameTerms.length >= 2 && nameTerms.every((term) => normalizedInput.includes(term))) {
    return 90;
  }

  const matchingNameTerms = nameTerms.filter((term) => normalizedInput.includes(term));
  if (matchingNameTerms.length >= 2) {
    return 75;
  }

  if (matchingNameTerms.some((term) => /\d/.test(term) && term.length >= 4)) {
    return 88;
  }

  return 0;
}

function findCatalogMentionMatches(input, products = [], robotKits = []) {
  const candidates = [
    ...products.map((item) => ({ item, type: "product" })),
    ...robotKits.map((item) => ({ item, type: "kit" }))
  ];

  const scored = candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreCatalogMention(input, candidate.item)
    }))
    .filter((entry) => entry.score > 0)
    .sort((first, second) => {
      const scoreDifference = second.score - first.score;
      if (scoreDifference) {
        return scoreDifference;
      }

      const firstStock = Number(getCatalogStock(first.item, first.type) || 0) > 0 ? 1 : 0;
      const secondStock = Number(getCatalogStock(second.item, second.type) || 0) > 0 ? 1 : 0;
      return secondStock - firstStock || Number(first.item.price || 0) - Number(second.item.price || 0);
    });

  if (!scored.length) {
    return [];
  }

  const topScore = scored[0].score;
  return scored.filter((entry) => entry.score >= Math.max(75, topScore - 5)).slice(0, 5);
}

function detectConceptTerm(input = "") {
  const normalized = normalizeProductMention(input);

  if (/\bmotor drivers?\b/.test(normalized)) return "motor driver";
  if (/\brobot kits?\b/.test(normalized)) return "robot kit";
  if (/\bpower modules?\b|\bvoltage regulators?\b|\bregulators?\b/.test(normalized)) return "power module";
  if (/\bcommunication modules?\b|\bwireless modules?\b/.test(normalized)) return "communication module";

  for (const term of Object.keys(CONCEPT_EXPLANATIONS)) {
    const plural = `${term}s`;
    if (normalized === term || normalized.includes(` ${term} `) || normalized.endsWith(` ${term}`) || normalized.includes(` ${plural} `) || normalized.endsWith(` ${plural}`)) {
      return term;
    }
  }

  return null;
}

function isConceptQuestion(input = "", conceptTerm = "") {
  const normalized = normalizeProductMention(input)
    .replace(/\b(what|does|do|is|are|a|an|the|for|used|use|purpose|explain|how|work|works)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const conceptWords = normalizeProductMention(conceptTerm).split(/\s+/).filter(Boolean);
  const remainingWords = normalized.split(/\s+/).filter(Boolean);

  if (!/\bwhat\s+(?:is|are)\b|\bwhat\s+does\b|\bwhat\s+do\b|\bwhat\s+is\s+the\s+purpose\b|\bexplain\b|\bhow\s+does\b/i.test(input)) {
    return false;
  }

  return remainingWords.length > 0 && remainingWords.every((word) => conceptWords.includes(word) || word === `${conceptWords[conceptWords.length - 1]}s`);
}

function isRobotDiscoveryQuestion(input = "") {
  return (
    /\b(?:do you know|do you sell|what|show|find|recommend|any)\b.*\brobot\s+(?:products?|parts?|components?|items?)\b/i.test(input) ||
    /\brobot\s+(?:products?|parts?|components?|items?|building parts?)\b/i.test(input) ||
    /\bproducts?\s+(?:can i use\s+to|can i use|for|to)\s+(?:build|make)\s+a?\s*robot\b/i.test(input)
  );
}

function isRobotProjectOverviewQuestion(input = "") {
  return (
    /\bwhat\s+robot\s+projects?\s+i\s+can\s+build\b/i.test(input) ||
    /\bwhat\s+robot\s+projects?\s+can\s+i\s+build\b/i.test(input) ||
    /\bwhat\s+projects?\s+i\s+can\s+build\b/i.test(input) ||
    /\bwhat\s+projects?\s+can\s+i\s+build\b/i.test(input) ||
    /\bbuildable\s+robot\s+projects?\b/i.test(input) ||
    /\brobot\s+project\s+builders?\b/i.test(input)
  );
}

function isStoreLocationQuestion(input = "") {
  // Khmer checked against the raw text kept by normalizeKhmerQuery — the
  // ទីតាំង synonym expands to "delivery ... location" tokens, which would
  // otherwise mis-route store-location questions to the delivery-fee reply.
  return (
    /\b(store\s+location|shop\s+location|where\s+are\s+you|where\s+is\s+the\s+store|address|pickup)\b/i.test(input) ||
    /ទីតាំង|អាសយដ្ឋាន|ហាងនៅឯណា/.test(input)
  );
}

function isDeliveryFeeQuestion(input = "") {
  return /\b(delivery|shipping|delivery fee|shipping fee|fee information|deliver)\b/i.test(input);
}

function detectQuestionMode(rawMessage = "", input = "", parsedQuery = null) {
  if (parsedQuery?.intent === "faq") return "faq";
  if (parsedQuery?.intent === "complete_build") return "project_build";
  if (parsedQuery?.intent === "compare") return "comparison";
  if (parsedQuery?.intent === "compatibility") return "catalog_search";
  if (isRobotDiscoveryQuestion(input)) return "catalog_search";

  const conceptTerm = detectConceptTerm(input);
  if (conceptTerm && isConceptQuestion(input, conceptTerm)) {
    return "concept_explanation";
  }

  if (isProductDetailRequest(input)) {
    return "product_detail";
  }

  if (["catalog_search", "kit_search", "budget_search", "catalog_filter", "compatibility"].includes(parsedQuery?.intent)) {
    return "catalog_search";
  }

  return "fallback";
}

function isProductDetailRequest(input) {
  return PRODUCT_DETAIL_TERMS.some((term) => input.includes(term));
}

function isComparisonRequest(input) {
  return ["compare", "comparison", " vs ", " versus ", "which is better", "better than", "ប្រៀបធៀប", "ល្អជាង"].some((term) => input.includes(term));
}

function shouldAskCatalogClarification(input, matches) {
  if (matches.length <= 1) {
    return false;
  }

  if (isComparisonRequest(input)) {
    return false;
  }

  if (isProductDetailRequest(input) && matches[0].score >= 75 && matches[1]?.score < matches[0].score) {
    return false;
  }

  return matches[0].score < 95 || matches.filter((match) => match.score === matches[0].score).length > 1;
}

function buildClarificationReply(matches, language = "en") {
  const choices = matches.slice(0, 5).map((match, index) => `${index + 1}. ${match.item.name}`).join(" ");
  return language === "km" ? `តើអ្នកចង់សួរអំពីមួយណា? ${choices}` : `Which item do you mean? ${choices}`;
}

function getRecentContextForPrompt(items = []) {
  return normalizeContextItems(items).map((item) => ({
    name: item.name,
    type: item.type,
    group: item.group,
    category: item.category,
    routeUrl: getContextItemUrl(item)
  }));
}

function detectContextFollowUp(input) {
  return [
    "this",
    "that",
    " it ",
    "first one",
    "second one",
    "explain",
    "compare first",
    "what voltage",
    "compatible",
    "use it with",
    "good for beginners",
    "best for beginners",
    "វា",
    "មួយនេះ",
    "នេះ",
    "ទីមួយ",
    "ទីពីរ",
    "ពន្យល់",
    "ប្រើជាមួយ",
    "អ្នកចាប់ផ្តើម",
    "ប្រៀបធៀប"
  ].some((term) => ` ${input} `.includes(term));
}

function getContextItemText(item) {
  return normalizeText([
    item.name,
    item.category,
    item.level,
    item.group,
    item.description,
    item.voltage,
    ...(item.voltages || []),
    ...(item.specifications || []),
    ...(item.compatibilityInfo || [])
  ].join(" "));
}

function getContextItemUrl(item) {
  if (item.routeUrl) {
    return item.routeUrl;
  }

  if (!item.slug) {
    return "";
  }

  return item.type === "kit" ? `/robot-kits/${item.slug}` : `/products/${item.slug}`;
}

function getContextItemVoltage(item) {
  if (item.voltage) {
    return item.voltage;
  }

  if (item.voltages?.length) {
    return item.voltages.join(", ");
  }

  const spec = (item.specifications || []).find((value) => normalizeText(value).includes("voltage"));
  return spec || "";
}

function getContextStockText(item) {
  if (item.stock === null || item.stock === undefined) {
    return "Stock data is not available.";
  }

  const stock = Number(item.stock || 0);
  return stock > 0 ? `In stock: ${stock}` : "Out of stock";
}

function getBeginnerText(item) {
  const text = getContextItemText(item);

  if (normalizeText(item.level) === "beginner" || text.includes("beginner") || text.includes("starter")) {
    return "It looks beginner-friendly based on the product data.";
  }

  return "I cannot confirm this from the product data.";
}

function resolveContextReference(input, items) {
  if (!items.length || !detectContextFollowUp(input)) {
    return null;
  }

  if ((input.includes("compare") || input.includes("ប្រៀបធៀប")) && (input.includes("second") || input.includes("ទីពីរ")) && items.length >= 2) {
    return { mode: "compare", items: [items[0], items[1]] };
  }

  if ((input.includes("best for beginners") || input.includes("good for beginners") || input.includes("អ្នកចាប់ផ្តើម")) && items.length > 1) {
    const bestItem = [...items].sort((first, second) => {
      const score = (item) => {
        const text = getContextItemText(item);
        return (
          (normalizeText(item.level) === "beginner" ? 5 : 0) +
          (text.includes("beginner") || text.includes("starter") ? 3 : 0) +
          (Number(item.stock || 0) > 0 ? 2 : 0)
        );
      };

      return score(second) - score(first);
    })[0];

    return { mode: "best_beginner", items: [bestItem] };
  }

  if (input.includes("second one") || input.includes("ទីពីរ")) {
    return items[1] ? { mode: "single", items: [items[1]] } : { mode: "missing" };
  }

  if (input.includes("first one") || input.includes("ទីមួយ")) {
    return { mode: "single", items: [items[0]] };
  }

  const normalizedInput = normalizeProductMention(input);
  const nameMatches = items.filter((item) => {
    const terms = normalizeProductMention([item.name, item.group, item.category].join(" ")).split(/\s+/).filter((term) => term.length > 2);
    return terms.length && terms.some((term) => normalizedInput.includes(term));
  });

  if (nameMatches.length === 1) {
    return { mode: "single", items: [nameMatches[0]] };
  }

  if (nameMatches.length > 1) {
    return { mode: "ambiguous", items: nameMatches };
  }

  const hasPronoun = ["this", "that", " it ", "វា", "មួយនេះ", "នេះ"].some((term) => ` ${input} `.includes(term));

  if (hasPronoun && items.length) {
    return { mode: "single", items: [items[0]] };
  }

  if (items.length === 1) {
    return { mode: "single", items: [items[0]] };
  }

  return { mode: "ambiguous", items };
}

function getKhmerStockText(item) {
  if (item.stock === null || item.stock === undefined) {
    return "ខ្ញុំមិនអាចបញ្ជាក់ស្តុកពីទិន្នន័យផលិតផលបានទេ។";
  }

  const stock = Number(item.stock || 0);
  return stock > 0 ? `មានក្នុងស្តុក ${stock}។` : "ឥឡូវនេះអស់ពីស្តុក។";
}

function getKhmerCategoryText(item) {
  const category = normalizeText(item.category || item.group || item.type);

  if (category.includes("controller")) return "microcontroller board";
  if (category.includes("sensor")) return "sensor";
  if (category.includes("motor")) return "motor/driver component";
  if (category.includes("power")) return "power component";
  if (category.includes("accessor")) return "robotics accessory";
  if (item.type === "kit") return "robot kit";
  return item.category || item.group || "robotics component";
}

function getKhmerUseText(item) {
  const text = getContextItemText(item);
  const description = String(item.description || "").trim();

  if (text.includes("ultrasonic") || text.includes("hc-sr04")) {
    return "ប្រើសម្រាប់វាស់ចម្ងាយ និងរកឧបសគ្គក្នុង robot car។";
  }

  if (text.includes("tcrt5000") || text.includes("line tracking") || text.includes("line-following") || text.includes("line following")) {
    return "ប្រើសម្រាប់ line-following robot ដើម្បីចាប់សញ្ញាផ្ទៃខ្មៅ និងស។";
  }

  if (item.khmerSummary) {
    return `${item.khmerSummary}។`;
  }

  if (description) {
    return `តាម product data: ${description}`;
  }

  if (text.includes("arduino")) {
    return "សាកសមសម្រាប់ beginner robotics projects, wiring ដំបូង និងការគ្រប់គ្រង sensor ឬ motor driver។";
  }

  if (text.includes("esp32")) {
    return "សាកសមសម្រាប់ IoT robotics projects ដែលត្រូវការ WiFi ឬ Bluetooth។";
  }

  if (text.includes("l298n") || text.includes("tb6612") || text.includes("drv8833") || text.includes("motor driver")) {
    return "ប្រើសម្រាប់បញ្ជា DC motors ក្នុង robot car ឬ drivetrain projects។";
  }

  if (text.includes("servo") || text.includes("sg90")) {
    return "ប្រើសម្រាប់គម្រោងដែលត្រូវការចលនាបញ្ជា ដូចជា sensor mount, steering ឬ robot arm តូច។";
  }

  return item.description ? "ប្រើសម្រាប់ robotics projects តាមព័ត៌មានផលិតផលដែលមាន។" : "ខ្ញុំមិនអាចបញ្ជាក់ពីការប្រើប្រាស់ពីទិន្នន័យផលិតផលបានទេ។";
}

function getKhmerCompatibilityText(item) {
  const compatibility = item.compatibilityInfo?.length ? item.compatibilityInfo.slice(0, 4).join(", ") : "";
  return compatibility ? `ភាពត្រូវគ្នា៖ ${compatibility}។` : "ភាពត្រូវគ្នា៖ ខ្ញុំមិនអាចបញ្ជាក់ពីទិន្នន័យផលិតផលបានទេ។";
}

function getKhmerVoltageText(item) {
  const voltage = getContextItemVoltage(item);
  return voltage ? `វ៉ុល៖ ${voltage}។` : "វ៉ុល៖ ខ្ញុំមិនអាចបញ្ជាក់ពីទិន្នន័យផលិតផលបានទេ។";
}

function getKhmerBeginnerText(item) {
  const text = getContextItemText(item);
  if (normalizeText(item.level) === "beginner" || text.includes("beginner") || text.includes("starter")) {
    return "សាកសមសម្រាប់អ្នកចាប់ផ្តើម។";
  }

  return "ខ្ញុំមិនអាចបញ្ជាក់ថាសាកសមសម្រាប់អ្នកចាប់ផ្តើមពីទិន្នន័យផលិតផលបានទេ។";
}

function answerCompatibilityQuestion(item, input, language = "en") {
  const asksCompatibility = ["compatible", "compatibility", "work with", "works with", "use it with", "use this with", "ប្រើជាមួយ", "បានទេ"].some((term) => input.includes(term));

  if (!asksCompatibility) {
    return null;
  }

  const target = input.includes("arduino") ? "Arduino" : input.includes("esp32") ? "ESP32" : "";

  if (!target) {
    return null;
  }

  const text = getContextItemText(item);

  if (text.includes(target.toLowerCase())) {
    if (language === "km") {
      return `ភាពត្រូវគ្នាជាមួយ ${target}: ទិន្នន័យផលិតផលមានរៀបរាប់ ${target} ដូច្នេះវាពាក់ព័ន្ធ។`;
    }

    return `Compatibility with ${target}: the product data mentions ${target}, so it should be relevant.`;
  }

  if (language === "km") {
    return `ភាពត្រូវគ្នាជាមួយ ${target}: ខ្ញុំមិនអាចបញ្ជាក់ពីទិន្នន័យផលិតផលបានទេ។`;
  }

  return `Compatibility with ${target}: I cannot confirm this from the product data.`;
}

function buildContextItemExplanation(item, input, language = "en") {
  const isKhmer = language === "km";
  const voltage = getContextItemVoltage(item);
  const compatibility = item.compatibilityInfo?.length ? item.compatibilityInfo.slice(0, 4).join(", ") : "";
  const compatibilityAnswer = answerCompatibilityQuestion(item, input, language);

  if (compatibilityAnswer) {
    return `${item.name}: ${compatibilityAnswer}`;
  }

  if (isKhmer) {
    if (input.includes("voltage") || input.includes("វ៉ុល")) {
      return `${item.name}: ${getKhmerVoltageText(item)}`;
    }

    if (input.includes("beginner") || input.includes("អ្នកចាប់ផ្តើម")) {
      return `${item.name}: ${getKhmerBeginnerText(item)} ${getKhmerStockText(item)}`;
    }

    return [
      `${item.name} គឺជា ${getKhmerCategoryText(item)}។`,
      getKhmerUseText(item),
      getKhmerVoltageText(item),
      getKhmerCompatibilityText(item),
      getKhmerBeginnerText(item),
      getKhmerStockText(item)
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (input.includes("voltage") || input.includes("វ៉ុល")) {
    return `${item.name}: ${voltage ? `Voltage: ${voltage}.` : "I cannot confirm this from the product data."}`;
  }

  if (input.includes("beginner") || input.includes("អ្នកចាប់ផ្តើម")) {
    return `${item.name}: ${getBeginnerText(item)} ${getContextStockText(item)}`;
  }

  return [
    `${item.name} is a ${item.type === "kit" ? "robot kit" : item.category || "product"}.`,
    item.description ? `Use: ${item.description}` : null,
    voltage ? `Voltage: ${voltage}.` : null,
    compatibility ? `Compatibility: ${compatibility}.` : null,
    getContextStockText(item)
  ]
    .filter(Boolean)
    .join(" ");
}

function buildContextComparison(firstItem, secondItem, language = "en") {
  if (language === "km") {
    return [
      `ប្រៀបធៀប ${firstItem.name} និង ${secondItem.name}។`,
      `${firstItem.name}: ${getKhmerCategoryText(firstItem)}, ${formatPrice(firstItem.price)}, ${getKhmerStockText(firstItem)} ${getKhmerVoltageText(firstItem)}`,
      `${secondItem.name}: ${getKhmerCategoryText(secondItem)}, ${formatPrice(secondItem.price)}, ${getKhmerStockText(secondItem)} ${getKhmerVoltageText(secondItem)}`,
      "ជ្រើសរើសតាមតួនាទីក្នុងគម្រោង វ៉ុល និងភាពត្រូវគ្នាដែលទិន្នន័យផលិតផលបានបញ្ជាក់។ បើព័ត៌មានមិនមាន ខ្ញុំមិនអាចបញ្ជាក់ពីទិន្នន័យផលិតផលបានទេ។"
    ].join(" ");
  }

  return [
    `Compare: ${firstItem.name} vs ${secondItem.name}.`,
    `${firstItem.name}: ${firstItem.category || firstItem.group || firstItem.type}, ${formatPrice(firstItem.price)}, ${getContextStockText(firstItem)}.`,
    `${secondItem.name}: ${secondItem.category || secondItem.group || secondItem.type}, ${formatPrice(secondItem.price)}, ${getContextStockText(secondItem)}.`,
    "Choose the one that matches your project role, voltage, and compatibility needs. I cannot confirm missing compatibility details beyond the product data."
  ].join(" ");
}

function getContextFollowUps(language = "en") {
  return language === "km"
    ? ["ពន្យល់អំពីទីមួយ", "វាប្រើជាមួយ Arduino បានទេ?", "មួយណាល្អសម្រាប់អ្នកចាប់ផ្តើម?", "ប្រៀបធៀបទីមួយ និងទីពីរ"]
    : ["Explain the first one", "Is it compatible with Arduino?", "Which one is best for beginners?", "Compare the first and second"];
}

function answerContextFollowUp(rawMessage, contextItems, language = "en") {
  const input = normalizeKhmerQuery(rawMessage).trim().toLowerCase();
  const items = normalizeContextItems(contextItems);
  const resolved = resolveContextReference(input, items);

  if (!resolved) {
    return null;
  }

  if (resolved.mode === "missing") {
    return {
      reply: "I only have one recent item in context. Please ask about the first one or choose another product name.",
      catalogMatches: [],
      followUps: getContextFollowUps(language)
    };
  }

  if (resolved.mode === "ambiguous") {
    return {
      reply: `Which item do you mean? ${resolved.items.slice(0, 5).map((item, index) => `${index + 1}. ${item.name}`).join(" ")}`,
      catalogMatches: resolved.items.slice(0, 5),
      followUps: getContextFollowUps(language)
    };
  }

  if (resolved.mode === "compare") {
    const comparedItems = resolved.items.map((contextItem) => ({ ...contextItem, includeDescription: true, displayMode: "detail" }));
    return {
      reply: buildContextComparison(comparedItems[0], comparedItems[1], language),
      catalogMatches: comparedItems,
      followUps: getContextFollowUps(language)
    };
  }

  const item = { ...resolved.items[0], includeDescription: true, displayMode: "detail" };
  const reply = resolved.mode === "best_beginner"
    ? `${item.name} looks like the best beginner choice from the recent recommendations. ${getBeginnerText(item)} ${getContextStockText(item)}`
    : buildContextItemExplanation(item, input, language);

  return {
    reply,
    catalogMatches: [item],
    catalogContext: buildChatbotContext([item]),
    catalogSummary: buildCatalogGroundingSummary("context follow-up", [item]),
    followUps: getContextFollowUps(language)
  };
}

function findCatalogEntryByContextItem(contextItem, products = [], robotKits = []) {
  const expectedType = contextItem.type === "kit" ? "kit" : "product";
  const source = expectedType === "kit" ? robotKits : products;
  const normalizedName = normalizeProductMention(contextItem.name);
  const normalizedSlug = normalizeProductMention(contextItem.slug);
  const normalizedId = String(contextItem.id || "");

  const item = source.find((candidate) => {
    return (
      (normalizedId && String(candidate.id || "") === normalizedId) ||
      (normalizedSlug && normalizeProductMention(candidate.slug) === normalizedSlug) ||
      (normalizedName && normalizeProductMention(candidate.name) === normalizedName)
    );
  });

  return item ? { item, type: expectedType, score: 100 } : null;
}

async function getGroundedDetailResponse(rawMessage, input, language = "en", lastRecommendedItems = []) {
  const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
  const contextItems = normalizeContextItems(lastRecommendedItems);
  const contextReference = resolveContextReference(input, contextItems);
  const wantsDetail = isProductDetailRequest(input);
  let matches = [];
  let mode = isComparisonRequest(input) ? "compare" : "explain";

  if (contextReference) {
    if (contextReference.mode === "missing") {
      return {
        reply: language === "km" ? "ខ្ញុំមានតែទំនិញមួយក្នុងបរិបទថ្មីៗ។ សូមសួរអំពីទំនិញនោះ ឬបញ្ជាក់ឈ្មោះផលិតផល។" : "I only have one recent item in context. Please ask about that item or name a product.",
        catalogMatches: [],
        followUps: []
      };
    }

    if (contextReference.mode === "ambiguous") {
      return {
        reply: buildClarificationReply(contextReference.items.map((item) => ({ item })), language),
        catalogMatches: contextReference.items.slice(0, 5),
        followUps: []
      };
    }

    matches = contextReference.items
      .map((item) => findCatalogEntryByContextItem(item, products, robotKits))
      .filter(Boolean);

    if (contextReference.mode === "best_beginner") {
      mode = "explain";
    }
  }

  if (!matches.length) {
    matches = findCatalogMentionMatches(input, products, robotKits);
  }

  if (!matches.length || (!wantsDetail && matches[0].score < 95)) {
    return null;
  }

  if (shouldAskCatalogClarification(input, matches)) {
    const items = matches
      .slice(0, 5)
      .map((match) => normalizeCatalogItem(match.item, match.type, ["exactName"], language));

    return {
      reply: buildClarificationReply(matches, language),
      catalogMatches: items,
      catalogContext: buildChatbotContext(items),
      catalogSummary: buildCatalogGroundingSummary("clarification options", items),
      followUps: []
    };
  }

  const selectedMatches = mode === "compare" ? matches.slice(0, 3) : matches.slice(0, 1);
  const includeDescription = shouldIncludeProductDescriptions({
    normalizedQuery: input,
    intent: mode === "compare" ? "compare_products" : "find_product",
    matchedItems: selectedMatches.map((match) => ({ item: { name: match.item.name }, score: match.score }))
  });
  const items = selectedMatches.map((match) => normalizeCatalogItem(match.item, match.type, ["exactName"], language, { includeDescription }));
  const catalogContext = buildChatbotContext(items);
  const fallbackReply =
    mode === "compare" && items.length >= 2
      ? buildContextComparison(items[0], items[1], language)
      : buildContextItemExplanation(items[0], input, language);

  return {
    reply: fallbackReply,
    catalogMatches: items,
    catalogContext,
    catalogSummary: buildCatalogGroundingSummary("grounded product detail", items),
    followUps: mode === "compare" ? [] : getProductDetailFollowUps(input, language, items[0]),
    responseMode: mode === "compare" ? "comparison" : "detail",
    modelPrompt: buildGroundedModelPrompt({
      message: rawMessage,
      catalogContext,
      recentContext: getRecentContextForPrompt(contextItems),
      language,
      mode
    })
  };
}

async function getConceptExplanationResponse(input, language = "en") {
  const conceptTerm = detectConceptTerm(input);

  if (!conceptTerm || !isConceptQuestion(input, conceptTerm)) {
    return null;
  }

  const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
  const deterministicSearch = findDeterministicCatalogRecommendations({
    products,
    robotKits,
    query: CONCEPT_CARD_QUERIES[conceptTerm] || conceptTerm,
    language,
    limit: 4
  });
  const items = deterministicSearch.matches.length ? normalizeDeterministicCatalogMatches(deterministicSearch, language).slice(0, 4) : [];
  const catalogContext = buildChatbotContext(items);

  return {
    reply: CONCEPT_EXPLANATIONS[conceptTerm],
    catalogMatches: items,
    catalogContext,
    catalogSummary: items.length ? buildCatalogGroundingSummary(`${conceptTerm} examples`, items) : null,
    followUps: getEducationalFollowUps(detectProjectTypes(normalizeQuery(conceptTerm)), items, language),
    responseMode: "educational"
  };
}

function scoreRobotDiscoveryEntry(entry) {
  const text = getSearchableText(entry.item);
  const name = normalizeText(entry.item.name);
  let score = 0;

  if (entry.type === "kit") score += 90;
  if (text.includes("robot car") || text.includes("robot kit")) score += 45;
  if (text.includes("chassis")) score += 42;
  if (text.includes("motor driver") || name.includes("l298n") || name.includes("tb6612") || name.includes("drv8833")) score += 40;
  if (text.includes("dc motor") || text.includes("gear motor") || text.includes("wheel")) score += 34;
  if (text.includes("ultrasonic") || text.includes("hc-sr04") || text.includes("line tracking") || text.includes("tcrt5000")) score += 30;
  if (text.includes("arduino") || text.includes("esp32") || entry.item.category === "Controllers") score += 24;
  if (entry.item.category === "Power" && (text.includes("battery") || text.includes("holder"))) score += 16;
  if (Number(getCatalogStock(entry.item, entry.type) || 0) > 0) score += 8;

  return score;
}

async function getRobotDiscoveryResponse(language = "en") {
  const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
  const entries = [
    ...robotKits.map((item) => ({ item, type: "kit" })),
    ...products.map((item) => ({ item, type: "product" }))
  ];
  const selected = entries
    .map((entry) => ({ ...entry, score: scoreRobotDiscoveryEntry(entry) }))
    .filter((entry) => entry.score > 0 && isCatalogItemBuildable(entry.item, entry.type))
    .sort((first, second) => second.score - first.score || Number(getCatalogStock(second.item, second.type) || 0) - Number(getCatalogStock(first.item, first.type) || 0))
    .slice(0, 8);
  const items = selected.map((entry) =>
    normalizeCatalogItem(entry.item, entry.type, ["projectType", "stock"], language, {
      group: entry.type === "kit" ? "Robot Kits" : "Robot-Building Parts"
    })
  );
  const catalogContext = buildChatbotContext(items);

  return {
    reply:
      language === "km"
        ? "Yes, I found robot kits and robot-building parts in the catalog. Here are useful options for building robots."
        : "Yes, I found robot kits and robot-building parts in the catalog. Here are useful options for building robots.",
    catalogMatches: items,
    catalogContext,
    catalogSummary: items.length ? buildCatalogGroundingSummary("robot product discovery", items) : null,
    followUps: localizeFollowUps(["Show kits", "Show motor drivers", "Build a robot car"], language),
    responseMode: "listing"
  };
}

function hasBuildableProjectMatches(projectDefinition, products = [], robotKits = []) {
  const matchingEntries = [
    ...products.map((item) => ({ item, type: "product" })),
    ...robotKits.map((item) => ({ item, type: "kit" }))
  ].filter((entry) => {
    const metadata = buildFallbackMetadataForItem(entry.item, entry.type);
    const projectTypes = Array.isArray(metadata.projectTypes) ? metadata.projectTypes : [];

    return projectDefinition.projectTypes.some((projectType) => projectTypes.includes(projectType));
  });

  if (projectDefinition.slug === "bluetooth-robot-car") {
    const hasWirelessControl = matchingEntries.some((entry) => buildFallbackMetadataForItem(entry.item, entry.type).projectTypes?.includes("wireless_control"));
    const hasRobotCarPart = matchingEntries.some((entry) => buildFallbackMetadataForItem(entry.item, entry.type).projectTypes?.includes("robot_car"));

    return hasWirelessControl && hasRobotCarPart;
  }

  return matchingEntries.length >= 3;
}

function normalizeRobotProjectCard(projectDefinition) {
  return {
    type: "project",
    title: projectDefinition.title,
    slug: projectDefinition.slug,
    query: projectDefinition.query,
    projectTypes: projectDefinition.projectTypes,
    parts: [],
    routeUrl: "",
    imageUrl: ""
  };
}

async function getRobotProjectBuilderOverviewResponse(language = "en") {
  const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
  const buildableProducts = products.filter((product) => isCatalogItemBuildable(product, "product"));
  const buildableRobotKits = robotKits.filter((kit) => isCatalogItemBuildable(kit, "kit"));
  const projectCards = ROBOT_PROJECT_CARD_DEFINITIONS
    .filter((projectDefinition) => hasBuildableProjectMatches(projectDefinition, buildableProducts, buildableRobotKits))
    .map(normalizeRobotProjectCard);

  return {
    reply:
      language === "km"
        ? "Choose a robot project first, then I will show the real catalog parts for that build."
        : "Choose a robot project first, then I will show the real catalog parts for that build.",
    catalogMatches: projectCards,
    catalogContext: buildChatbotContext([]),
    followUps: localizeFollowUps(["Build a line-following robot", "Build an obstacle-avoiding robot", "Build a Bluetooth robot car"], language),
    catalogSummary: null,
    responseMode: "project_list"
  };
}

async function getStoreLocationResponse(language = "en") {
  const settings = await getPublicStoreSupportSettings();
  const contactParts = [
    settings.phoneNumber ? `Phone: ${settings.phoneNumber}` : "",
    settings.supportEmail ? `Email: ${settings.supportEmail}` : ""
  ].filter(Boolean);
  const contactText = contactParts.length ? ` ${contactParts.join(" | ")}.` : "";
  const mapText = settings.locationUrl ? ` Map: ${settings.locationUrl}` : "";

  return {
    reply: settings.address
      ? `${settings.storeName} store location: ${settings.address}.${contactText}${mapText}`
      : `${settings.storeName} store location is not configured yet.${contactText}`,
    locationLink: settings.locationUrl || "",
    catalogSummary: null,
    catalogMatches: [],
    followUps: localizeFollowUps(["Delivery fee information", "Show robot kits", "Build a robot car"], language),
    responseMode: "support"
  };
}

async function getDeliveryFeeResponse(language = "en") {
  const settings = await getPublicStoreSupportSettings();
  const pickupText = settings.address ? ` Store pickup is available at ${settings.address}.${settings.locationUrl ? ` Map: ${settings.locationUrl}` : ""}` : "";

  return {
    reply: `${formatDeliveryFeeText(settings)}${pickupText}`,
    locationLink: settings.locationUrl || "",
    catalogSummary: null,
    catalogMatches: [],
    followUps: localizeFollowUps(["Store location", "Show robot kits", "Build a line-following robot"], language),
    responseMode: "support"
  };
}

function getCompatibilityProfile(input, parsedQuery, language = "en") {
  if (parsedQuery.filters.projectType && PROJECT_GUIDANCE[parsedQuery.filters.projectType]) {
    const profile = PROJECT_GUIDANCE[parsedQuery.filters.projectType];
    return { ...profile, reply: language === "km" ? profile.replyKm : profile.reply, followUps: localizeFollowUps(profile.followUps, language) };
  }

  if (input.includes("dc motor") || input.includes("l298n") || input.includes("motor driver")) {
    const profile = PROJECT_GUIDANCE["dc motor"];
    return { ...profile, reply: language === "km" ? profile.replyKm : profile.reply, followUps: localizeFollowUps(profile.followUps, language) };
  }

  if (input.includes("servo")) {
    const profile = PROJECT_GUIDANCE["servo motor"];
    return { ...profile, reply: language === "km" ? profile.replyKm : profile.reply, followUps: localizeFollowUps(profile.followUps, language) };
  }

  if (input.includes("esp32")) {
    return {
      reply:
        language === "km"
          ? "ESP32 ប្រើបានល្អជាមួយ sensors និង modules ជាច្រើន ជាពិសេសពេលវ៉ុលរបស់ module ត្រូវគ្នា។ វាសាកសមសម្រាប់គម្រោង WiFi IoT និងគ្រប់គ្រងរ៉ូបូត។"
          : "ESP32 works well with many sensors and modules, especially when the module voltage is compatible. It is a strong choice for WiFi IoT and robot control projects.",
      keywords: ["esp32", "sensor", "module", "controller"],
      followUps: localizeFollowUps(["Find ESP32 products", "5V products", "Show sensors"], language)
    };
  }

  if (input.includes("battery")) {
    return {
      reply:
        language === "km"
          ? "ជ្រើសថ្មតាមវ៉ុល និងចរន្តដែល motor ឬ kit ត្រូវការ។ Microcontroller ជាញឹកញាប់ត្រូវការ power ដែលបាន regulate ខណៈ motor ជាទូទៅត្រូវការ supply ផ្សេង។"
          : "Choose a battery based on the motor or kit voltage and current needs. Microcontrollers often need regulated power, while motors usually need a separate motor supply.",
      keywords: ["battery", "power", "motor", "robot car"],
      followUps: localizeFollowUps(["Show batteries", "Robot under $30", "Check motor driver"], language)
    };
  }

  return {
    reply:
      language === "km"
        ? "សម្រាប់ភាពត្រូវគ្នា សូមពិនិត្យ controller, វ៉ុល module, តម្រូវការ power របស់ motor និងប្រភេទ connector។ បើមាន motor គួរប្រើ motor driver ជំនួសការផ្គត់ផ្គង់ពី microcontroller ដោយផ្ទាល់។"
        : "For compatibility, match the controller, module voltage, motor power needs, and connector style. When motors are involved, use a motor driver instead of powering them directly from a microcontroller.",
    keywords: parsedQuery.keywords,
    followUps: localizeFollowUps(["Show parts", "Show kits", "Compare options"], language)
  };
}

function buildRecommendationReply(prefix, items, language = "en") {
  if (language === "km") {
    return items.length ? `${prefix} ជម្រើសណែនាំ៖ ${formatItemListWithLinks(items)}។${getOutOfStockNote(items, language)}` : prefix;
  }

  return prefix;
}

function getDeterministicCatalogPrefix(searchResult, items, language = "en") {
  const unavailableKitNames = searchResult.unavailableMatches
    .filter((entry) => entry.item.type === "kit" && entry.item.stock <= 0)
    .map((entry) => entry.item.name);

  if (!items.length) {
    return language === "km"
      ? "ខ្ញុំរកមិនឃើញទំនិញដែលត្រូវនឹងសំណួរនេះទេ។ សូមបញ្ជាក់ថាអ្នកចង់បាន sensor, line-following robot, obstacle-avoiding robot ឬ Arduino beginner parts។"
      : "I could not find a reliable catalog match for that. Try asking for robot sensors, line-following robot parts, obstacle-avoiding robot parts, or Arduino beginner parts.";
  }

  if (searchResult.intent === "recommend_kit") {
    const unavailableText = unavailableKitNames.length
      ? language === "km"
        ? ` ${unavailableKitNames.join(", ")} អស់ពីស្តុកឥឡូវនេះ។`
        : ` ${unavailableKitNames.join(", ")} is currently out of stock.`
      : "";

    return language === "km"
      ? `នេះជាឈុតរ៉ូបូតដែលត្រូវនឹងសំណួររបស់អ្នក។${unavailableText}`
      : `Here are the robot kits that match your request.${unavailableText}`;
  }

  if (searchResult.intent === "budget_recommendation") {
    return language === "km"
      ? "នេះជាជម្រើសតម្លៃទាបដែលត្រូវនឹងសំណួររបស់អ្នក។"
      : "Here are the most relevant lower-price options I found.";
  }

  if (searchResult.intent === "compatibility_question") {
    return language === "km"
      ? "នេះជាជម្រើសដែលមើលទៅសាកសមតាមទិន្នន័យ compatibility ក្នុង catalog។"
      : "These options look compatible based on the catalog data.";
  }

  if (searchResult.intent === "recommend_project_parts") {
    return language === "km"
      ? "នេះជាគ្រឿងសំខាន់ៗសម្រាប់គម្រោងរបស់អ្នក ដោយជ្រើសពីទំនិញពិតក្នុង catalog។"
      : "Here are useful parts for that project, selected from the live catalog.";
  }

  return language === "km"
    ? "ខ្ញុំរកឃើញជម្រើសដែលពាក់ព័ន្ធក្នុង catalog។"
    : "I found a few relevant catalog options.";
}

function normalizeDeterministicCatalogMatches(searchResult, language = "en") {
  return searchResult.matches.map((entry) => ({
    ...normalizeCatalogItem(entry.item.source, entry.item.type, entry.reasonCodes, language, {
      group: entry.group || null,
      includeDescription: searchResult.includeDescriptions
    }),
    reason: getCatalogMatchReason(entry),
    reasonLabels: [getCatalogMatchReason(entry)]
  }));
}

function getPriceFilterLabel(price, referenceItem = null) {
  if (!price) {
    return "matching your price filter";
  }

  if (referenceItem) {
    const direction = ["lt", "lte"].includes(price.operator) ? "cheaper than" : "more expensive than";
    return `${direction} ${referenceItem.name} (${formatPrice(referenceItem.price)})`;
  }

  if (price.operator === "between") {
    return `between $${Number(price.min).toFixed(2)} and $${Number(price.max).toFixed(2)}`;
  }

  if (["gt", "gte"].includes(price.operator)) {
    return `above $${Number(price.min).toFixed(2)}`;
  }

  return `under $${Number(price.max).toFixed(2)}`;
}

function itemMatchesPriceFilter(item, price, referenceItem = null) {
  const value = Number(item.price || 0);

  if (!Number.isFinite(value)) {
    return false;
  }

  if (referenceItem) {
    const referencePrice = Number(referenceItem.price || 0);
    if (!Number.isFinite(referencePrice)) return false;
    if (price.operator === "lt") return value < referencePrice;
    if (price.operator === "lte") return value <= referencePrice;
    if (price.operator === "gt") return value > referencePrice;
    if (price.operator === "gte") return value >= referencePrice;
  }

  if (price.operator === "between") {
    return value >= Number(price.min) && value <= Number(price.max);
  }

  if (["gt", "gte"].includes(price.operator)) {
    return value >= Number(price.min);
  }

  return value <= Number(price.max);
}

function getFilterCandidateItems(products = [], robotKits = [], entityType = "both") {
  if (entityType === "product" || entityType === "category") {
    return products.map((item) => ({ item, type: "product" }));
  }

  if (entityType === "kit") {
    return robotKits.map((item) => ({ item, type: "kit" }));
  }

  return [
    ...products.map((item) => ({ item, type: "product" })),
    ...robotKits.map((item) => ({ item, type: "kit" }))
  ];
}

function resolvePriceReference(reference, products = [], robotKits = [], entityType = "both") {
  const normalizedReference = normalizeProductMention(reference);

  if (!normalizedReference) {
    return { status: "missing", matches: [] };
  }

  const candidates = getFilterCandidateItems(products, robotKits, entityType === "category" ? "product" : entityType)
    .map((entry) => {
      const text = normalizeProductMention([
        entry.item.name,
        entry.item.slug,
        entry.item.sku,
        entry.item.level,
        entry.item.category,
        entry.type === "kit" ? "robot kit kit" : "product"
      ].join(" "));
      const referenceTerms = normalizedReference.split(/\s+/).filter((term) => term.length > 2);
      const exact = text.includes(normalizedReference) ? 100 : 0;
      const termScore = referenceTerms.reduce((score, term) => score + (text.includes(term) ? 12 : 0), 0);
      const beginnerKitScore = entry.type === "kit" && normalizedReference.includes("beginner") && normalizeText(entry.item.level).includes("beginner") ? 60 : 0;

      return {
        ...entry,
        score: exact + termScore + beginnerKitScore
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((first, second) => second.score - first.score || Number(first.item.price || 0) - Number(second.item.price || 0));

  if (!candidates.length) {
    return { status: "missing", matches: [] };
  }

  const topScore = candidates[0].score;
  const closeMatches = candidates.filter((entry) => entry.score === topScore);

  if (normalizedReference.includes("beginner") && candidates[0].type === "kit") {
    return { status: "found", match: candidates[0] };
  }

  if (closeMatches.length > 1 && topScore < 100) {
    return { status: "ambiguous", matches: closeMatches.slice(0, 3) };
  }

  return { status: "found", match: candidates[0] };
}

function buildNoFilterMatchesReply(parsedQuery, priceLabel, language = "en") {
  const target =
    parsedQuery.entityType === "kit"
      ? "robot kits"
      : parsedQuery.entityType === "category"
        ? "categories with products"
        : "products";

  return language === "km"
    ? `ខ្ញុំរកមិនឃើញ ${target} ${priceLabel} នៅពេលនេះទេ។`
    : `I couldn't find ${target} ${priceLabel} right now. Try changing the price or choosing a category.`;
}

function buildCatalogFilterReply(parsedQuery, items, priceLabel, categories = [], language = "en") {
  if (parsedQuery.entityType === "category") {
    if (!categories.length) {
      return buildNoFilterMatchesReply(parsedQuery, priceLabel, language);
    }

    const categoryText = categories.length === 1 ? categories[0] : `${categories.slice(0, -1).join(", ")} and ${categories[categories.length - 1]}`;
    return language === "km"
      ? `ខ្ញុំរកឃើញផលិតផល ${priceLabel} ក្នុង categories: ${categoryText}។`
      : `I found products ${priceLabel} in these categories: ${categoryText}.`;
  }

  if (!items.length) {
    return buildNoFilterMatchesReply(parsedQuery, priceLabel, language);
  }

  const target = parsedQuery.entityType === "kit" ? "robot kits" : "products";
  return language === "km"
    ? `ខ្ញុំរកឃើញ ${target} ${priceLabel} ពី catalog។`
    : `I found a few ${target} ${priceLabel}. Here are the best matches from the catalog.`;
}

async function getCatalogFilterResponse(parsedQuery, products, robotKits, language = "en") {
  const price = parsedQuery.filters?.price;

  if (!price) {
    return null;
  }

  const referenceResult = price.reference
    ? resolvePriceReference(price.reference, products, robotKits, parsedQuery.entityType || "both")
    : { status: "none" };

  if (referenceResult.status === "missing") {
    return {
      items: [],
      followUps: localizeFollowUps(["Show products", "Show kits", "Compare options"], language),
      prefix: `I couldn't find "${price.reference}" in the catalog. Try the exact product or kit name.`,
      label: "catalog price filter",
      responseMode: "listing"
    };
  }

  if (referenceResult.status === "ambiguous") {
    return {
      items: [],
      followUps: referenceResult.matches.map((entry) => entry.item.name).slice(0, 3),
      prefix: `I found more than one match for "${price.reference}". Which one do you mean?`,
      label: "catalog price filter",
      responseMode: "fallback"
    };
  }

  const referenceItem = referenceResult.status === "found" ? referenceResult.match.item : null;
  const priceLabel = getPriceFilterLabel(price, referenceItem);
  const candidates = getFilterCandidateItems(products, robotKits, parsedQuery.entityType || "both")
    .filter((entry) => isCatalogItemBuildable(entry.item, entry.type))
    .filter((entry) => {
      if (parsedQuery.filters.category && entry.type === "product" && entry.item.category !== parsedQuery.filters.category) {
        return false;
      }

      if (referenceResult.status === "found" && entry.type === referenceResult.match.type && entry.item.id === referenceResult.match.item.id) {
        return false;
      }

      return itemMatchesPriceFilter(entry.item, price, referenceItem);
    })
    .sort((first, second) => {
      const direction = ["gt", "gte"].includes(price.operator) ? -1 : 1;
      return direction * (Number(first.item.price || 0) - Number(second.item.price || 0)) || Number(getCatalogStock(second.item, second.type) || 0) - Number(getCatalogStock(first.item, first.type) || 0);
    });

  const selected = candidates.slice(0, 8).map((entry) =>
    normalizeCatalogItem(entry.item, entry.type, ["budget", parsedQuery.filters.category ? "category" : "description"], language, {
      parsedQuery
    })
  );
  const categories = [...new Set(candidates.filter((entry) => entry.type === "product").map((entry) => entry.item.category).filter(Boolean))].sort();

  return {
    items: selected,
    followUps: buildFollowUps(parsedQuery, selected, language),
    prefix: buildCatalogFilterReply(parsedQuery, selected, priceLabel, categories, language),
    label: "catalog price filter",
    responseMode: "listing"
  };
}

export async function searchCatalogForChat(input, parsedQuery, language = "en") {
  const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
  logChatbotServiceEvent("db_query", {
    source: "catalog_search",
    productCount: products.length,
    robotKitCount: robotKits.length,
    detectedIntent: parsedQuery.intent,
    filters: parsedQuery.filters
  });
  const buildableProducts = products.filter((product) => isCatalogItemBuildable(product, "product"));
  const buildableRobotKits = robotKits.filter((kit) => isCatalogItemBuildable(kit, "kit"));

  if (parsedQuery.intent === "catalog_filter") {
    return getCatalogFilterResponse(parsedQuery, products, robotKits, language);
  }

  if (parsedQuery.intent === "complete_build") {
    const buildProjectType = parsedQuery.completeBuildProjectType || "robot car";
    const groups = BUILD_GROUPS_BY_PROJECT_TYPE[buildProjectType] || BUILD_GROUPS_BY_PROJECT_TYPE["robot car"];
    const buildText = BUILD_SET_LABEL_TEXT[buildProjectType] || BUILD_SET_LABEL_TEXT["robot car"];
    const { items, missingGroups, totalPrice } = buildCompleteRobotCarItems(buildableProducts, groups, language);
    const missingText = missingGroups.map((group) => `I cannot find a suitable ${group} in the current catalog.`);
    const prefix =
      language === "km"
        ? [buildText.km, ...missingText].join(" ")
        : [buildText.en, ...missingText].join(" ");

    return {
      items,
      followUps: getRobotCarBuildFollowUps(language),
      prefix,
      label: buildText.label,
      buildSummary: {
        totalPrice,
        voltageWarning: getBuildVoltageWarning(items, language)
      }
    };
  }

  const deterministicSearch = findDeterministicCatalogRecommendations({
    products: buildableProducts,
    robotKits: buildableRobotKits,
    query: input,
    language,
    limit: parsedQuery.intent === "kit_search" || parsedQuery.entityType === "kit" ? 5 : 8
  });

  if (deterministicSearch.matches.length || deterministicSearch.intent !== "unknown") {
    const items = normalizeDeterministicCatalogMatches(deterministicSearch, language);
    const responseMode = detectResponseMode({
      intent: deterministicSearch.intent,
      parsedIntent: parsedQuery.intent,
      normalizedQuery: deterministicSearch.normalizedQuery,
      detectedProjectTypes: deterministicSearch.projectTypes,
      matchedItems: items
    });
    const compactReply = buildCompactChatReply({
      intent: deterministicSearch.intent,
      responseMode,
      normalizedQuery: deterministicSearch.normalizedQuery,
      detectedProjectTypes: deterministicSearch.projectTypes,
      matchedItems: items,
      itemType: parsedQuery.entityType || (items.every((item) => item.type === "kit") ? "kit" : null),
      language
    });

    return {
      items,
      followUps: items.length ? deterministicSearch.followUps : deterministicSearch.followUps,
      prefix: compactReply || getDeterministicCatalogPrefix(deterministicSearch, items, language),
      label: deterministicSearch.label,
      normalizedQuery: deterministicSearch.normalizedQuery,
      detectedIntent: deterministicSearch.intent,
      detectedProjectTypes: deterministicSearch.projectTypes,
      responseMode,
      modelPrompt: items.length && (responseMode === "detail" || responseMode === "comparison")
        ? buildCatalogGroundedOllamaPrompt({
            message: input,
            normalizedQuery: deterministicSearch.normalizedQuery,
            intent: deterministicSearch.intent,
            projectTypes: deterministicSearch.projectTypes,
            matches: deterministicSearch.matches,
            language,
            includeDescriptions: deterministicSearch.includeDescriptions
          })
        : null
    };
  }

  if (parsedQuery.intent === "compatibility") {
    const compatibility = getCompatibilityProfile(input, parsedQuery, language);
    const mentionedProduct = findMentionedProduct(input, products);
    const items = mentionedProduct
      ? rankCompatibleProductItems(products, mentionedProduct, language)
      : rankCatalogItems({
          products: buildableProducts,
          robotKits: buildableRobotKits,
          parsedQuery: { ...parsedQuery, entityType: "product" },
          compatibilityKeywords: compatibility.keywords,
          language
        });

    return { items, followUps: compatibility.followUps, prefix: compatibility.reply, label: "compatibility recommendations" };
  }

  if (parsedQuery.intent === "compare") {
    const items = rankCatalogItems({ products: buildableProducts, robotKits: buildableRobotKits, parsedQuery, language });
    const prefix =
      language === "km"
        ? items.length
          ? `នេះជាជម្រើសសម្រាប់ប្រៀបធៀប៖ ${formatItemListWithLinks(items)}។ ESP32 ល្អសម្រាប់ WiFi IoT, Arduino ស្រួលសម្រាប់អ្នកចាប់ផ្តើម wiring សាមញ្ញ, ហើយ robot kits ល្អបើចង់បានគម្រោងពេញលេញ។`
          : "សម្រាប់អ្នកចាប់ផ្តើម Arduino-style boards ស្រួលសម្រាប់ wiring ដំបូង ខណៈ ESP32 ល្អជាងពេលត្រូវការ WiFi ឬ Bluetooth។"
        : items.length
          ? `Here are options to compare: ${formatItemListWithLinks(items)}. Choose ESP32 for WiFi IoT projects, Arduino for very simple beginner wiring, and robot kits when you want a complete build path.`
          : "For beginners, Arduino-style boards are simple for first wiring projects, while ESP32 is better when you need WiFi or Bluetooth.";

    return { items, followUps: localizeFollowUps(["Beginner only", "Find ESP32 products", "Show kits"], language), prefix, label: "comparison options", responseMode: "comparison" };
  }

  if (["catalog_search", "kit_search", "budget_search"].includes(parsedQuery.intent)) {
    const items = rankCatalogItems({ products: buildableProducts, robotKits: buildableRobotKits, parsedQuery, language });
    const responseMode = detectResponseMode({
      intent: parsedQuery.intent === "kit_search" ? "recommend_kit" : parsedQuery.intent === "budget_search" ? "budget_recommendation" : "find_product",
      parsedIntent: parsedQuery.intent,
      normalizedQuery: input,
      detectedProjectTypes: parsedQuery.filters.projectType ? [parsedQuery.filters.projectType] : [],
      matchedItems: items
    });
    const prefix = buildCompactChatReply({
      intent: parsedQuery.intent === "kit_search" ? "recommend_kit" : parsedQuery.intent === "budget_search" ? "budget_recommendation" : "find_product",
      responseMode,
      normalizedQuery: input,
      detectedProjectTypes: parsedQuery.filters.projectType ? [parsedQuery.filters.projectType] : [],
      matchedItems: items,
      itemType: parsedQuery.entityType,
      language
    });

    return { items, followUps: buildFollowUps(parsedQuery, items, language), prefix, label: "catalog recommendations", responseMode };
  }

  return null;
}

function detectEducationalIntent(rawMessage = "", normalizedInput = "") {
  const raw = String(rawMessage || "").toLowerCase();
  const input = String(normalizedInput || raw).toLowerCase();
  const projectTypes = detectProjectTypes(normalizeQuery(input));
  const isProjectTopic =
    projectTypes.length > 0 ||
    /\b(black line|white line|line[\s-]*(following|follower)?|obstacle[\s-]*(avoiding|avoidance)|robot car|dc motors?|motors?|sensor|environment|monitoring|temperature|humidity|wireless|communication|power|voltage|battery|display)\b/i.test(input) ||
    /\b(pid|slam|pwm|imu|encoder|servo|microcontroller|algorithm|control\s+loop|kinematics|odometry)\b/i.test(input) ||
    /រ៉ូបូត|ខ្សែ|ឧបសគ្គ|ម៉ូទ័រ|សេនស័រ/.test(rawMessage);
  const isBuyingIntent = /\b(show|buy|price|stock|available|cheap|budget|recommend|what should i buy)\b/i.test(input);

  if (!isProjectTopic) {
    return null;
  }

  if (
    /\b(cannot|can't|does not|doesn't|not working|not detect|not moving|not spinning|won't move|no signal|troubleshoot|fix|restart|restarting|brownout|reset|unstable|overheating|weak signal|pairing)\b/i.test(input) ||
    /មិន|រក.*មិនឃើញ|ខូច|ដំណើរការមិន/.test(rawMessage)
  ) {
    return "troubleshooting";
  }

  if (
    /\bhow\s+to\s+(build|make|create|power|connect|wire)|how\s+do\s+i\s+(build|make|create|power|connect|wire)\b/i.test(input) ||
    /ត្រូវការអ្វី.*ធ្វើ|ធ្វើ.*យ៉ាង/.test(rawMessage)
  ) {
    return "how_to_build";
  }

  if (
    /\bwhat\s+is\b|\bhow\s+does\b|\bhow\s+do\b|\bexplain\b/i.test(input) ||
    /គឺជាអ្វី|ដំណើរការយ៉ាងដូចម្តេច|ពន្យល់/.test(rawMessage)
  ) {
    return isBuyingIntent ? null : "project_explanation";
  }

  return null;
}

function buildEducationalCatalogQuery(input, educationIntent, projectTypes = []) {
  if (educationIntent === "troubleshooting") {
    if (input.includes("restart") || input.includes("restarting") || input.includes("brownout") || input.includes("reset") || input.includes("unstable voltage") || input.includes("esp32")) {
      return "power system lm2596 regulator battery converter power module";
    }

    if (input.includes("connect") || input.includes("pairing") || input.includes("weak signal") || input.includes("wireless") || input.includes("nrf24") || input.includes("lora")) {
      return "wireless communication nrf24 lora bluetooth esp32 module";
    }

    if (input.includes("black line") || input.includes("line")) {
      return "line following robot parts tcrt5000 sensor motor driver";
    }

    if (input.includes("dc motor") || input.includes("motor")) {
      return "dc motor robot car motor driver battery";
    }

    if (input.includes("obstacle")) {
      return "obstacle avoiding robot ultrasonic sensor motor driver";
    }
  }

  if (projectTypes.includes("line_follower")) {
    return "what do i need for line following robot";
  }

  if (projectTypes.includes("obstacle_avoider")) {
    return "what do i need for obstacle avoiding robot";
  }

  if (projectTypes.includes("robot_car")) {
    return "robot car controller motor driver sensor";
  }

  if (projectTypes.includes("environment_monitoring")) {
    return "environment monitoring temperature humidity gas soil water sensor";
  }

  if (projectTypes.includes("wireless_control")) {
    return "wireless robot communication nrf24 lora bluetooth esp32";
  }

  if (projectTypes.includes("power_system")) {
    return "power system battery regulator converter lm2596 charger";
  }

  if (projectTypes.includes("iot_robot")) {
    return "iot robot wireless communication esp32 esp8266 sensor display";
  }

  return input;
}

function getEducationalFallbackReply({ intent, projectTypes = [], query = "", language = "en" }) {
  const isKhmer = language === "km";
  const normalizedQuery = normalizeQuery(query);
  const projectType =
    projectTypes[0] ||
    (normalizedQuery.includes("line") ? "line_follower" : null) ||
    (normalizedQuery.includes("obstacle") ? "obstacle_avoider" : null) ||
    "general_robotics";

  if (intent === "troubleshooting") {
    if (projectTypes.includes("power_system") || normalizedQuery.includes("restart") || normalizedQuery.includes("brownout") || normalizedQuery.includes("reset")) {
      return isKhmer
        ? [
            "បើ board ដូចជា ESP32 restart ញឹកញាប់ វាអាចជាបញ្ហា power ឬ voltage drop។",
            "- Check: power supply មានចរន្តគ្រប់គ្រាន់ទេ?",
            "- Check: ground រួមគ្នារវាង battery, regulator និង board ទេ?",
            "- Fix: ប្រើ voltage regulator/power module សមរម្យ ដូចជា LM2596 ប្រសិនបើត្រូវ step-down ពី battery ខ្ពស់។",
            "- Test: វាស់ voltage ពេល motor ឬ WiFi ដំណើរការ ដើម្បីរក brownout/reset។"
          ].join("\n")
        : [
            "If a board such as ESP32 keeps restarting, the likely cause is power instability or voltage drop.",
            "- Check: does the supply provide enough current?",
            "- Check: do the battery, regulator, and board share ground?",
            "- Fix: use a suitable regulator or power module such as LM2596 when stepping down from a higher-voltage battery.",
            "- Test: measure voltage while motors or WiFi are active to catch brownout/reset issues."
          ].join("\n");
    }

    if (projectTypes.includes("wireless_control") || normalizedQuery.includes("wireless") || normalizedQuery.includes("signal") || normalizedQuery.includes("pair")) {
      return isKhmer
        ? [
            "Wireless module មិន connect ឬ signal ខ្សោយ អាចមកពី power, wiring, antenna ឬ channel/config មិនត្រូវ។",
            "- Check: module ត្រូវវ៉ុលត្រឹមត្រូវទេ, ពិសេស 3.3V modules។",
            "- Check: SPI/UART pins និង ground ត្រឹមត្រូវទេ?",
            "- Fix: ដាក់ capacitor ជិត module ប្រសិនបើ power មិនស្ថេរ និងសាកល្បងចម្ងាយខ្លីជាមុន។"
          ].join("\n")
        : [
            "Wireless connection problems usually come from power, wiring, antenna placement, or channel/config mismatch.",
            "- Check: is the module using the correct voltage, especially 3.3V-only modules?",
            "- Check: are SPI/UART pins and ground connected correctly?",
            "- Fix: add stable power near the module and test at short range before increasing distance."
          ].join("\n");
    }

    if (isKhmer) {
      return [
        "សូមពិនិត្យពីរបីចំណុចមុន៖",
        "- Power: ថ្មគ្រប់វ៉ុលទេ និង ground រួមគ្នាទេ?",
        "- Wiring: sensor/motor driver ភ្ជាប់ pin ត្រឹមត្រូវទេ?",
        "- Code: តម្លៃ threshold ឬ pin number ត្រូវគ្នានឹង wiring ទេ?",
        "- Test: សាកល្បង sensor ដាច់ដោយឡែក ហើយបន្ទាប់មកសាក motor ដាច់ដោយឡែក។",
        "កុំបញ្ចូល motor ដោយផ្ទាល់ពី microcontroller; ប្រើ motor driver និង power supply សមរម្យ។"
      ].join("\n");
    }

    return [
      "Start with the basics:",
      "- Power: check battery voltage and make sure grounds are shared.",
      "- Wiring: confirm sensor and motor driver pins match your code.",
      "- Code: verify pin numbers, thresholds, and motor direction logic.",
      "- Test: isolate the sensor first, then test each motor separately.",
      "Do not power DC motors directly from a microcontroller; use a motor driver and suitable motor supply."
    ].join("\n");
  }

  if (intent === "how_to_build") {
    if (projectType === "environment_monitoring") {
      return isKhmer
        ? [
            "Environment monitoring project ប្រើ sensors ដូចជា DHT11/DHT22/BME280 ឬ water/soil sensors ដើម្បីវាស់បរិស្ថាន។",
            "- Parts: controller, environment sensor, wires, power, optional display/wireless module.",
            "- Wiring overview: sensor data pin ទៅ controller, VCC/GND ទៅ power ត្រឹមត្រូវ។",
            "- Logic: អាន sensor, បង្ហាញតម្លៃ ឬផ្ញើទៅ IoT dashboard, ហើយ test calibration ជាមុន។"
          ].join("\n")
        : [
            "An environment monitoring project uses sensors such as DHT11/DHT22/BME280 or water/soil sensors to measure conditions.",
            "- Parts: controller, environment sensor, wires, power, optional display or wireless module.",
            "- Wiring overview: sensor data pin to controller, VCC/GND to the correct power rails.",
            "- Logic: read the sensor, show or transmit values, then test calibration before relying on the readings."
          ].join("\n");
    }

    if (projectType === "wireless_control" || projectType === "iot_robot") {
      return isKhmer
        ? [
            "Wireless/IoT robot ប្រើ communication module ដូចជា ESP32, NRF24L01, Bluetooth ឬ LoRa ដើម្បីផ្ញើ command/data។",
            "- Parts: controller, wireless module, sensor/actuator, power, wires.",
            "- Wiring overview: module ទៅ communication pins របស់ controller និង power ត្រឹមត្រូវ។",
            "- Logic: ផ្ញើ command, validate response, ហើយ test range ជាជំហានៗ។"
          ].join("\n")
        : [
            "A wireless or IoT robot uses a communication module such as ESP32, NRF24L01, Bluetooth, or LoRa to send commands or data.",
            "- Parts: controller, wireless module, sensor/actuator, power, wires.",
            "- Wiring overview: connect the module to the controller communication pins and correct voltage.",
            "- Logic: send commands, validate responses, and test range gradually."
          ].join("\n");
    }

    if (projectType === "power_system") {
      return isKhmer
        ? [
            "Power system project ជ្រើស battery, switch, charger និង regulator ដើម្បីផ្គត់ផ្គង់ voltage ត្រឹមត្រូវ។",
            "- Parts: battery/battery holder, power switch, regulator/converter, wires.",
            "- Wiring overview: battery ទៅ regulator, regulator output ទៅ board/load តាម voltage ដែលត្រូវការ។",
            "- Safety: កុំភ្ជាប់ voltage ខ្ពស់ទៅ board ដោយផ្ទាល់; វាស់ output មុនភ្ជាប់។"
          ].join("\n")
        : [
            "A power system project chooses the battery, switch, charger, and regulator needed to provide the right voltage.",
            "- Parts: battery or holder, power switch, regulator/converter, wires.",
            "- Wiring overview: battery to regulator, regulator output to the board/load at the required voltage.",
            "- Safety: do not feed high battery voltage directly into a board; measure the output before connecting it."
          ].join("\n");
    }

    if (projectType === "line_follower") {
      return isKhmer
        ? [
            "Line-following robot សាងសង់ដោយប្រើ sensor ដូចជា TCRT5000 ដើម្បីអានខ្សែខ្មៅ/ស។",
            "- Parts: controller, line sensors, motor driver, DC gear motors, chassis, wheels, battery, wires.",
            "- Wiring overview: sensor outputs ទៅ controller, controller outputs ទៅ motor driver, motor driver ទៅ motors.",
            "- Logic: អាន sensor, បើខ្សែទៅឆ្វេង បន្ថយ/បន្ថែមល្បឿន motor ម្ខាង; បើនៅកណ្តាល រត់ត្រង់។",
            "- Testing: សាក sensor threshold លើផ្ទៃខ្មៅ/ស មុនពេលបើក motor។"
          ].join("\n")
        : [
            "A line-following robot uses sensors such as TCRT5000 to read a dark/light line.",
            "- Parts: controller, line sensors, motor driver, DC gear motors, chassis, wheels, battery, wires.",
            "- Wiring overview: sensors go to the controller, controller outputs go to the motor driver, motor driver powers the motors.",
            "- Logic: read the sensors, slow/speed one side when the line shifts, and drive straight when centered.",
            "- Testing: calibrate the sensor threshold on black and white surfaces before running the motors."
          ].join("\n");
    }

    return isKhmer
      ? [
          "សម្រាប់គម្រោង robot សាមញ្ញ ចាប់ផ្តើមពី parts សំខាន់ៗ៖ controller, sensor, motor driver, motors, chassis, power និង wires.",
          "- Wiring overview: sensor ទៅ controller, controller ទៅ driver, driver ទៅ motor.",
          "- Logic: អាន sensor, សម្រេចចិត្ត, បញ្ជា motor.",
          "- Testing: សាក sensor និង motor ដាច់ដោយឡែក មុនបញ្ចូលជាគម្រោងពេញ។"
        ].join("\n")
      : [
          "For a simple robot project, start with the core parts: controller, sensor, motor driver, motors, chassis, power, and wires.",
          "- Wiring overview: sensor to controller, controller to driver, driver to motor.",
          "- Logic: read sensors, decide what to do, then drive the motors.",
          "- Testing: test sensors and motors separately before combining the full project."
        ].join("\n");
  }

  if (projectType === "line_follower") {
    return isKhmer
      ? [
          "Line-following robot គឺជា robot ដែលអាចដើរតាមខ្សែពណ៌ខ្មៅ ឬពណ៌សលើផ្ទៃ។",
          "- Main components: controller, line sensor ដូចជា TCRT5000, motor driver, motors, chassis និង battery.",
          "- Working principle: sensor អានភាពខុសគ្នារវាងខ្សែ និងផ្ទៃ បន្ទាប់មក controller កែសម្រួលល្បឿន motor ឆ្វេង/ស្តាំ។"
        ].join("\n")
      : [
          "A line-following robot follows a dark or light line on the floor.",
          "- Main components: controller, line sensor such as TCRT5000, motor driver, motors, chassis, and battery.",
          "- Working principle: the sensor reads contrast, then the controller adjusts left/right motor speed to stay on the line."
        ].join("\n");
  }

  if (projectType === "obstacle_avoider") {
    return isKhmer
      ? [
          "Obstacle avoiding robot គឺជា robot ដែលវាស់ចម្ងាយទៅឧបសគ្គ ហើយប្តូរទិសដៅមុនបុក។",
          "- Main components: controller, distance sensor ដូចជា HC-SR04, motor driver, motors, chassis និង battery.",
          "- Working principle: sensor វាស់ចម្ងាយ; បើជិតពេក controller បញ្ឈប់ បត់ ឬជ្រើសផ្លូវថ្មី។"
        ].join("\n")
      : [
          "An obstacle-avoiding robot measures distance to objects and changes direction before it hits them.",
          "- Main components: controller, distance sensor such as HC-SR04, motor driver, motors, chassis, and battery.",
          "- Working principle: the sensor measures distance; if something is too close, the controller stops, turns, or chooses a new path."
        ].join("\n");
  }

  if (projectType === "environment_monitoring") {
    return isKhmer
      ? [
          "Environment monitoring project គឺជា project ដែលវាស់ temperature, humidity, gas, soil ឬ water level។",
          "- Main components: controller, environment sensor, power, optional display ឬ wireless module.",
          "- Working principle: sensor ផ្លាស់ប្តូរទិន្នន័យទៅជា signal ហើយ controller អាន/បង្ហាញ/ផ្ញើតម្លៃ។"
        ].join("\n")
      : [
          "An environment monitoring project measures values such as temperature, humidity, gas, soil moisture, or water level.",
          "- Main components: controller, environment sensor, power, optional display or wireless module.",
          "- Working principle: the sensor converts conditions into a signal, then the controller reads, displays, or transmits the values."
        ].join("\n");
  }

  if (projectType === "wireless_control" || projectType === "iot_robot") {
    return isKhmer
      ? [
          "Wireless/IoT robotics project ប្រើ module ដូចជា NRF24L01, Bluetooth, LoRa, ESP32 ឬ ESP8266 សម្រាប់ command/data។",
          "- Main components: controller, communication module, power និង sensor/actuator។",
          "- Working principle: controller ផ្ញើ និងទទួល data តាម wireless link ដើម្បី control ឬ telemetry។"
        ].join("\n")
      : [
          "A wireless or IoT robotics project uses modules such as NRF24L01, Bluetooth, LoRa, ESP32, or ESP8266 for commands and data.",
          "- Main components: controller, communication module, power, and sensor/actuator.",
          "- Working principle: the controller sends and receives data over a wireless link for control or telemetry."
        ].join("\n");
  }

  if (projectType === "power_system") {
    return isKhmer
      ? [
          "Power system ក្នុង robotics ជួយផ្គត់ផ្គង់ voltage/current ត្រឹមត្រូវទៅ controller, sensors និង motors។",
          "- Main components: battery, charger, regulator/converter, switch និង wires។",
          "- Working principle: regulator បម្លែង voltage ពី battery ទៅកម្រិតដែល board ឬ module ត្រូវការ។"
        ].join("\n")
      : [
          "A robotics power system provides the correct voltage and current to controllers, sensors, and motors.",
          "- Main components: battery, charger, regulator/converter, switch, and wires.",
          "- Working principle: the regulator converts battery voltage to the level required by the board or module."
        ].join("\n");
  }

  return isKhmer
    ? "Robot project ជាទូទៅប្រើ sensor ដើម្បីអានបរិស្ថាន, controller ដើម្បីសម្រេចចិត្ត, និង actuator/motor ដើម្បីធ្វើចលនា។"
    : "A robotics project usually uses sensors to read the environment, a controller to make decisions, and actuators or motors to move.";
}

function getEducationalFollowUps(projectTypes = [], items = [], language = "en") {
  const isKhmer = language === "km";
  const item = items[0] || null;
  const itemFollowUps = getCategoryAwareFollowUps(item, language);

  if (itemFollowUps.length) {
    return itemFollowUps.slice(0, 3);
  }

  if (projectTypes.includes("environment_monitoring")) {
    return isKhmer
      ? ["Show environment monitoring parts", "Compare DHT11 and DHT22", "How to show sensor readings?"]
      : ["Show environment monitoring parts", "Compare DHT11 and DHT22", "How to show sensor readings?"];
  }

  if (projectTypes.includes("wireless_control") || projectTypes.includes("iot_robot")) {
    return isKhmer
      ? ["How to build wireless robot communication?", "Compare NRF24L01 and LoRa", "Show wireless modules"]
      : ["How to build wireless robot communication?", "Compare NRF24L01 and LoRa", "Show wireless modules"];
  }

  if (projectTypes.includes("power_system")) {
    return isKhmer
      ? ["How to power ESP32 safely?", "Show power modules", "តើអាចប្រើជាមួយ battery បានទេ?"]
      : ["How to power ESP32 safely?", "Show power modules", "Can I use it with a battery?"];
  }

  return [];
}

async function getEducationalResponse(rawMessage, input, language = "en") {
  const educationIntent = detectEducationalIntent(rawMessage, input);

  if (!educationIntent) {
    return null;
  }

  const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
  const projectTypes = detectProjectTypes(normalizeQuery(input));
  const catalogQuery = buildEducationalCatalogQuery(input, educationIntent, projectTypes);
  const deterministicSearch = findDeterministicCatalogRecommendations({
    products,
    robotKits,
    query: catalogQuery,
    language,
    limit: 6
  });
  const items = deterministicSearch.matches.length ? normalizeDeterministicCatalogMatches(deterministicSearch, language) : [];
  const catalogContext = buildChatbotContext(items);

  return {
    reply: getEducationalFallbackReply({ intent: educationIntent, projectTypes, query: input, language }),
    catalogMatches: items,
    catalogContext,
    catalogSummary: items.length ? buildCatalogGroundingSummary(`${educationIntent} context`, items) : null,
    followUps: getEducationalFollowUps(projectTypes, items, language),
    responseMode: "educational",
    modelPrompt: buildEducationalModelPrompt({
      message: rawMessage,
      educationIntent,
      projectTypes,
      catalogContext,
      language
    }),
    modelPromptMode: "educational"
  };
}

function getKnownCatalogCategories(products = []) {
  return [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
}

function isStoreDataPlannerIntent(intent) {
  return [
    "catalog_sort",
    "catalog_filter",
    "catalog_aggregate",
    "catalog_detail",
    "catalog_availability",
    "catalog_category_summary",
    "robotics_education"
  ].includes(intent);
}

function getPlannerEntityType(plan = {}) {
  return plan.entityType || plan.itemType || "all";
}

function getPlannerCatalogEntries(products = [], robotKits = [], entityType = "all") {
  if (entityType === "product" || entityType === "category") {
    return products.map((item) => ({ item, type: "product" }));
  }

  if (entityType === "kit") {
    return robotKits.map((item) => ({ item, type: "kit" }));
  }

  return [
    ...products.map((item) => ({ item, type: "product" })),
    ...robotKits.map((item) => ({ item, type: "kit" }))
  ];
}

function getPlannerEntrySortValue(entry, sortBy = "name") {
  if (sortBy === "price") {
    return Number(entry.item.price || 0);
  }

  if (sortBy === "stock") {
    return Number(getCatalogStock(entry.item, entry.type) || 0);
  }

  if (sortBy === "createdAt") {
    return new Date(entry.item.createdAt || 0).getTime() || 0;
  }

  if (sortBy === "popularity") {
    return Number(entry.item.featured ? 100 : 0) + Number(getCatalogStock(entry.item, entry.type) || 0);
  }

  return String(entry.item.name || "");
}

function sortPlannerEntries(entries = [], sortBy = "name", direction = "asc") {
  const multiplier = direction === "desc" ? -1 : 1;

  return entries.sort((first, second) => {
    const firstValue = getPlannerEntrySortValue(first, sortBy);
    const secondValue = getPlannerEntrySortValue(second, sortBy);

    if (typeof firstValue === "string" || typeof secondValue === "string") {
      return multiplier * String(firstValue).localeCompare(String(secondValue));
    }

    return multiplier * (Number(firstValue) - Number(secondValue)) || String(first.item.name || "").localeCompare(String(second.item.name || ""));
  });
}

function filterPlannerEntries(entries = [], plan = {}) {
  const category = plan.category || plan.categories?.[0] || "";
  const stock = plan.stock || plan.filters?.stock || "any";
  const voltage = plan.voltage || plan.filters?.voltage || "";
  const topic = normalizeText(plan.topic || "");

  return entries.filter((entry) => {
    const entryStock = Number(getCatalogStock(entry.item, entry.type) || 0);
    const text = getSearchableText(entry.item);

    if (category && entry.type === "product" && entry.item.category !== category) {
      return false;
    }

    if (stock === "in_stock" && entryStock <= 0) {
      return false;
    }

    if (stock === "out_of_stock" && entryStock > 0) {
      return false;
    }

    if (voltage && entry.type === "product" && !voltageMatches(entry.item, voltage)) {
      return false;
    }

    if (topic === "beginner") {
      return entry.type === "kit"
        ? normalizeText(entry.item.level).includes("beginner")
        : text.includes("beginner") || text.includes("starter") || text.includes("arduino") || entry.item.category === "Controllers";
    }

    return true;
  });
}

function filterBuildablePlannerEntries(entries = [], plan = {}) {
  const stock = plan.stock || plan.filters?.stock || "any";

  if (stock === "out_of_stock") {
    return entries;
  }

  return entries.filter((entry) => isCatalogItemBuildable(entry.item, entry.type));
}

function normalizePlannerItems(entries = [], language = "en", options = {}) {
  return entries.map((entry) =>
    normalizeCatalogItem(entry.item, entry.type, options.reasonCodes || ["description"], language, {
      includeDescription: Boolean(options.includeDescription),
      group: options.group || null
    })
  );
}

function buildPlannerSortReply(plan, items = [], language = "en") {
  if (!items.length) {
    return language === "km" ? "ខ្ញុំរកមិនឃើញទំនិញដែលត្រូវនឹងសំណួរនេះទេ។" : "I could not find catalog items for that question.";
  }

  const item = items[0];
  const entityName = item.type === "kit" ? "robot kit" : "product";
  const sortBy = plan.sortBy || "name";

  if (items.length === 1 && sortBy === "price") {
    if (plan.direction === "asc") {
      return language === "km"
        ? `The cheapest ${entityName} I found is ${item.name} at ${formatPrice(item.price)}.`
        : `The cheapest ${entityName} I found is ${item.name} at ${formatPrice(item.price)}.`;
    }

    return language === "km"
      ? `The most expensive ${entityName} I found is ${item.name} at ${formatPrice(item.price)}.`
      : `The most expensive ${entityName} I found is ${item.name} at ${formatPrice(item.price)}.`;
  }

  if (sortBy === "createdAt") {
    return language === "km" ? "Here are the newest catalog items I found." : "Here are the newest catalog items I found.";
  }

  if (sortBy === "popularity") {
    return language === "km" ? "Here are popular catalog items I found." : "Here are popular catalog items I found.";
  }

  return language === "km" ? "Here are catalog items sorted for your question." : "Here are catalog items sorted for your question.";
}

function buildPlannerAvailabilityReply(plan, items = [], language = "en") {
  const entityType = getPlannerEntityType(plan);
  const categoryText = plan.category ? plan.category.toLowerCase() : "";
  const target = entityType === "kit" ? "robot kits" : categoryText || "products";

  if (!items.length) {
    return language === "km"
      ? `I could not find ${target} matching that stock status right now.`
      : `I could not find ${target} matching that stock status right now.`;
  }

  if ((plan.stock || plan.filters?.stock) === "out_of_stock") {
    return language === "km"
      ? `I found a few ${target} that are currently out of stock.`
      : `I found a few ${target} that are currently out of stock.`;
  }

  return language === "km" ? `I found ${items.length} ${target} in stock.` : `I found ${items.length} ${target} in stock.`;
}

function buildPlannerCategorySummary(products = [], language = "en") {
  const categoryCounts = [...products.reduce((map, product) => {
    const category = product.category || "Uncategorized";
    map.set(category, (map.get(category) || 0) + 1);
    return map;
  }, new Map()).entries()].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]));

  if (!categoryCounts.length) {
    return null;
  }

  const [category, count] = categoryCounts[0];
  const representative = products.filter((product) => product.category === category).slice(0, 3);
  const items = normalizePlannerItems(
    representative.map((item) => ({ item, type: "product" })),
    language,
    { reasonCodes: ["category"] }
  );

  return {
    reply:
      language === "km"
        ? `The category with the most products is ${category}, with ${count} products.`
        : `The category with the most products is ${category}, with ${count} products.`,
    catalogMatches: items,
    catalogContext: buildChatbotContext(items),
    catalogSummary: buildCatalogGroundingSummary("category summary", items),
    followUps: localizeFollowUps(["Show products", "Show cheaper", "Compare options"], language),
    responseMode: "listing"
  };
}

function getAggregateEntityLabel(plan = {}, count = 0) {
  const entityType = getPlannerEntityType(plan);
  const category = plan.category || plan.filters?.category || "";
  const voltage = plan.voltage || plan.filters?.voltage || "";
  const suffix = count === 1 ? "" : "s";

  if (entityType === "category" && !category) {
    return count === 1 ? "product category" : "product categories";
  }

  if (category) {
    return `${voltage ? `${voltage} ` : ""}${category.toLowerCase()}`;
  }

  if (entityType === "kit") {
    return count === 1 ? "robot kit" : "robot kits";
  }

  if (entityType === "all" || entityType === "both") {
    return count === 1 ? "catalog item" : "catalog items";
  }

  return `product${suffix}`;
}

function getAggregateStockPhrase(plan = {}) {
  const stock = plan.stock || plan.filters?.stock || "any";

  if (stock === "in_stock") {
    return " available";
  }

  if (stock === "out_of_stock") {
    return " out of stock";
  }

  return "";
}

function buildCatalogAggregateResponse(plan = {}, products = [], robotKits = [], language = "en") {
  const aggregatePlan = {
    ...plan,
    category: plan.category || plan.filters?.category || "",
    stock: plan.stock || plan.filters?.stock || "any"
  };
  const entityType = getPlannerEntityType(aggregatePlan);

  if (entityType === "category" && !aggregatePlan.category) {
    const count = getKnownCatalogCategories(products).length;
    const label = getAggregateEntityLabel(aggregatePlan, count);

    return {
      reply: language === "km" ? `There are ${count} ${label} in the store.` : `There are ${count} ${label} in the store.`,
      catalogMatches: [],
      catalogContext: buildChatbotContext([]),
      catalogSummary: `Catalog aggregate count: ${count} ${label}.`,
      followUps: localizeFollowUps(["Show products", "Show kits", "Compare options"], language),
      responseMode: "listing",
      aiPlan: aggregatePlan
    };
  }

  const entries = filterPlannerEntries(getPlannerCatalogEntries(products, robotKits, entityType), aggregatePlan);
  const count = entries.length;
  const label = getAggregateEntityLabel(aggregatePlan, count);
  const stockPhrase = getAggregateStockPhrase(aggregatePlan);

  return {
    reply: language === "km" ? `There are ${count} ${label}${stockPhrase} in the store.` : `There are ${count} ${label}${stockPhrase} in the store.`,
    catalogMatches: [],
    catalogContext: buildChatbotContext([]),
    catalogSummary: `Catalog aggregate count: ${count} ${label}${stockPhrase}.`,
    followUps: localizeFollowUps(["Show products", "Show kits", "Compare options"], language),
    responseMode: "listing",
    aiPlan: aggregatePlan
  };
}

async function getCatalogAggregateResponse(parsedQuery, language = "en") {
  const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
  logChatbotServiceEvent("db_query", {
    source: "catalog_aggregate",
    productCount: products.length,
    robotKitCount: robotKits.length,
    detectedIntent: parsedQuery.intent,
    filters: parsedQuery.filters
  });
  return buildCatalogAggregateResponse(parsedQuery, products, robotKits, language);
}

function getRoboticsEducationFallback(topic = "", language = "en") {
  const normalizedTopic = normalizeText(topic);

  if (normalizedTopic.includes("pwm") || normalizedTopic.includes("pulse width")) {
    return language === "km"
      ? "PWM stands for Pulse Width Modulation. It controls power by switching a signal on and off very quickly, often for motor speed, servo control, or LED brightness."
      : "PWM stands for Pulse Width Modulation. It controls power by switching a signal on and off very quickly, often for motor speed, servo control, or LED brightness.";
  }

  if (normalizedTopic.includes("motor driver")) {
    return language === "km"
      ? "A motor driver lets a low-power controller safely control motors that need more current or a different voltage. It also helps control direction and speed."
      : "A motor driver lets a low-power controller safely control motors that need more current or a different voltage. It also helps control direction and speed.";
  }

  if (normalizedTopic.includes("line")) {
    return getEducationalFallbackReply({ intent: "project_explanation", projectTypes: ["line_follower"], query: "line follower", language });
  }

  if (normalizedTopic.includes("ultrasonic")) {
    return "An ultrasonic sensor sends a short sound pulse and measures how long the echo takes to return. Robots often use that distance reading to avoid obstacles.";
  }

  return language === "km"
    ? "Robotics projects usually combine sensors, a controller, power, and actuators. The sensor reads the world, the controller decides, and the actuator moves or responds."
    : "Robotics projects usually combine sensors, a controller, power, and actuators. The sensor reads the world, the controller decides, and the actuator moves or responds.";
}

function buildRoboticsEducationPrompt({ message, topic, catalogContext, language }) {
  return buildEducationalModelPrompt({
    message,
    educationIntent: "project_explanation",
    projectTypes: topic ? [topic] : [],
    catalogContext,
    language
  });
}

async function executeStoreDataPlannerResponse(rawMessage, input, plan, products, robotKits, language = "en") {
  if (plan.intent === "catalog_aggregate") {
    return buildCatalogAggregateResponse(plan, products, robotKits, language);
  }

  if (plan.intent === "catalog_category_summary") {
    return buildPlannerCategorySummary(products, language);
  }

  if (plan.intent === "robotics_education") {
    const relatedSearch = plan.limit
      ? findDeterministicCatalogRecommendations({
          products,
          robotKits,
          query: plan.topic || input,
          language,
          limit: Math.min(3, plan.limit || 3)
        })
      : null;
    const items = relatedSearch?.matches?.length ? normalizeDeterministicCatalogMatches(relatedSearch, language).slice(0, 3) : [];
    const catalogContext = buildChatbotContext(items);

    return {
      reply: getRoboticsEducationFallback(plan.topic || input, language),
      catalogMatches: items,
      catalogContext,
      catalogSummary: items.length ? buildCatalogGroundingSummary("robotics education support", items) : null,
      followUps: getEducationalFollowUps(detectProjectTypes(normalizeQuery(plan.topic || input)), items, language),
      responseMode: "educational",
      modelPrompt: buildRoboticsEducationPrompt({
        message: rawMessage,
        topic: plan.topic || input,
        catalogContext,
        language
      }),
      modelPromptMode: "educational"
    };
  }

  if (plan.intent === "catalog_detail") {
    const matches = findCatalogMentionMatches(plan.mention || input, products, robotKits);

    if (!matches.length) {
      return null;
    }

    const selectedMatches = matches.slice(0, 1);
    const items = selectedMatches.map((match) => normalizeCatalogItem(match.item, match.type, ["exactName"], language, { includeDescription: true }));
    const catalogContext = buildChatbotContext(items);

    return {
      reply: buildContextItemExplanation(items[0], input, language),
      catalogMatches: items,
      catalogContext,
      catalogSummary: buildCatalogGroundingSummary("AI planner catalog detail", items),
      followUps: getProductDetailFollowUps(input, language, items[0]),
      responseMode: "detail",
      modelPrompt: buildGroundedModelPrompt({
        message: rawMessage,
        catalogContext,
        language,
        mode: "explain"
      })
    };
  }

  const entityType = getPlannerEntityType(plan);
  const entries = filterBuildablePlannerEntries(filterPlannerEntries(getPlannerCatalogEntries(products, robotKits, entityType), plan), plan);
  const sortedEntries = sortPlannerEntries(entries, plan.sortBy || "name", plan.direction || "asc").slice(0, plan.limit || 8);
  const includeDescription = plan.intent === "catalog_sort" && sortedEntries.length === 1;
  const items = normalizePlannerItems(sortedEntries, language, {
    reasonCodes: plan.intent === "catalog_availability" ? ["stock"] : plan.topic === "beginner" ? ["beginner"] : ["description"],
    includeDescription
  });

  if (!items.length && plan.intent === "catalog_availability") {
    return {
      reply: buildPlannerAvailabilityReply(plan, items, language),
      catalogMatches: [],
      catalogContext: buildChatbotContext([]),
      catalogSummary: null,
      followUps: getPlannerFollowUps({ ...plan, responseMode: "listing" }, language),
      responseMode: "listing",
      aiPlan: plan
    };
  }

  if (!items.length) {
    return null;
  }

  const reply =
    plan.intent === "catalog_availability"
      ? buildPlannerAvailabilityReply(plan, items, language)
      : plan.intent === "catalog_sort"
        ? buildPlannerSortReply(plan, items, language)
        : plan.topic === "beginner"
          ? language === "km"
            ? "I found a few beginner-friendly catalog options."
            : "I found a few beginner-friendly catalog options."
          : language === "km"
            ? "I found catalog items that match your question."
            : "I found catalog items that match your question.";
  const catalogContext = buildChatbotContext(items);

  return {
    reply,
    catalogMatches: items,
    catalogContext,
    catalogSummary: buildCatalogGroundingSummary(`AI planner ${plan.intent}`, items),
    followUps: getPlannerFollowUps({ ...plan, responseMode: "listing" }, language),
    responseMode: "listing",
    aiPlan: plan
  };
}

function buildPlannerListingReply(plan, items, language = "en") {
  if (!items.length) {
    return language === "km"
      ? "ខ្ញុំរកមិនឃើញទំនិញដែលត្រូវនឹងសំណើនេះទេ។"
      : "I could not find matching catalog items for that request.";
  }

  if (plan.itemType === "kit") {
    return language === "km" ? "នេះជា robot kits ដែលត្រូវនឹងសំណើរបស់អ្នក។" : "Here are robot kits that match your request.";
  }

  if (plan.filters?.priceComparison) {
    const relation = ["lt", "lte"].includes(plan.filters.priceComparison.operator) ? "lower-priced" : "higher-priced";
    return language === "km" ? "នេះជាផលិតផលដែលត្រូវនឹងការប្រៀបធៀបតម្លៃរបស់អ្នក។" : `Here are ${relation} catalog items that match your request.`;
  }

  if (plan.filters?.priceMin !== undefined || plan.filters?.priceMax !== undefined) {
    return language === "km" ? "នេះជាជម្រើសក្នុងចន្លោះតម្លៃដែលអ្នកស្នើ។" : "Here are catalog items in the price range you requested.";
  }

  if (plan.sort?.field === "price" && plan.sort.direction === "desc") {
    return language === "km" ? "នេះជាជម្រើសថ្លៃបំផុតដែលខ្ញុំរកឃើញ។" : "Here are the highest-priced options I found.";
  }

  if (plan.sort?.field === "price" && plan.sort.direction === "asc") {
    return language === "km" ? "នេះជាជម្រើសតម្លៃទាបដែលខ្ញុំរកឃើញ។" : "Here are the lowest-priced options I found.";
  }

  return language === "km" ? "ខ្ញុំរកឃើញជម្រើសដែលពាក់ព័ន្ធសម្រាប់អ្នក។" : "I found a few relevant catalog options for you.";
}

function getPlannerFollowUps(plan, language = "en") {
  if (plan.responseMode === "listing") {
    return localizeFollowUps(["Show cheaper", "Show kits", "Compare options"], language).slice(0, 3);
  }

  if (plan.projectTypes?.includes("environment_monitoring")) {
    return localizeFollowUps(["Show environment monitoring parts", "Compare DHT11 and DHT22", "How to show sensor readings?"], language).slice(0, 3);
  }

  if (plan.projectTypes?.includes("wireless_control") || plan.projectTypes?.includes("iot_robot")) {
    return localizeFollowUps(["Show Arduino-compatible wireless modules", "Compare NRF24L01 and LoRa", "Show kits"], language).slice(0, 3);
  }

  return localizeFollowUps(["Show parts", "Show kits", "Check compatibility"], language).slice(0, 3);
}

function buildAiExecutionModelPrompt({ message, plan, catalogContext, language }) {
  const educationIntent =
    plan.responseMode === "troubleshooting"
      ? "troubleshooting"
      : plan.intent === "how_to_build"
        ? "how_to_build"
        : plan.intent === "project_explanation"
          ? "project_explanation"
          : "how_to_build";

  return buildEducationalModelPrompt({
    message,
    educationIntent,
    projectTypes: plan.projectTypes || [],
    catalogContext,
    language
  });
}

async function getAiPlannerResponse(rawMessage, input, language = "en") {
  const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
  logChatbotServiceEvent("db_query", {
    source: "ai_planner",
    productCount: products.length,
    robotKitCount: robotKits.length
  });
  const knownCategories = getKnownCatalogCategories(products);
  const knownProjectTypes = getKnownProjectTypes();
  const catalogSummary = buildSafeCatalogSummary({ products, robotKits, knownCategories, knownProjectTypes });
  const plan = await buildAiChatPlan({
    userMessage: rawMessage,
    normalizedQuery: input,
    language,
    catalogSummary,
    knownCategories,
    knownProjectTypes
  });

  if (!plan || plan.intent === "fallback" || plan.responseMode === "fallback") {
    return null;
  }

  if (isStoreDataPlannerIntent(plan.intent)) {
    return executeStoreDataPlannerResponse(rawMessage, input, plan, products, robotKits, language);
  }

  const plannerProducts = plan.filters?.stock === "out_of_stock" ? products : products.filter((product) => isCatalogItemBuildable(product, "product"));
  const plannerRobotKits = plan.filters?.stock === "out_of_stock" ? robotKits : robotKits.filter((kit) => isCatalogItemBuildable(kit, "kit"));

  const { items: selected } = executeChatbotRecommendationPlan({
    input,
    plan,
    products: plannerProducts,
    robotKits: plannerRobotKits
  });

  if (!selected.length) {
    return null;
  }

  const includeDescription = ["educational", "detail", "comparison", "troubleshooting"].includes(plan.responseMode);
  const items = selected.map(({ entry, reasonCodes }) =>
    normalizeCatalogItem(entry.source, entry.type, reasonCodes, language, {
      includeDescription,
      group: plan.neededCategories?.find((category) => recommendationGroupMatches(entry, category)) || null
    })
  );
  const catalogContext = buildChatbotContext(items);
  const isListing = plan.responseMode === "listing";

  return {
    reply: isListing
      ? buildPlannerListingReply(plan, items, language)
      : getEducationalFallbackReply({
          intent: plan.responseMode === "troubleshooting" ? "troubleshooting" : plan.intent === "how_to_build" ? "how_to_build" : "project_explanation",
          projectTypes: plan.projectTypes || [],
          query: input,
          language
        }),
    catalogMatches: items,
    catalogContext,
    catalogSummary: buildCatalogGroundingSummary(`AI planner ${plan.intent}`, items),
    followUps: getPlannerFollowUps(plan, language),
    responseMode: plan.responseMode,
    modelPrompt: isListing
      ? null
      : buildAiExecutionModelPrompt({
          message: rawMessage,
          plan,
          catalogContext,
          language
        }),
    modelPromptMode: isListing ? null : "educational",
    aiPlan: plan
  };
}

async function getRuleBasedCatalogData(input, parsedQuery, language = "en") {
  const catalogSearch = await searchCatalogForChat(input, parsedQuery, language);

  if (!catalogSearch) {
    return null;
  }

  const reply =
    catalogSearch.responseMode === "listing" || catalogSearch.responseMode === "project_recommendation" || catalogSearch.responseMode === "fallback"
      ? catalogSearch.prefix || buildCatalogReply(parsedQuery, catalogSearch.items, language)
      : catalogSearch.prefix
        ? parsedQuery.intent === "complete_build"
          ? catalogSearch.prefix
          : buildRecommendationReply(catalogSearch.prefix, catalogSearch.items, language)
        : buildCatalogReply(parsedQuery, catalogSearch.items, language);

  const catalogContext = buildChatbotContext(catalogSearch.items);

  return {
    reply,
    catalogMatches: catalogSearch.items,
    catalogContext,
    followUps: catalogSearch.followUps,
    catalogSummary: catalogSearch.items.length ? buildCatalogGroundingSummary(catalogSearch.label, catalogSearch.items) : null,
    modelPrompt: catalogSearch.modelPrompt || null,
    responseMode: catalogSearch.responseMode || null,
    buildSummary: catalogSearch.buildSummary || null
  };
}

function shouldTryAiPlannerBeforeCatalog(rawMessage = "", input = "", parsedQuery = null, earlyEducationalIntent = null) {
  const normalized = normalizeQuery(input || rawMessage);
  const rawLower = String(rawMessage || "").toLowerCase();
  const hasProjectGoal =
    /\b(i want|i need|looking for|something (for|to)|recommend|suggest|which should i (buy|use|get)|school project|for my project|follow a line|line follow|obstacle|robot car)\b/i.test(normalized) ||
    /ចង់បាន|ត្រូវការ|គម្រោងសាលា|កិច្ចការសាលា|ណែនាំ/.test(rawLower);

  // A plain price filter ("products under $30") is faster deterministically,
  // but a goal + budget ("line follower for school, under $30") needs the planner.
  if (parsedQuery?.intent === "catalog_filter" && parsedQuery?.filters?.price && !hasProjectGoal) {
    return false;
  }

  if (hasProjectGoal) {
    return true;
  }

  if (
    /\b(most expensive|highest price|priciest|cheapest|lowest price|between\s+\$?\d|more expensive than|cheaper than|less than|greater than|in stock|out of stock|which category|category has|most products|newest|latest|most popular)\b/i.test(normalized) ||
    /\b(products?|kits?)\s+(?:under|below|over|above)\s*\$?\d/i.test(normalized) ||
    /ថ្លៃជាង|ថ្លៃបំផុត|ថោកបំផុត|ក្រោម\s*\d/.test(rawLower)
  ) {
    return true;
  }

  if (
    /\b(weather station|greenhouse|controlled by phone|phone control|what project can i build|which parts are better|what sensor should i use|pwm|pulse width modulation|why do i need a motor driver|what is a motor driver|good for beginners|beginner products|starter products)\b/i.test(normalized) ||
    /ទូរស័ព្ទ|ផ្ទះកញ្ចក់|ដំណាំ/.test(rawLower)
  ) {
    return true;
  }

  if (earlyEducationalIntent && Number(parsedQuery?.confidence || 0) < 0.5) {
    return true;
  }

  return false;
}

function buildGeneralKnowledgeModelPrompt({ message, storeTeaser, language }) {
  const responseLanguage = language === "km" ? "Khmer" : "English";

  return `User message:
${message}

Detected language:
${responseLanguage}

STORE OVERVIEW (high level only — you do NOT have the product catalog for this answer):
${storeTeaser || "RobotIoKit sells robotics components and robot kits in Phnom Penh, Cambodia."}

You are answering a general robotics/electronics/technology question. Rules:
- Answer in depth like a tutor: the concept, how it works, a practical example, and (when useful) how the customer could try it themselves with common parts.
- If store products are relevant, you may mention that RobotIoKit sells parts in the categories listed above — but never invent specific product names, prices, stock, or availability.
- Keep official technical and model names in English (e.g., Arduino Uno, ESP32, HC-SR04, L298N, SG90) even in Khmer answers.
- If the question is completely unrelated to robotics, electronics, programming, or the store, do not answer it — politely decline in one or two sentences and invite the user to ask a robotics, electronics, or store-related question instead.
- Answer in ${responseLanguage}.`;
}

async function getGeneralKnowledgeResponse(rawMessage, language = "en") {
  let storeTeaser = "";

  try {
    const [products, robotKits] = await Promise.all([listStorefrontProducts(), listStorefrontRobotKits()]);
    const categories = getKnownCatalogCategories(products);
    const productPrices = products.map((product) => Number(product.price)).filter(Number.isFinite);
    const kitPrices = robotKits.map((kit) => Number(kit.price)).filter(Number.isFinite);
    const teaser = [`RobotIoKit (Phnom Penh) sells parts in these categories: ${categories.join(", ") || "robotics components"}.`];

    if (productPrices.length) {
      teaser.push(`Component prices range from $${Math.min(...productPrices).toFixed(2)} to $${Math.max(...productPrices).toFixed(2)}.`);
    }

    if (kitPrices.length) {
      teaser.push(`Robot kits range from $${Math.min(...kitPrices).toFixed(2)} to $${Math.max(...kitPrices).toFixed(2)}.`);
    }

    storeTeaser = teaser.join(" ");
  } catch {
    // teaser is optional — a general answer must not depend on the database
  }

  return {
    reply: getLowConfidenceReplyFromResponse(language),
    catalogSummary: null,
    catalogMatches: [],
    followUps: getClarifyingCatalogFollowUpsFromResponse(language),
    modelPrompt: buildGeneralKnowledgeModelPrompt({ message: rawMessage, storeTeaser, language }),
    modelPromptMode: "general",
    responseMode: "general_qa"
  };
}

export async function getChatbotReplyData(message = "", { lastRecommendedItems = [] } = {}) {
  const rawMessage = String(message || "").trim();
  const input = normalizeKhmerQuery(rawMessage).toLowerCase();
  const language = detectLanguage(rawMessage);

  if (!rawMessage) {
    return getEmptyResponseFromResponse(language);
  }

  const hasRecentContextReference = normalizeContextItems(lastRecommendedItems).length > 0 && detectContextFollowUp(input);
  const hasCatalogDetailIntent = isProductDetailRequest(input);

  if (detectNewsIntent(rawMessage)) {
    try {
      return {
        ...(await getNewsResponse(rawMessage, language)),
        language
      };
    } catch (error) {
      logChatbotServiceEvent("news_failed", { message: error instanceof Error ? error.message : String(error) });
    }
  }

  if (!isInShopScopeFromScope(input) && !hasRecentContextReference && !hasCatalogDetailIntent) {
    logChatbotServiceEvent("out_of_shop_scope", { input: input.slice(0, 120) });
    return {
      ...(await getGeneralKnowledgeResponse(rawMessage, language)),
      language
    };
  }

  if (isStoreLocationQuestion(input)) {
    return {
      ...(await getStoreLocationResponse(language)),
      language
    };
  }

  if (isDeliveryFeeQuestion(input)) {
    return {
      ...(await getDeliveryFeeResponse(language)),
      language
    };
  }

  if (isRobotProjectOverviewQuestion(input)) {
    return {
      ...(await getRobotProjectBuilderOverviewResponse(language)),
      language
    };
  }

  const directFaqResponse = getDirectFaqResponseFromResponse(input, language);

  if (directFaqResponse) {
    return directFaqResponse;
  }

  const parsedQuery = parseCatalogQuery(rawMessage);
  const questionMode = detectQuestionMode(rawMessage, input, parsedQuery);

  if (parsedQuery.intent === "catalog_aggregate") {
    return {
      ...(await getCatalogAggregateResponse(parsedQuery, language)),
      language
    };
  }

  if (questionMode === "product_detail") {
    const groundedDetailResponse = await getGroundedDetailResponse(rawMessage, input, language, lastRecommendedItems);

    if (groundedDetailResponse) {
      return {
        ...groundedDetailResponse,
        language
      };
    }
  }

  if (questionMode === "concept_explanation") {
    const conceptResponse = await getConceptExplanationResponse(input, language);

    if (conceptResponse) {
      return {
        ...conceptResponse,
        language
      };
    }
  }

  if (questionMode === "catalog_search" && isRobotDiscoveryQuestion(input)) {
    return {
      ...(await getRobotDiscoveryResponse(language)),
      language
    };
  }

  const earlyEducationalIntent = detectEducationalIntent(rawMessage, input);
  const shouldTryEarlyAiPlanner = shouldTryAiPlannerBeforeCatalog(rawMessage, input, parsedQuery, earlyEducationalIntent);

  if (shouldTryEarlyAiPlanner) {
    const aiPlannerResponse = await getAiPlannerResponse(rawMessage, input, language);

    if (aiPlannerResponse) {
      return {
        ...aiPlannerResponse,
        language
      };
    }
  }

  const shouldAnswerEducationBeforeCompatibility =
    earlyEducationalIntent &&
    (earlyEducationalIntent !== "project_explanation" || /\bhow\s+does\b|\bhow\s+do\b|ដំណើរការ/.test(rawMessage.toLowerCase()));

  if (shouldAnswerEducationBeforeCompatibility) {
    const educationalResponse = await getEducationalResponse(rawMessage, input, language);

    if (educationalResponse) {
      return {
        ...educationalResponse,
        language
      };
    }
  }

  if (parsedQuery.intent === "compatibility") {
    const compatibilityCatalogResponse = await getRuleBasedCatalogData(input, parsedQuery, language);

    if (compatibilityCatalogResponse) {
      return {
        ...compatibilityCatalogResponse,
        language
      };
    }
  }

  if (parsedQuery.intent === "catalog_filter") {
    const filterCatalogResponse = await getRuleBasedCatalogData(input, parsedQuery, language);

    if (filterCatalogResponse) {
      return {
        ...filterCatalogResponse,
        language
      };
    }
  }

  const groundedDetailResponse = await getGroundedDetailResponse(rawMessage, input, language, lastRecommendedItems);

  if (groundedDetailResponse) {
    return {
      ...groundedDetailResponse,
      language
    };
  }

  const educationalResponse = earlyEducationalIntent ? await getEducationalResponse(rawMessage, input, language) : null;

  if (educationalResponse) {
    return {
      ...educationalResponse,
      language
    };
  }

  if (parsedQuery.intent === "faq") {
    const faqResponse = getDirectFaqResponseFromResponse(input, language);

    if (faqResponse) {
      return faqResponse;
    }
  }

  const catalogResponse = await getRuleBasedCatalogData(input, parsedQuery, language);

  if (catalogResponse) {
    return {
      ...catalogResponse,
      language
    };
  }

  const matchedRule = findMatchingRule(input);

  if (matchedRule) {
    return {
      reply: localizeMatchedRuleAnswerFromResponse(matchedRule.answer, language),
      catalogSummary: null,
      catalogMatches: [],
      followUps: localizeFollowUps(matchedRule.followUps || ["Show products", "Show kits"], language),
      language
    };
  }

  if (!shouldTryEarlyAiPlanner) {
    const aiPlannerResponse = await getAiPlannerResponse(rawMessage, input, language);

    if (aiPlannerResponse) {
      return {
        ...aiPlannerResponse,
        language
      };
    }
  }

  return {
    ...(await getGeneralKnowledgeResponse(rawMessage, language)),
    language
  };
}

export async function getChatbotResponse(message = "") {
  const result = await getChatbotReplyData(message);
  return result.reply;
}

/**
 * @typedef {"line_follower" | "obstacle_avoider" | "robot_car" | "robot_arm" | "arduino_beginner" | "iot_robot" | "environment_monitoring" | "wireless_control" | "power_system" | "general_robotics"} ProjectType
 * @typedef {"project_explanation" | "how_to_build" | "troubleshooting" | "compatibility_question" | "compare_products" | "recommend_project_parts" | "find_product" | "budget_recommendation" | "recommend_kit" | "stock_or_price_question" | "unknown"} ChatIntent
 */

const KHMER_QUERY_MAPPINGS = [
  ["រ៉ូបូតគេចឧបសគ្គ", "obstacle avoiding robot"],
  ["គេចឧបសគ្គ", "obstacle avoiding"],
  ["ឧបសគ្គ", "obstacle"],
  ["ដើរតាមខ្សែ", "line following"],
  ["តាមខ្សែ", "line following"],
  ["ឧបករណ៍ចាប់សញ្ញា", "sensor"],
  ["សេនស័រ", "sensor"],
  ["ថោក", "cheap budget low price"],
  ["តម្លៃទាប", "cheap budget low price"],
  ["អាឌុយណូ", "arduino"],
  ["ម៉ូទ័រ", "motor"],
  ["កង់", "wheel"],
  ["តួរ៉ូបូត", "chassis robot car"],
  ["ថ្ម", "battery power"],
  ["រ៉ូបូត", "robot"],
  ["អ្នកចាប់ផ្តើម", "beginner"],
  ["ចាប់ផ្តើម", "beginner"],
  ["ងាយ", "easy beginner"],
  ["ចង់ធ្វើ", "build make project need"]
];

const ALIAS_QUERY_MAPPINGS = [
  ["driver motor", "motor driver"],
  ["line follower", "line following robot"],
  ["line follow", "line following"],
  ["distance sensor", "hc-sr04 vl53l0x obstacle distance sensor"],
  ["line sensor", "tcrt5000 line tracking line following sensor"],
  ["motor controller", "motor driver"],
  ["ultrasonic", "hc-sr04 ultrasonic distance sensor obstacle"],
  ["l298", "l298n motor driver"],
  ["uno", "arduino uno"],
  ["nano", "arduino nano"]
];

const PRODUCT_METADATA_RULES = [
  {
    match: ["tcrt5000"],
    tags: ["sensor", "ir", "line tracking", "line following", "reflectance"],
    aliases: ["tcrt5000", "line sensor", "line follower sensor", "ir tracking sensor"],
    useCases: ["line following robot", "robot car"],
    projectTypes: ["line_follower", "robot_car", "arduino_beginner"],
    difficulty: "beginner",
    compatibleWith: ["Arduino Uno R3", "Arduino Nano", "ESP32 Dev Board"],
    searchPriority: 35
  },
  {
    match: ["hc-sr04", "ultrasonic"],
    tags: ["sensor", "ultrasonic", "distance", "obstacle"],
    aliases: ["hc-sr04", "ultrasonic sensor", "distance sensor"],
    useCases: ["obstacle avoiding robot", "distance measuring robot"],
    projectTypes: ["obstacle_avoider", "robot_car", "arduino_beginner"],
    difficulty: "beginner",
    compatibleWith: ["Arduino Uno R3", "Arduino Nano", "ESP32 Dev Board", "SG90 Micro Servo Motor"],
    searchPriority: 35
  },
  {
    match: ["ir obstacle"],
    tags: ["sensor", "ir", "obstacle", "avoidance"],
    aliases: ["ir obstacle", "obstacle sensor", "avoidance sensor"],
    useCases: ["obstacle avoiding robot"],
    projectTypes: ["obstacle_avoider", "robot_car", "arduino_beginner"],
    difficulty: "beginner",
    searchPriority: 30
  },
  {
    match: ["vl53l0x", "time-of-flight"],
    tags: ["sensor", "distance", "tof", "laser", "obstacle"],
    aliases: ["vl53l0x", "tof sensor", "laser distance sensor"],
    useCases: ["compact obstacle detection", "distance sensing"],
    projectTypes: ["obstacle_avoider", "robot_car"],
    difficulty: "intermediate",
    searchPriority: 25
  },
  {
    match: ["arduino uno"],
    tags: ["controller", "arduino", "microcontroller", "beginner"],
    aliases: ["arduino", "uno", "arduino uno", "uno r3"],
    useCases: ["beginner robotics", "line following robot", "obstacle avoiding robot"],
    projectTypes: ["arduino_beginner", "line_follower", "obstacle_avoider", "robot_car"],
    difficulty: "beginner",
    searchPriority: 30
  },
  {
    match: ["arduino nano"],
    tags: ["controller", "arduino", "microcontroller", "compact"],
    aliases: ["nano", "arduino nano"],
    useCases: ["compact robot", "line following robot", "obstacle avoiding robot"],
    projectTypes: ["arduino_beginner", "line_follower", "obstacle_avoider", "robot_car"],
    difficulty: "beginner",
    searchPriority: 26
  },
  {
    match: ["esp32 dev"],
    tags: ["controller", "esp32", "wifi", "bluetooth", "iot"],
    aliases: ["esp32", "esp32 board", "esp32 dev"],
    useCases: ["iot robot", "wireless robot", "obstacle avoiding robot", "line following robot"],
    projectTypes: ["iot_robot", "wireless_control", "line_follower", "obstacle_avoider", "robot_car"],
    difficulty: "intermediate",
    searchPriority: 27
  },
  {
    match: ["l298n"],
    tags: ["motor driver", "h-bridge", "dc motor", "robot car"],
    aliases: ["l298n", "l298", "motor driver", "motor controller"],
    useCases: ["line following robot", "obstacle avoiding robot", "2wd robot car", "4wd robot car"],
    projectTypes: ["line_follower", "obstacle_avoider", "robot_car"],
    difficulty: "beginner",
    searchPriority: 30
  },
  {
    match: ["tb6612"],
    tags: ["motor driver", "dual motor", "efficient", "3.3v logic"],
    aliases: ["tb6612", "tb6612fng", "motor driver"],
    useCases: ["efficient robot car", "line following robot", "obstacle avoiding robot"],
    projectTypes: ["line_follower", "obstacle_avoider", "robot_car"],
    difficulty: "intermediate",
    searchPriority: 24
  },
  {
    match: ["drv8833"],
    tags: ["motor driver", "dual motor", "low voltage", "compact"],
    aliases: ["drv8833", "motor driver"],
    useCases: ["small robot car", "low voltage robot"],
    projectTypes: ["line_follower", "obstacle_avoider", "robot_car"],
    difficulty: "intermediate",
    searchPriority: 22
  },
  {
    match: ["tt dc", "tt motor"],
    tags: ["motor", "dc motor", "gear motor", "robot car"],
    aliases: ["tt motor", "yellow motor", "dc gear motor"],
    useCases: ["line following robot", "obstacle avoiding robot", "robot car"],
    projectTypes: ["line_follower", "obstacle_avoider", "robot_car"],
    difficulty: "beginner",
    searchPriority: 30
  },
  {
    match: ["2wd robot car chassis"],
    tags: ["chassis", "2wd", "robot car", "beginner"],
    aliases: ["2wd chassis", "robot chassis", "car chassis"],
    useCases: ["line following robot", "obstacle avoiding robot", "beginner robot car"],
    projectTypes: ["line_follower", "obstacle_avoider", "robot_car", "arduino_beginner"],
    difficulty: "beginner",
    searchPriority: 28
  },
  {
    match: ["4wd robot car chassis"],
    tags: ["chassis", "4wd", "robot car", "smart car"],
    aliases: ["4wd chassis", "robot chassis", "smart car chassis"],
    useCases: ["obstacle avoiding robot", "line following robot", "smart robot car"],
    projectTypes: ["line_follower", "obstacle_avoider", "robot_car"],
    difficulty: "beginner",
    searchPriority: 25
  },
  {
    match: ["sg90"],
    tags: ["servo", "pan tilt", "robot arm", "ultrasonic scanning"],
    aliases: ["sg90", "micro servo", "servo motor"],
    useCases: ["ultrasonic sensor scanner", "pan tilt mount", "robot arm"],
    projectTypes: ["obstacle_avoider", "robot_arm", "arduino_beginner"],
    difficulty: "beginner",
    searchPriority: 22
  },
  {
    match: ["pan tilt"],
    tags: ["bracket", "pan tilt", "servo", "ultrasonic mount"],
    aliases: ["pan tilt", "servo bracket", "ultrasonic bracket"],
    useCases: ["obstacle avoiding robot scanner", "camera mount"],
    projectTypes: ["obstacle_avoider", "robot_car"],
    difficulty: "beginner",
    searchPriority: 18
  },
  {
    match: ["18650 battery holder"],
    tags: ["battery", "power", "18650", "robot car"],
    aliases: ["18650 holder", "battery holder", "robot battery"],
    useCases: ["robot car power", "mobile robot power"],
    projectTypes: ["line_follower", "obstacle_avoider", "robot_car", "power_system"],
    difficulty: "beginner",
    searchPriority: 24
  },
  {
    match: ["jumper wire"],
    tags: ["wiring", "jumper", "prototype", "connection"],
    aliases: ["jumper wires", "wire set", "dupont wires"],
    useCases: ["sensor wiring", "arduino wiring", "robot prototype"],
    projectTypes: ["arduino_beginner", "general_robotics"],
    difficulty: "beginner",
    searchPriority: 18
  },
  {
    match: ["breadboard"],
    tags: ["breadboard", "prototype", "wiring"],
    aliases: ["breadboard", "prototype board"],
    useCases: ["sensor testing", "arduino prototype"],
    projectTypes: ["arduino_beginner", "general_robotics"],
    difficulty: "beginner",
    searchPriority: 16
  },
  {
    match: ["buzzer"],
    tags: ["buzzer", "alarm", "sound", "notification"],
    aliases: ["buzzer", "alarm module"],
    useCases: ["robot alert", "line follower beep"],
    projectTypes: ["line_follower", "arduino_beginner"],
    difficulty: "beginner",
    searchPriority: 14
  }
];

const CATEGORY_TAGS = {
  Accessories: ["accessory", "wiring", "mechanical", "prototype"],
  Controllers: ["controller", "board", "microcontroller"],
  "IoT & Communication": ["iot", "communication", "wireless", "module"],
  "Motors & Drivers": ["motor", "driver", "actuator"],
  Power: ["power", "battery", "charger", "converter"],
  Sensors: ["sensor", "module", "detection"]
};

const CATEGORY_FALLBACKS = {
  Sensors: {
    tags: ["sensor", "input", "measurement", "robotics sensing", "electronics"],
    useCases: ["robotics sensing", "obstacle detection", "line tracking", "environmental monitoring"],
    projectTypes: ["obstacle_avoider", "line_follower", "environment_monitoring", "general_robotics"],
    khmerSummary: "sensor សម្រាប់ robotics និង electronics projects"
  },
  Controllers: {
    tags: ["controller", "microcontroller", "logic board", "automation"],
    useCases: ["robot control", "iot projects", "automation", "sensor reading"],
    projectTypes: ["robot_car", "iot_robot", "arduino_beginner", "general_robotics"],
    khmerSummary: "microcontroller board សម្រាប់ control robot និង IoT projects"
  },
  "Motors & Drivers": {
    tags: ["motor", "motor driver", "movement", "actuator"],
    useCases: ["robot movement", "wheel control", "robotic arms", "motor control"],
    projectTypes: ["robot_car", "robot_arm", "line_follower", "obstacle_avoider"],
    khmerSummary: "motor និង motor driver សម្រាប់ robot movement"
  },
  "IoT & Communication": {
    tags: ["iot", "wireless", "communication", "telemetry", "remote control"],
    useCases: ["wireless robot control", "telemetry", "remote communication", "iot robotics"],
    projectTypes: ["wireless_control", "iot_robot", "general_robotics"],
    khmerSummary: "module សម្រាប់ wireless communication និង IoT robotics"
  },
  Power: {
    tags: ["power", "battery", "voltage regulation", "power management"],
    useCases: ["battery systems", "voltage regulation", "mobile robot power", "safe power distribution"],
    projectTypes: ["power_system", "robot_car", "general_robotics"],
    khmerSummary: "power module សម្រាប់ផ្គត់ផ្គង់ថាមពលទៅ robotics projects"
  },
  Accessories: {
    tags: ["accessory", "assembly", "wiring", "prototyping", "mechanical"],
    useCases: ["robot assembly", "prototyping", "wiring", "mounting"],
    projectTypes: ["general_robotics", "arduino_beginner", "robot_car"],
    khmerSummary: "គ្រឿងបន្លាស់សម្រាប់ robotics projects"
  },
  Displays: {
    tags: ["display", "oled", "lcd", "status", "readout"],
    useCases: ["robot status display", "sensor readouts", "iot dashboards"],
    projectTypes: ["iot_robot", "environment_monitoring", "arduino_beginner", "general_robotics"],
    khmerSummary: "display សម្រាប់បង្ហាញ status និង sensor readouts"
  },
  "Environment Monitoring": {
    tags: ["environment", "temperature", "humidity", "gas", "soil", "water", "weather"],
    useCases: ["environmental monitoring", "weather station", "smart garden", "sensor logging"],
    projectTypes: ["environment_monitoring", "iot_robot", "arduino_beginner", "general_robotics"],
    khmerSummary: "sensor សម្រាប់ project វាស់បរិស្ថាន ដូចជា temperature, humidity, gas, soil ឬ water"
  },
  "Wireless Communication": {
    tags: ["wireless", "wifi", "bluetooth", "lora", "nrf24", "gsm", "telemetry"],
    useCases: ["wireless robot communication", "remote control", "telemetry", "iot communication"],
    projectTypes: ["wireless_control", "iot_robot", "robot_car", "general_robotics"],
    khmerSummary: "wireless communication module សម្រាប់ robot control និង telemetry"
  }
};

const SUBCATEGORY_RULES = [
  {
    name: "display",
    terms: ["oled", "lcd", "display", "screen", "128x64", "16x2"],
    fallbackKey: "Displays"
  },
  {
    name: "wireless_communication",
    terms: ["wifi", "bluetooth", "lora", "nrf24", "nrf24l01", "gsm", "sim800", "hc-05", "esp8266", "telemetry"],
    fallbackKey: "Wireless Communication"
  },
  {
    name: "environment_monitoring",
    terms: ["temperature", "humidity", "gas", "soil", "water", "rain", "weather", "dht", "bme280", "bmp280", "moisture"],
    fallbackKey: "Environment Monitoring"
  },
  {
    name: "power_management",
    terms: ["charger", "battery", "converter", "regulator", "buck", "boost", "lm2596", "mt3608", "tp4056", "adapter"],
    fallbackKey: "Power"
  },
  {
    name: "motor_system",
    terms: ["servo", "stepper", "dc motor", "gear motor", "motor driver", "l298n", "tb6612", "drv8833"],
    fallbackKey: "Motors & Drivers"
  }
];

const PROJECT_BUNDLES = {
  line_follower: [
    { group: "Controller", prefer: ["Arduino Uno R3", "Arduino Nano", "ESP32 Dev Board"], terms: ["arduino uno", "arduino nano", "esp32 dev"] },
    { group: "Line sensor", prefer: ["TCRT5000 Line Tracking Sensor"], terms: ["tcrt5000", "line tracking"] },
    { group: "Motor driver", prefer: ["L298N Dual Motor Driver", "TB6612FNG Motor Driver", "DRV8833 Dual Motor Driver", "L293D Motor Driver Shield"], terms: ["l298n", "tb6612", "drv8833", "l293d"] },
    { group: "Motors", prefer: ["TT DC Gear Motor"], terms: ["tt dc", "tt motor"] },
    { group: "Chassis", prefer: ["2WD Robot Car Chassis Kit", "4WD Robot Car Chassis"], terms: ["2wd robot car chassis", "4wd robot car chassis"] },
    { group: "Power", prefer: ["18650 Battery Holder Set"], terms: ["18650 battery holder"] },
    { group: "Wiring/Prototyping", prefer: ["Jumper Wire Set (120pcs)", "Mini Breadboard 170-Point", "400-Point Mini Breadboard"], terms: ["jumper wire", "breadboard"] },
    { group: "Optional Alert", prefer: ["Buzzer Alarm Module"], terms: ["buzzer"] }
  ],
  obstacle_avoider: [
    { group: "Controller", prefer: ["Arduino Uno R3", "Arduino Nano", "ESP32 Dev Board", "NodeMCU ESP8266"], terms: ["arduino uno", "arduino nano", "esp32 dev", "nodemcu"] },
    { group: "Distance/Obstacle Sensor", prefer: ["HC-SR04 Ultrasonic Sensor", "IR Obstacle Avoidance Sensor", "VL53L0X Time-of-Flight Distance Sensor"], terms: ["hc-sr04", "ultrasonic", "ir obstacle", "vl53l0x"] },
    { group: "Motor driver", prefer: ["L298N Dual Motor Driver", "TB6612FNG Motor Driver", "DRV8833 Dual Motor Driver", "L293D Motor Driver Shield"], terms: ["l298n", "tb6612", "drv8833", "l293d"] },
    { group: "Motors", prefer: ["TT DC Gear Motor"], terms: ["tt dc", "tt motor"] },
    { group: "Chassis", prefer: ["2WD Robot Car Chassis Kit", "4WD Robot Car Chassis"], terms: ["2wd robot car chassis", "4wd robot car chassis"] },
    { group: "Optional scanning", prefer: ["SG90 Micro Servo Motor", "Mini Pan Tilt Servo Bracket"], terms: ["sg90", "pan tilt"] },
    { group: "Power", prefer: ["18650 Battery Holder Set"], terms: ["18650 battery holder"] },
    { group: "Wiring/Prototyping", prefer: ["Jumper Wire Set (120pcs)", "Mini Breadboard 170-Point", "400-Point Mini Breadboard"], terms: ["jumper wire", "breadboard"] }
  ],
  arduino_beginner: [
    { group: "Starter controller", prefer: ["Arduino Uno R3", "Arduino Nano"], terms: ["arduino uno", "arduino nano"] },
    { group: "Sensor shield", prefer: ["Arduino Sensor Shield V5"], terms: ["arduino sensor shield"] },
    { group: "Beginner sensors", prefer: ["HC-SR04 Ultrasonic Sensor", "TCRT5000 Line Tracking Sensor", "DHT11 Temperature & Humidity Sensor"], terms: ["hc-sr04", "tcrt5000", "dht11"] },
    { group: "Actuators", prefer: ["SG90 Micro Servo Motor", "TT DC Gear Motor"], terms: ["sg90", "tt dc"] },
    { group: "Driver", prefer: ["L298N Dual Motor Driver"], terms: ["l298n"] },
    { group: "Prototyping", prefer: ["400-Point Mini Breadboard", "Mini Breadboard 170-Point", "Jumper Wire Set (120pcs)"], terms: ["breadboard", "jumper wire"] },
    { group: "Feedback", prefer: ["Buzzer Alarm Module", "16x2 LCD Display with I2C Backpack"], terms: ["buzzer", "16x2 lcd"] }
  ],
  iot_robot: [
    { group: "WiFi/Bluetooth controller", prefer: ["ESP32 Dev Board", "NodeMCU ESP8266"], terms: ["esp32", "nodemcu", "esp8266"] },
    { group: "Environment sensor", prefer: ["DHT11 Temperature & Humidity Sensor", "BME280 Environmental Sensor"], terms: ["dht11", "bme280", "temperature", "humidity"] },
    { group: "Display", prefer: ["Mini OLED Display", "16x2 LCD Display with I2C Backpack"], terms: ["oled", "lcd", "display"] },
    { group: "Wireless add-on", prefer: ["HC-05 Bluetooth Module", "NRF24L01 Wireless Module", "LoRa SX1278 Module"], terms: ["bluetooth", "nrf24", "lora"] },
    { group: "Prototyping", prefer: ["400-Point Mini Breadboard", "Jumper Wire Set (120pcs)"], terms: ["breadboard", "jumper"] },
    { group: "Power", prefer: ["18650 Battery Holder Set", "LM2596 Buck Converter"], terms: ["18650", "lm2596", "power"] }
  ],
  robot_car: [
    { group: "Controller", prefer: ["Arduino Uno R3", "ESP32 Dev Board", "Arduino Nano"], terms: ["arduino uno", "esp32", "arduino nano"] },
    { group: "Wireless control", prefer: ["HC-05 Bluetooth Module", "ESP32 Dev Board", "NRF24L01 Wireless Module"], terms: ["hc-05", "bluetooth", "esp32", "nrf24"] },
    { group: "Motor driver", prefer: ["L298N Dual Motor Driver", "TB6612FNG Motor Driver"], terms: ["l298n", "tb6612"] },
    { group: "Motors", prefer: ["TT DC Gear Motor", "12V DC Geared Motor"], terms: ["tt dc", "geared motor"] },
    { group: "Chassis", prefer: ["4WD Robot Car Chassis", "2WD Robot Car Chassis Kit", "Acrylic Robot Chassis Plate"], terms: ["4wd", "2wd", "chassis"] },
    { group: "Wheels", prefer: ["Smart Car Wheels & Tires Set"], terms: ["wheel", "tires"] },
    { group: "Obstacle sensor", prefer: ["HC-SR04 Ultrasonic Sensor", "IR Obstacle Avoidance Sensor"], terms: ["hc-sr04", "ultrasonic", "obstacle"] },
    { group: "Power", prefer: ["18650 Battery Holder Set", "18650 Li-ion Battery"], terms: ["18650", "battery"] },
    { group: "Wiring", prefer: ["Jumper Wire Set (120pcs)", "400-Point Mini Breadboard"], terms: ["jumper", "breadboard"] }
  ]
};

const PROJECT_DETECTORS = [
  ["line_follower", ["line following", "line follower", "tcrt5000", "ដើរតាមខ្សែ", "តាមខ្សែ"]],
  ["obstacle_avoider", ["obstacle avoiding", "obstacle avoidance", "ultrasonic", "hc-sr04", "គេចឧបសគ្គ"]],
  ["robot_car", ["robot car", "smart car", "2wd", "4wd", "chassis"]],
  ["robot_arm", ["arm", "servo arm", "pick and place"]],
  ["arduino_beginner", ["arduino beginner", "beginner", "easy", "starter"]],
  ["iot_robot", ["wifi", "bluetooth", "iot", "esp32", "esp8266", "telemetry"]],
  ["environment_monitoring", ["temperature", "humidity", "gas", "soil", "water", "environment", "weather", "monitoring", "dht11", "dht22", "bme280", "bmp280", "rain", "moisture"]],
  ["wireless_control", ["bluetooth", "hc-05", "wireless", "nrf24", "nrf24l01", "lora", "gsm", "sim800", "remote communication"]],
  ["power_system", ["battery", "power", "charger", "converter", "regulator", "buck", "boost", "lm2596", "mt3608", "tp4056", "brownout", "restarting", "restart"]]
];

const CATEGORY_TERMS = [
  ["Accessories", ["accessories", "accessory", "wire", "wiring", "breadboard", "wheel", "chassis", "bracket"]],
  ["Controllers", ["controllers", "controller", "board", "arduino", "esp32", "esp8266", "raspberry", "stm32"]],
  ["IoT & Communication", ["iot", "communication", "wireless", "wifi", "bluetooth", "lora", "gsm", "nrf24", "gps", "relay", "buzzer", "lcd"]],
  ["Motors & Drivers", ["motors", "motor", "driver", "servo", "stepper", "l298n", "tb6612", "drv8833"]],
  ["Power", ["power", "battery", "charger", "converter", "regulator", "adapter"]],
  ["Sensors", ["sensors", "sensor", "ultrasonic", "ir", "temperature", "humidity", "gas", "soil", "water", "rfid", "ldr", "pir"]]
];

const DETAIL_QUERY_TERMS = [
  "tell me about",
  "what is",
  "explain",
  "details",
  "detail",
  "description",
  "spec",
  "specs",
  "how to use",
  "what does",
  "compare",
  "ជាអ្វី",
  "ប្រើសម្រាប់អ្វី",
  "ពន្យល់",
  "លម្អិត"
];

function unique(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function getItemStock(item, type) {
  return Number(type === "kit" ? item.stockQuantity ?? item.stock ?? 0 : item.stock ?? 0);
}

function getCategoryName(item, type) {
  return type === "kit" ? "Robot Kit" : typeof item.category === "string" ? item.category : item.category?.name || "Components";
}

function compactText(value) {
  return String(value || "")
    .replace(/[?!.,;:()[\]{}"'`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function inferProjectTypes(text, category) {
  const projectTypes = [];

  if (includesAny(text, ["line", "tcrt5000", "reflectance"])) projectTypes.push("line_follower");
  if (includesAny(text, ["obstacle", "ultrasonic", "hc-sr04", "distance", "vl53l0x"])) projectTypes.push("obstacle_avoider");
  if (includesAny(text, ["robot car", "smart car", "2wd", "4wd", "chassis", "wheel", "tt motor"])) projectTypes.push("robot_car");
  if (includesAny(text, ["arm", "servo", "pick and place", "pan tilt"])) projectTypes.push("robot_arm");
  if (includesAny(text, ["arduino", "beginner", "starter", "breadboard", "jumper"])) projectTypes.push("arduino_beginner");
  if (includesAny(text, ["wifi", "bluetooth", "iot", "esp32", "esp8266", "nodemcu"])) projectTypes.push("iot_robot");
  if (includesAny(text, ["temperature", "humidity", "gas", "soil", "water", "weather", "environment"])) projectTypes.push("environment_monitoring");
  if (includesAny(text, ["bluetooth", "wireless", "lora", "nrf24", "hc-05"])) projectTypes.push("wireless_control");
  if (category === "Power" || includesAny(text, ["battery", "charger", "converter", "regulator", "power"])) projectTypes.push("power_system");

  return unique(projectTypes.length ? projectTypes : ["general_robotics"]);
}

function inferSubcategories(text, category) {
  const matched = SUBCATEGORY_RULES.filter((rule) => includesAny(text, rule.terms)).map((rule) => rule.name);

  if (category === "Sensors" && includesAny(text, ["temperature", "humidity", "gas", "soil", "water", "rain", "weather", "dht", "bme280", "bmp280", "moisture"])) {
    matched.push("environment_monitoring");
  }

  if (category === "IoT & Communication" && includesAny(text, ["wireless", "wifi", "bluetooth", "lora", "nrf24", "gsm", "esp8266"])) {
    matched.push("wireless_communication");
  }

  return unique(matched);
}

function getFallbackKeys(category, subcategories = []) {
  const keys = [category];

  for (const subcategory of subcategories) {
    const rule = SUBCATEGORY_RULES.find((entry) => entry.name === subcategory);
    if (rule?.fallbackKey) {
      keys.push(rule.fallbackKey);
    }
  }

  return unique(keys);
}

function getFallbackMetadata(category, subcategories = []) {
  const fallbacks = getFallbackKeys(category, subcategories)
    .map((key) => CATEGORY_FALLBACKS[key])
    .filter(Boolean);

  return {
    tags: unique(fallbacks.flatMap((fallback) => fallback.tags || [])),
    useCases: unique(fallbacks.flatMap((fallback) => fallback.useCases || [])),
    projectTypes: unique(fallbacks.flatMap((fallback) => fallback.projectTypes || [])),
    khmerSummary: fallbacks.find((fallback) => fallback.khmerSummary)?.khmerSummary || "",
    subcategories
  };
}

export function buildFallbackMetadataForItem(item, type = "product") {
  const category = getCategoryName(item, type);
  const baseText = compactText([
    item?.name,
    item?.slug,
    item?.sku,
    category,
    item?.description,
    item?.overview,
    item?.level,
    ...(Array.isArray(item?.features) ? item.features : []),
    ...(Array.isArray(item?.voltages) ? item.voltages : [])
  ].join(" ").toLowerCase());
  const subcategories = inferSubcategories(baseText, category);
  const metadata = getFallbackMetadata(category, subcategories);

  return {
    category,
    subcategories,
    tags: metadata.tags,
    useCases: metadata.useCases,
    projectTypes: unique([...inferProjectTypes(baseText, category), ...metadata.projectTypes]),
    khmerSummary: metadata.khmerSummary
  };
}

function inferDifficulty(text, type) {
  if (text.includes("advanced")) return "advanced";
  if (text.includes("intermediate")) return "intermediate";
  if (text.includes("beginner") || text.includes("starter") || text.includes("arduino uno") || text.includes("jumper") || type === "kit") return "beginner";
  return undefined;
}

export function normalizeQuery(input = "") {
  const original = String(input || "").toLowerCase();
  const appended = [];

  for (const [term, tokens] of KHMER_QUERY_MAPPINGS) {
    if (original.includes(term.toLowerCase())) {
      appended.push(tokens);
    }
  }

  let normalized = compactText(`${original} ${appended.join(" ")}`);

  for (const [term, replacement] of ALIAS_QUERY_MAPPINGS) {
    const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    if (pattern.test(normalized)) {
      normalized = `${normalized} ${replacement}`;
    }
  }

  return compactText(normalized);
}

export function detectChatIntent(normalizedQuery = "") {
  const query = normalizeQuery(normalizedQuery);

  if (!query) return "unknown";
  if (includesAny(query, ["cheap", "budget", "low price", "affordable", "under", "below"])) return "budget_recommendation";
  if (includesAny(query, ["cannot", "can't", "does not", "doesn't", "not working", "not detect", "not moving", "not spinning", "troubleshoot", "fix"])) return "troubleshooting";
  if (includesAny(query, ["compatible", "compatibility", "work with", "works with", "use with", "can i use"])) return "compatibility_question";
  if (includesAny(query, ["compare", " vs ", "versus", "difference"])) return "compare_products";
  if (includesAny(query, ["price", "cost", "stock", "available", "availability"])) return "stock_or_price_question";
  if (includesAny(query, ["how to build", "how do i build", "how to make"])) return "how_to_build";
  if (includesAny(query, ["what is", "how does", "how do", "explain"])) return "project_explanation";
  if (includesAny(query, ["build", "make", "project", "need", "what do i need"])) return "recommend_project_parts";
  if (includesAny(query, ["kit", "kits", "set", "full kit"])) return "recommend_kit";
  if (CATEGORY_TERMS.some(([, terms]) => includesAny(query, terms))) return "find_product";

  return "unknown";
}

export function detectProjectTypes(normalizedQuery = "") {
  const query = normalizeQuery(normalizedQuery);
  return PROJECT_DETECTORS.filter(([, terms]) => includesAny(query, terms)).map(([projectType]) => projectType);
}

export function enrichCatalogItem(item, type = "product") {
  const category = getCategoryName(item, type);
  const identityText = compactText([item.name, item.slug, item.sku].join(" ").toLowerCase());
  const baseText = compactText([item.name, item.slug, item.sku, category, item.description, item.overview, item.level].join(" ").toLowerCase());
  const dbCompatibility = Array.isArray(item.compatibility) ? item.compatibility : [];
  const dbFeatures = Array.isArray(item.features) ? item.features : [];
  const fallbackMetadata = buildFallbackMetadataForItem(item, type);
  const tags = [
    ...(CATEGORY_TAGS[category] || []),
    ...fallbackMetadata.tags,
    ...fallbackMetadata.subcategories,
    ...dbFeatures.slice(0, 4).map((feature) => normalizeQuery(feature))
  ];
  const aliases = [item.slug, item.sku];
  const useCases = [...fallbackMetadata.useCases];
  const compatibleWith = [...dbCompatibility];
  const projectTypes = [...fallbackMetadata.projectTypes];
  let difficulty = inferDifficulty(baseText, type);
  let searchPriority = item.featured ? 8 : fallbackMetadata.subcategories.length ? 4 : 0;

  for (const rule of PRODUCT_METADATA_RULES) {
    if (rule.match.some((term) => identityText.includes(term))) {
      tags.push(...rule.tags);
      aliases.push(...rule.aliases);
      useCases.push(...rule.useCases);
      compatibleWith.push(...(rule.compatibleWith || []));
      projectTypes.push(...rule.projectTypes);
      difficulty = difficulty || rule.difficulty;
      searchPriority += rule.searchPriority || 0;
    }
  }

  if (type === "kit") {
    aliases.push(item.name, item.sku);
    tags.push("kit", "robot kit", "complete kit", item.level || "");
    useCases.push("complete robot build", item.description || "");
    searchPriority += item.featured ? 20 : 5;
  }

  return {
    id: item.id,
    type,
    source: item,
    name: item.name,
    category,
    price: Number(item.price || 0),
    stock: getItemStock(item, type),
    description: item.description || item.overview || "",
    tags: unique(tags.map((tag) => normalizeQuery(tag))),
    aliases: unique(aliases.map((alias) => normalizeQuery(alias))),
    useCases: unique(useCases.map((useCase) => normalizeQuery(useCase))),
    compatibleWith: unique(compatibleWith),
    projectTypes: unique(projectTypes),
    subcategories: fallbackMetadata.subcategories,
    khmerSummary: fallbackMetadata.khmerSummary,
    difficulty,
    voltages: Array.isArray(item.voltages) ? item.voltages : item.voltage ? [item.voltage] : [],
    searchPriority
  };
}

function detectRequestedCategory(normalizedQuery) {
  if (/\bsensors?\b/.test(normalizedQuery)) {
    return "Sensors";
  }

  if (/\bkits?\b/.test(normalizedQuery)) {
    return null;
  }

  const match = CATEGORY_TERMS.find(([, terms]) => includesAny(normalizedQuery, terms));
  return match ? match[0] : null;
}

function textIncludesFromList(query, values) {
  return values.some((value) => {
    const normalizedValue = normalizeQuery(value);
    return normalizedValue && (query.includes(normalizedValue) || normalizedValue.split(/\s+/).some((term) => term.length > 2 && query.includes(term)));
  });
}

export function scoreCatalogItem(item, normalizedQuery, intent, detectedProjectTypes = []) {
  const searchable = normalizeQuery([
    item.name,
    item.category,
    item.description,
    ...item.tags,
    ...item.aliases,
    ...item.useCases,
    ...item.compatibleWith,
    ...item.projectTypes,
    ...(item.subcategories || []),
    ...(item.voltages || [])
  ].join(" "));
  const requestedCategory = detectRequestedCategory(normalizedQuery);
  const reasonCodes = [];
  let score = 0;

  if (normalizeQuery(item.name) && normalizedQuery.includes(normalizeQuery(item.name))) {
    score += 100;
    reasonCodes.push("exactName");
  }

  if (textIncludesFromList(normalizedQuery, item.aliases)) {
    score += 80;
    reasonCodes.push("alias");
  }

  const projectMatches = detectedProjectTypes.filter((projectType) => item.projectTypes.includes(projectType));
  if (projectMatches.length) {
    score += 60 + projectMatches.length * 6;
    reasonCodes.push("projectType");
  }

  const subcategoryMatches = [
    detectedProjectTypes.includes("environment_monitoring") && item.subcategories?.includes("environment_monitoring"),
    detectedProjectTypes.includes("wireless_control") && item.subcategories?.includes("wireless_communication"),
    detectedProjectTypes.includes("iot_robot") && item.subcategories?.includes("wireless_communication"),
    detectedProjectTypes.includes("power_system") && item.subcategories?.includes("power_management")
  ].filter(Boolean).length;
  if (subcategoryMatches) {
    score += 50 + subcategoryMatches * 8;
    reasonCodes.push("subcategory");
  }

  if (detectedProjectTypes.includes("environment_monitoring") && item.category === "Sensors" && !item.subcategories?.includes("environment_monitoring")) {
    score -= 80;
  }

  if (detectedProjectTypes.includes("wireless_control") && item.category === "IoT & Communication" && !item.subcategories?.includes("wireless_communication")) {
    score -= 60;
  }

  if (detectedProjectTypes.includes("power_system") && item.category === "Power" && !item.subcategories?.includes("power_management")) {
    score -= 50;
  }

  if (textIncludesFromList(normalizedQuery, item.useCases)) {
    score += 55;
    reasonCodes.push("useCase");
  }

  if (requestedCategory && item.category === requestedCategory) {
    score += 35;
    reasonCodes.push("category");
  }

  if (textIncludesFromList(normalizedQuery, item.tags)) {
    score += 30;
    reasonCodes.push("tag");
  }

  if (textIncludesFromList(normalizedQuery, item.compatibleWith)) {
    score += 25;
    reasonCodes.push("compatibleWith");
  }

  if (normalizedQuery.split(/\s+/).some((term) => term.length > 2 && searchable.includes(term))) {
    score += 15;
    reasonCodes.push("description");
  }

  if (normalizedQuery.includes("beginner") && item.difficulty === "beginner") {
    score += 25;
    reasonCodes.push("beginner");
  }

  if (intent === "budget_recommendation" && item.price > 0 && item.price <= 5) {
    score += 20;
    reasonCodes.push("budget");
  }

  if (item.stock > 0) {
    score += 15;
    reasonCodes.push("stock");
  } else {
    score -= 60;
    reasonCodes.push("outOfStock");
  }

  score += item.searchPriority || 0;

  if (!reasonCodes.some((reason) => ["exactName", "alias", "projectType", "useCase", "category", "tag", "compatibleWith", "description"].includes(reason))) {
    return { item, score: 0, reasonCodes: [] };
  }

  return { item, score: Math.max(0, score), reasonCodes };
}

function pickBundleItem(enrichedItems, config, usedIds) {
  return enrichedItems
    .filter((item) => item.type === "product" && item.stock > 0 && !usedIds.has(item.id))
    .map((item) => {
      const itemText = normalizeQuery([item.name, ...item.aliases, ...item.tags].join(" "));
      const preferredIndex = config.prefer.findIndex((name) => normalizeQuery(item.name).includes(normalizeQuery(name)));
      const termMatch = config.terms.some((term) => itemText.includes(term));
      const score = (preferredIndex >= 0 ? 100 - preferredIndex * 4 : 0) + (termMatch ? 40 : 0) + (item.searchPriority || 0) - item.price / 100;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((first, second) => second.score - first.score || first.item.price - second.item.price)[0]?.item;
}

function buildProjectBundle(enrichedItems, projectType) {
  const configs = PROJECT_BUNDLES[projectType] || [];
  const usedIds = new Set();
  const selected = [];

  for (const config of configs) {
    const item = pickBundleItem(enrichedItems, config, usedIds);
    if (!item) continue;
    usedIds.add(item.id);
    selected.push({ item, score: 200 + (item.searchPriority || 0), reasonCodes: ["projectType", "useCase", "stock"], group: config.group });
  }

  return selected;
}

export function searchRelevantCatalogItems({ products = [], robotKits = [], query = "", language = "en", limit = 8 } = {}) {
  const normalizedQuery = normalizeQuery(query);
  const intent = detectChatIntent(normalizedQuery);
  const projectTypes = detectProjectTypes(normalizedQuery);
  const requestedCategory = detectRequestedCategory(normalizedQuery);
  const enrichedItems = [
    ...products.map((product) => enrichCatalogItem(product, "product")),
    ...robotKits.map((kit) => enrichCatalogItem(kit, "kit"))
  ];
  const wantsKitsOnly = intent === "recommend_kit" && !includesAny(normalizedQuery, ["part", "parts", "component", "sensor", "motor", "driver"]);
  const primaryProjectType = projectTypes.find((projectType) => PROJECT_BUNDLES[projectType]);
  const scored =
    intent === "recommend_project_parts" && primaryProjectType
      ? buildProjectBundle(enrichedItems, primaryProjectType)
      : enrichedItems
          .filter((item) => {
            if (wantsKitsOnly) return item.type === "kit";
            if (requestedCategory && item.type === "product") return item.category === requestedCategory;
            if (intent === "find_product" || intent === "budget_recommendation" || intent === "compatibility_question") return item.type === "product";
            return true;
          })
          .map((item) => scoreCatalogItem(item, normalizedQuery, intent, projectTypes));

  const availableScored = scored.filter((entry) => entry.score >= 70 && entry.item.stock > 0);
  const topScore = Math.max(0, ...availableScored.map((entry) => entry.score));

  if (!normalizedQuery || intent === "unknown" || topScore < 70) {
    return {
      normalizedQuery,
      intent,
      projectTypes,
      matches: [],
      unavailableMatches: [],
      followUps: getFallbackFollowUps(language),
      label: "catalog recommendations"
    };
  }

  const sorted = availableScored.sort((first, second) => {
    if (intent === "budget_recommendation") {
      const relevanceDifference = Math.floor(second.score / 20) - Math.floor(first.score / 20);
      return relevanceDifference || first.item.price - second.item.price;
    }

    return second.score - first.score || second.item.stock - first.item.stock || first.item.price - second.item.price;
  });

  const matches = sorted.slice(0, limit);
  const unavailableMatches = scored
    .filter((entry) => entry.item.type === "kit" && entry.item.stock <= 0 && entry.score >= 70)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);

  return {
    normalizedQuery,
    intent,
    projectTypes,
    matches,
    unavailableMatches,
    includeDescriptions: shouldIncludeProductDescriptions({
      normalizedQuery,
      intent,
      matchedItems: matches
    }),
    followUps: getIntentFollowUps(intent, projectTypes, language),
    label: primaryProjectType ? `${primaryProjectType} parts` : "catalog recommendations"
  };
}

export function shouldIncludeProductDescriptions({ normalizedQuery = "", intent = "unknown", matchedItems = [] } = {}) {
  const query = normalizeQuery(normalizedQuery);

  if (DETAIL_QUERY_TERMS.some((term) => query.includes(term))) {
    return true;
  }

  if (intent === "compare_products") {
    return true;
  }

  if (matchedItems.length === 1) {
    const [entry] = matchedItems;
    const itemName = normalizeQuery(entry?.item?.name || "");
    const hasStrongProductMatch = Number(entry?.score || 0) >= 120 && itemName && query.includes(itemName);
    return hasStrongProductMatch;
  }

  return false;
}

function getFallbackFollowUps(language) {
  const followUps = ["Do you want robot sensors?", "Are you building a line-following robot?", "Do you need Arduino beginner parts?"];
  if (language !== "km") return followUps;
  return ["តើអ្នកចង់បានសេនស័ររ៉ូបូតទេ?", "តើអ្នកកំពុងធ្វើរ៉ូបូតដើរតាមខ្សែទេ?", "តើអ្នកត្រូវការគ្រឿង Arduino សម្រាប់អ្នកចាប់ផ្តើមទេ?"];
}

function getIntentFollowUps(intent, projectTypes, language) {
  const followUps = [];
  if (intent !== "recommend_kit") followUps.push("Show robot kits only");
  if (!projectTypes.includes("line_follower")) followUps.push("I want to build a line-following robot");
  if (!projectTypes.includes("obstacle_avoider")) followUps.push("What do I need for obstacle avoiding robot?");
  if (!projectTypes.includes("arduino_beginner")) followUps.push("Arduino beginner parts");
  return language === "km" ? followUps.map((item) => item) : followUps.slice(0, 3);
}

export function getCatalogMatchReason(entry) {
  const reasons = [];
  if (entry.group) reasons.push(entry.group);
  if (entry.reasonCodes.includes("exactName")) reasons.push("exact product match");
  if (entry.reasonCodes.includes("alias")) reasons.push("matched a known alias");
  if (entry.reasonCodes.includes("projectType")) reasons.push("fits the requested project");
  if (entry.reasonCodes.includes("category")) reasons.push("matches the requested category");
  if (entry.reasonCodes.includes("budget")) reasons.push("low-price option");
  if (entry.item.stock > 0) reasons.push("in stock");
  if (entry.item.stock <= 0) reasons.push("currently unavailable");
  return reasons.slice(0, 3).join(", ") || "relevant catalog match";
}

export function buildGroundedOllamaPrompt({ message, normalizedQuery, intent, projectTypes, matches, language, includeDescriptions = false }) {
  const responseLanguage = language === "km" ? "Khmer" : "English";
  const selectedItems = matches.slice(0, 10).map((entry) => ({
    name: entry.item.name,
    type: entry.item.type,
    category: entry.item.category,
    price: entry.item.price,
    stock: entry.item.stock,
    ...(includeDescriptions ? { description: entry.item.description } : {}),
    subcategories: entry.item.subcategories || [],
    projectTypes: entry.item.projectTypes || [],
    useCases: entry.item.useCases || [],
    tags: entry.item.tags || [],
    khmerSummary: entry.item.khmerSummary || "",
    reason: getCatalogMatchReason(entry)
  }));

  return `User message:
${message}

Normalized query:
${normalizedQuery}

Detected intent:
${intent}

Detected project types:
${projectTypes.join(", ") || "none"}

includeDescriptions:
${includeDescriptions ? "true" : "false"}

Matched database products/kits selected by the application:
${JSON.stringify(selectedItems, null, 2)}

Rules:
- Answer only using the provided products/kits.
- Do not invent product names, prices, stock, voltage, compatibility, specifications, links, or URLs.
- Do not expose internal routes such as /products/... or /robot-kits/... in the natural reply.
- Keep official product and model names exactly as provided in the catalog data, in English.
- If the detected language is Khmer, explain naturally in Khmer while preserving technical model names such as Arduino Uno, ESP32, HC-SR04, TCRT5000, L298N, TB6612FNG, DRV8833, SG90, Raspberry Pi, and DHT11 in English.
- If a kit is out of stock, clearly say it is currently unavailable.
- Product cards/buttons are handled by the application, not by your text.
- If includeDescriptions is false, reply with only one short customer-facing introduction. Do not list product names, do not describe each product, do not repeat stock item by item, and do not mention "Recommended matches". Product cards will show the items.
- If includeDescriptions is true, you may briefly explain the specific product or comparison using only the provided database data.
- Use inferred category, subcategory, projectTypes, useCases, tags, and fallback summaries to explain educationally, but only the listed products/kits are store truth.
- Keep the reply customer-friendly and concise.
- Answer in ${responseLanguage}.
- If there are no relevant products, ask a helpful clarification.`;
}

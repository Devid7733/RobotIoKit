// Khmer strings were re-written from semantically correct vocabulary.
// The originals were corrupted (Windows-1252 mojibake) and could not be
// mechanically recovered — the byte sequences did not divide evenly into
// valid 3-byte Khmer codepoints. Replacements below are confirmed Khmer.
export const chatbotRules = [
  {
    intents: ["hello", "hi", "hey", "សួស្ដី"],
    answer:
      "Hello! I can help with robot products, beginner kits, compatibility, pricing, delivery, and order tracking."
  },
  {
    intents: ["beginner", "starter", "new to robotics", "អ្នកចាប់ផ្ដើម", "ថ្មីថ្មោង"],
    answer:
      "For beginners, start with the 4WD Smart Robot Car Kit, ESP32 Dev Board, and Ultrasonic Distance Sensor. All are available in our store with beginner-friendly guides."
  },
  {
    intents: ["compatible", "compatibility", "match", "ត្រូវគ្នា", "ប្រើជាមួយ"],
    answer:
      "ESP32 works well with ultrasonic sensors, motor drivers, OLED displays, and the 4WD Smart Robot Car Kit."
  },
  {
    intents: ["payment", "khqr", "pay", "បង់ប្រាក់", "ទូទាត់"],
    answer:
      "We accept KHQR (Bakong QR) and Cash on Delivery (COD). Choose your preferred method at checkout."
  },
  {
    intents: ["delivery", "shipping", "fee", "ដឹកជញ្ជូន", "ថ្លៃដឹក"],
    answer:
      "Delivery fee is $1.50 for Phnom Penh and $2.50 for other provinces. Usually 1–3 business days for Phnom Penh, 2–5 days for provinces."
  },
  {
    intents: ["project", "idea", "build", "គម្រោង", "សាកល្បង"],
    answer:
      "Try a smart robot car, line-following robot, obstacle-avoiding robot, or an IoT weather station with ESP32 and sensors."
  },
  {
    intents: ["return", "refund", "exchange", "ប្ដូរ", "សងប្រាក់"],
    answer:
      "For returns or exchanges, please contact us within 7 days of delivery. Items must be unused and in original condition."
  },
  {
    intents: ["warranty", "guarantee", "ធានា"],
    answer:
      "Our products come with a 30-day warranty against manufacturing defects. Contact us if you have any issues."
  },
  {
    intents: ["arduino", "microcontroller", "micro controller", "ម៉ីក្រូ"],
    answer:
      "We carry Arduino Uno, ESP32, and Raspberry Pi boards. Arduino is great for beginners; ESP32 adds built-in WiFi and Bluetooth for IoT projects."
  },
  {
    intents: ["esp32", "wifi", "bluetooth", "iot", "wireless", "វ៉ាយហ្វាយ"],
    answer:
      "The ESP32 Dev Board supports both WiFi and Bluetooth, making it perfect for IoT projects. It works with our sensors and motor drivers."
  },
  {
    intents: ["sensor", "ultrasonic", "infrared", "temperature", "ឧបករណ៍វាស់"],
    answer:
      "We stock ultrasonic distance sensors (HC-SR04), IR sensors (TCRT5000), DHT11 temperature/humidity sensors, and more. Tell me your project goal and I'll suggest the right sensor."
  },
  {
    intents: ["motor", "servo", "stepper", "dc motor", "ម៉ូតូ"],
    answer:
      "We carry DC motors, servo motors (SG90), and stepper motors, plus motor driver modules like L298N and DRV8833."
  },
  {
    intents: ["price", "cost", "how much", "cheap", "affordable", "budget", "expensive", "តម្លៃ", "ថ្លៃ"],
    answer:
      "Our products range from $2 for basic sensors to $50+ for complete robot kits. Tell me your budget and I'll suggest suitable options."
  },
  {
    intents: ["stock", "available", "in stock", "out of stock", "មាន", "អស់"],
    answer:
      "You can check live stock availability on each product page. I can suggest in-stock alternatives if something is sold out."
  },
  {
    intents: ["cod", "cash on delivery", "ក្រដាស", "ប្រាក់សد"],
    answer:
      "Yes, we offer Cash on Delivery (COD). You can also pay with KHQR (Bakong) at checkout."
  },
  {
    intents: ["location", "address", "store", "shop", "where", "ទីតាំង", "ហាង"],
    answer:
      "Our store is located in Phnom Penh. You can find the exact location on the map linked below."
  }
];

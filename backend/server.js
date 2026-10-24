
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;
const DB = path.join(__dirname, "data.json");

app.use(cors({
  origin: [
    "http://127.0.0.1:5173",
    "http://localhost:5173"
  ]
}));

app.use(express.json({ limit: "100kb" }));

const STATUSES = [
  "Order Placed",
  "Preparing",
  "Picked Up",
  "On the Way",
  "Delivered"
];

const menu = [
  {
    id: 1,
    name: "Truffle Smash Burger",
    category: "Burgers",
    price: 249,
    rating: 4.9,
    time: "20–30 min",
    tag: "Bestseller",
    emoji: "🍔",
    color: "#ffe4c7",
    description: "Double patty, cheddar, truffle mayo & toasted brioche"
  },
  {
    id: 2,
    name: "Margherita Supreme",
    category: "Pizza",
    price: 329,
    rating: 4.8,
    time: "25–35 min",
    tag: "Popular",
    emoji: "🍕",
    color: "#ffe0d9",
    description: "Stone-baked crust, fresh mozzarella & basil"
  },
  {
    id: 3,
    name: "Spicy Ramen Bowl",
    category: "Asian",
    price: 289,
    rating: 4.9,
    time: "25–35 min",
    tag: "Chef's pick",
    emoji: "🍜",
    color: "#ffe9c5",
    description: "Rich broth, noodles, soft egg & chili oil"
  },
  {
    id: 4,
    name: "Loaded Peri Peri Fries",
    category: "Sides",
    price: 169,
    rating: 4.7,
    time: "15–25 min",
    tag: "Trending",
    emoji: "🍟",
    color: "#fff0c6",
    description: "Crispy fries, spicy peri peri seasoning & dip"
  },
  {
    id: 5,
    name: "Creamy Alfredo Pasta",
    category: "Italian",
    price: 299,
    rating: 4.8,
    time: "25–35 min",
    tag: "Popular",
    emoji: "🍝",
    color: "#ffebd7",
    description: "Silky parmesan sauce, herbs & garlic"
  },
  {
    id: 6,
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 189,
    rating: 4.9,
    time: "15–25 min",
    tag: "Sweet treat",
    emoji: "🍫",
    color: "#e9d9d1",
    description: "Warm chocolate cake with a molten center"
  },
  {
    id: 7,
    name: "Paneer Tikka Wrap",
    category: "Wraps",
    price: 219,
    rating: 4.8,
    time: "20–30 min",
    tag: "Veg favorite",
    emoji: "🌯",
    color: "#e8edce",
    description: "Smoky paneer, crunchy salad & mint chutney"
  },
  {
    id: 8,
    name: "Berry Bliss Smoothie",
    category: "Drinks",
    price: 159,
    rating: 4.7,
    time: "10–20 min",
    tag: "Refreshing",
    emoji: "🥤",
    color: "#f9dce8",
    description: "Mixed berries, yogurt & a touch of honey"
  }
];

function readDB() {
  try {
    const data = JSON.parse(fs.readFileSync(DB, "utf8"));
    return {
      orders: Array.isArray(data.orders) ? data.orders : []
    };
  } catch {
    return { orders: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

function getStatus(order) {
  if (order.manualStatus) {
    return order.manualStatus;
  }

  const elapsed = Math.max(
    0,
    Date.now() - new Date(order.createdAt).getTime()
  );

  const index = Math.min(
    STATUSES.length - 1,
    Math.floor(elapsed / 30000)
  );

  return STATUSES[index];
}

function hydrate(order) {
  return {
    ...order,
    status: getStatus(order)
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/menu", (req, res) => {
  res.json(menu);
});

app.get("/api/orders", (req, res) => {
  const db = readDB();

  res.json(
    db.orders.slice().reverse().map(hydrate)
  );
});

app.post("/api/orders", (req, res) => {
  const { customer, address, phone, items } = req.body || {};

  if (
    typeof customer !== "string" ||
    !customer.trim() ||
    customer.length > 80 ||
    typeof address !== "string" ||
    !address.trim() ||
    address.length > 240 ||
    typeof phone !== "string" ||
    !/^[0-9+()\s-]{7,18}$/.test(phone) ||
    !Array.isArray(items) ||
    !items.length ||
    items.length > 30
  ) {
    return res.status(400).json({
      error: "Please provide valid customer, phone, address and items."
    });
  }

  const normalized = [];

  for (const item of items) {
    const found = menu.find(
      food => food.id === Number(item.id)
    );

    const quantity = Number(item.quantity);

    if (
      !found ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    ) {
      return res.status(400).json({
        error: "Invalid food item or quantity."
      });
    }

    normalized.push({
      id: found.id,
      name: found.name,
      price: found.price,
      emoji: found.emoji,
      quantity
    });
  }

  const subtotal = normalized.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryFee = subtotal >= 499 ? 0 : 39;

  const order = {
    id: "FT-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
    customer: customer.trim(),
    phone: phone.trim(),
    address: address.trim(),
    items: normalized,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    createdAt: new Date().toISOString(),
    manualStatus: null
  };

  const db = readDB();
  db.orders.push(order);
  saveDB(db);

  res.status(201).json(hydrate(order));
});

app.patch("/api/orders/:id/status", (req, res) => {
  const { status } = req.body || {};

  if (!STATUSES.includes(status)) {
    return res.status(400).json({
      error: "Invalid status."
    });
  }

  const db = readDB();
  const order = db.orders.find(
    item => item.id === req.params.id
  );

  if (!order) {
    return res.status(404).json({
      error: "Order not found."
    });
  }

  order.manualStatus = status;
  saveDB(db);

  res.json(hydrate(order));
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `FoodTrack backend: http://127.0.0.1:${PORT}`
  );
});

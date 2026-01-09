

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();

/* ===== CONNECT DB ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

/* ===== SCHEMA ===== */
const Counter = mongoose.model(
  "Counter",
  new mongoose.Schema({
    _id: String,
    count: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  })
);

/* ===== COUNTER API ===== */
app.get("/counter/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send("Missing id");

  // Update counter dan ambil nilai terbaru
  const result = await Counter.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true }
  );

  // Kirim response sebagai SVG dengan angka counter
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="30">
      <rect width="100" height="30" fill="#007acc" rx="5"/>
      <text x="50" y="20" font-family="Arial" font-size="14" fill="white" text-anchor="middle">
        Views: ${result.count}
      </text>
    </svg>
  `;

  res.set("Content-Type", "image/svg+xml");
  res.send(svg);
});

// Endpoint untuk melihat data counter (untuk debugging)
app.get("/api/counter/:id", async (req, res) => {
  const { id } = req.params;
  const counter = await Counter.findById(id);
  res.json(counter || { _id: id, count: 0, message: "Counter not found" });
});

app.listen(8080, () => console.log("Server running on 8080"));

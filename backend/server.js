

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
  const timestamp = Date.now();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="30">
      <rect width="120" height="30" fill="#007acc" rx="5"/>
      <text x="60" y="20" font-family="Arial" font-size="14" fill="white" text-anchor="middle">
        Views: ${result.count}
      </text>
      <!-- Cache buster: ${timestamp} -->
    </svg>
  `;

  // Header untuk mencegah caching
  res.set({
    "Content-Type": "image/svg+xml",
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "Thu, 01 Jan 1970 00:00:00 GMT",
    "Last-Modified": new Date().toUTCString(),
    "ETag": `"${timestamp}-${result.count}"`
  });
  res.send(svg);
});

// Endpoint khusus untuk forum dengan redirect untuk bypass cache
app.get("/forum-counter/:id", async (req, res) => {
  const timestamp = Date.now();
  const redirectUrl = `/counter/${req.params.id}?t=${timestamp}`;
  res.redirect(302, redirectUrl);
});

// Endpoint untuk melihat data counter (untuk debugging)
app.get("/api/counter/:id", async (req, res) => {
  const { id } = req.params;
  const counter = await Counter.findById(id);
  res.json(counter || { _id: id, count: 0, message: "Counter not found" });
});

app.listen(8080, () => console.log("Server running on 8080"));

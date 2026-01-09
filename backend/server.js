

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
app.get("/counter", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  await Counter.updateOne(
    { _id: id },
    { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
    { upsert: true }
  );

  const img = Buffer.from("R0lGODlhAQABAAAAACwAAAAAAQABAAA=", "base64");
  res.set("Content-Type", "image/gif");
  res.send(img);
});

app.listen(3000, () => console.log("Server running on 3000"));

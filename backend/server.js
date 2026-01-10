require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const geoip = require("geoip-lite");

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

const CountryStats = mongoose.model(
  "CountryStats",
  new mongoose.Schema({
    _id: String, // counter ID
    countries: [{
      code: String,
      name: String,
      count: { type: Number, default: 0 }
    }],
    updatedAt: { type: Date, default: Date.now }
  })
);

/* ===== COUNTER API ===== */
/* ===== COUNTER API (Updated Design) ===== */
app.get("/counter/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send("Missing id");

  // Dapatkan IP address pengunjung
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.socket.remoteAddress ||
                   req.ip;
  
  // Lookup lokasi berdasarkan IP
  const geo = geoip.lookup(clientIP);
  let countryCode = 'Unknown';
  let countryName = 'Unknown';
  
  if (geo && geo.country) {
    countryCode = geo.country;
    // Mapping nama negara (bisa diperluas)
    const countryNames = {
      'ID': 'Indonesia',
      'US': 'United States',
      'SG': 'Singapore',
      'MY': 'Malaysia',
      'TH': 'Thailand',
      'PH': 'Philippines',
      'VN': 'Vietnam',
      'JP': 'Japan',
      'KR': 'South Korea',
      'CN': 'China',
      'IN': 'India',
      'AU': 'Australia',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'CA': 'Canada',
      'BR': 'Brazil',
      'RU': 'Russia',
      'NL': 'Netherlands',
      'IT': 'Italy'
    };
    countryName = countryNames[countryCode] || countryCode;
  }

  // Update counter utama
  const result = await Counter.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true }
  );

  // Update statistik negara dengan logika yang lebih aman
  try {
    // Coba update negara yang sudah ada
    const updateResult = await CountryStats.findOneAndUpdate(
      { _id: id, "countries.code": countryCode },
      { 
        $inc: { "countries.$.count": 1 },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    // Jika negara belum ada, tambahkan negara baru
    if (!updateResult) {
      await CountryStats.findOneAndUpdate(
        { _id: id },
        { 
          $push: { 
            countries: { 
              code: countryCode, 
              name: countryName, 
              count: 1 
            } 
          },
          $set: { updatedAt: new Date() }
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Error updating country stats:', error);
  }

  const timestamp = Date.now();
  const countStr = result.count.toLocaleString(); // Format angka (misal: 1,000)
  
  // Desain Badge Modern
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="110" height="20" role="img" aria-label="Views: ${countStr}">
      <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <clipPath id="r">
        <rect width="110" height="20" rx="3" fill="#fff"/>
      </clipPath>
      <g clip-path="url(#r)">
        <rect width="65" height="20" fill="#555"/>
        <rect x="65" width="45" height="20" fill="#007acc"/>
        <rect width="110" height="20" fill="url(#s)"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <text aria-hidden="true" x="335" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="550">VIEWS</text>
        <text x="335" y="140" transform="scale(.1)" fill="#fff" textLength="550">VISITED</text>
        <text aria-hidden="true" x="875" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="350">${countStr}</text>
        <text x="875" y="140" transform="scale(.1)" fill="#fff" textLength="350">${countStr}</text>
      </g>
    </svg>
  `;

  res.set({
    "Content-Type": "image/svg+xml",
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
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

// Endpoint untuk menampilkan badge dengan statistik negara (top 5)
app.get("/country-stats/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send("Missing id");

  // Ambil data counter dan statistik negara
  const counter = await Counter.findById(id);
  const countryStats = await CountryStats.findById(id);
  
  const totalCount = counter ? counter.count : 0;
  const countries = countryStats ? countryStats.countries : [];
  
  // Urutkan negara berdasarkan count dan ambil 5 teratas
  const top5Countries = countries
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const timestamp = Date.now();
  const countStr = totalCount.toLocaleString();
  
  // Hitung tinggi SVG berdasarkan jumlah negara
  const baseHeight = 20;
  const countryHeight = 16;
  const totalHeight = baseHeight + (top5Countries.length * countryHeight);
  
  // Generate teks untuk negara
  let countryTexts = '';
  
  top5Countries.forEach((country, index) => {
    const y = baseHeight + (index * countryHeight) + 12;
    const percentage = totalCount > 0 ? ((country.count / totalCount) * 100).toFixed(1) : 0;
    
    countryTexts += `
      <text x="10" y="${y}" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" fill="#333">
        ${country.name}: ${country.count} (${percentage}%)
      </text>`;
  });

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="280" height="${totalHeight}" role="img">
      <rect width="280" height="${totalHeight}" fill="#f6f8fa" stroke="#d1d5da" stroke-width="1" rx="6"/>
      
      <!-- Header -->
      <rect width="280" height="20" fill="#0366d6" rx="6"/>
      <rect width="280" height="14" fill="#0366d6"/>
      
      <text x="140" y="14" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" 
            font-size="12" font-weight="bold" fill="white">
        Total Views: ${countStr}
      </text>
      
      <!-- Country Stats -->
      ${countryTexts}
      
      ${top5Countries.length === 0 ? 
        `<text x="140" y="${baseHeight + 12}" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" 
               font-size="11" fill="#666">No country data available</text>` : ''}
    </svg>
  `;

  res.set({
    "Content-Type": "image/svg+xml",
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "ETag": `"${timestamp}-${totalCount}"`
  });
  res.send(svg);
});

// Endpoint untuk melihat data counter (untuk debugging)
app.get("/api/counter/:id", async (req, res) => {
  const { id } = req.params;
  const counter = await Counter.findById(id);
  res.json(counter || { _id: id, count: 0, message: "Counter not found" });
});

// Endpoint untuk melihat statistik negara
app.get("/api/country-stats/:id", async (req, res) => {
  const { id } = req.params;
  const countryStats = await CountryStats.findById(id);
  const counter = await Counter.findById(id);
  
  if (!countryStats) {
    return res.json({ 
      _id: id, 
      totalCount: counter ? counter.count : 0,
      countries: [], 
      message: "Country stats not found" 
    });
  }
  
  // Urutkan negara berdasarkan count
  const sortedCountries = countryStats.countries
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Batasi 5 teratas
  
  res.json({
    _id: id,
    totalCount: counter ? counter.count : 0,
    countries: sortedCountries,
    updatedAt: countryStats.updatedAt
  });
});

app.listen(8080, () => console.log("Server running on 8080"));

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const geoip = require("geoip-lite");

const app = express();

/* ===== CONNECT DB ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

/* ===== UPDATE SCHEMA ===== */
const Counter = mongoose.model(
  "Counter",
  new mongoose.Schema({
    _id: String,
    count: { type: Number, default: 0 },
    countries: { type: Map, of: Number, default: {} }, // Menyimpan data { "ID": 10, "US": 5 }
    updatedAt: { type: Date, default: Date.now }
  })
);

/* ===== COUNTER API WITH GEO ===== */
app.get("/counter/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send("Missing id");

  // 1. Ambil IP Pengunjung
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.connection.remoteAddress;
  
  // 2. Lookup Negara berdasarkan IP
  const geo = geoip.lookup(ip);
  const countryCode = geo ? geo.country : "Unknown";

  // 3. Update Database (Increment total views & Increment hit per negara)
  const updateQuery = {
    $inc: { 
      count: 1,
      [`countries.${countryCode}`]: 1
    },
    $set: { updatedAt: new Date() }
  };

  const result = await Counter.findOneAndUpdate(
    { _id: id },
    updateQuery,
    { upsert: true, new: true }
  );

  // 4. Kirim SVG (Desain dengan info Negara)
  const timestamp = Date.now();
  const countStr = result.count.toLocaleString();
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" role="img" aria-label="Views: ${countStr}">
      <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <clipPath id="r">
        <rect width="150" height="20" rx="3" fill="#fff"/>
      </clipPath>
      <g clip-path="url(#r)">
        <rect width="70" height="20" fill="#555"/>
        <rect x="70" width="80" height="20" fill="#44bb44"/>
        <rect width="150" height="20" fill="url(#s)"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <text aria-hidden="true" x="355" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="600">VIEWS</text>
        <text x="355" y="140" transform="scale(.1)" fill="#fff" textLength="600">VIEWS</text>
        <text aria-hidden="true" x="1105" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="700">${countStr} (${countryCode})</text>
        <text x="1105" y="140" transform="scale(.1)" fill="#fff" textLength="700">${countStr} (${countryCode})</text>
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

// Endpoint untuk melihat data counter (untuk debugging)
app.get("/api/counter/:id", async (req, res) => {
  const { id } = req.params;
  const counter = await Counter.findById(id);
  res.json(counter || { _id: id, count: 0, message: "Counter not found" });
});

/* ===== FITUR 5 NEGARA DINAMIS BERDASARKAN GEO DATA ===== */

// Fungsi untuk mendapatkan IP address yang sebenarnya
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '8.8.8.8';
}

// Database negara dengan info lengkap (tanpa emoji untuk menghindari error)
const countryDatabase = {
  'ID': { name: "Indonesia", flag: "ID", capital: "Jakarta", region: "Southeast Asia", color: "#FF0000" },
  'MY': { name: "Malaysia", flag: "MY", capital: "Kuala Lumpur", region: "Southeast Asia", color: "#0066CC" },
  'SG': { name: "Singapore", flag: "SG", capital: "Singapore", region: "Southeast Asia", color: "#FF6B6B" },
  'TH': { name: "Thailand", flag: "TH", capital: "Bangkok", region: "Southeast Asia", color: "#FF3333" },
  'PH': { name: "Philippines", flag: "PH", capital: "Manila", region: "Southeast Asia", color: "#0099FF" },
  'VN': { name: "Vietnam", flag: "VN", capital: "Hanoi", region: "Southeast Asia", color: "#FF6600" },
  'JP': { name: "Japan", flag: "JP", capital: "Tokyo", region: "East Asia", color: "#FF0066" },
  'KR': { name: "South Korea", flag: "KR", capital: "Seoul", region: "East Asia", color: "#0066FF" },
  'CN': { name: "China", flag: "CN", capital: "Beijing", region: "East Asia", color: "#FF3300" },
  'IN': { name: "India", flag: "IN", capital: "New Delhi", region: "South Asia", color: "#FF9900" },
  'US': { name: "United States", flag: "US", capital: "Washington D.C.", region: "North America", color: "#FF0000" },
  'CA': { name: "Canada", flag: "CA", capital: "Ottawa", region: "North America", color: "#FF0000" },
  'GB': { name: "United Kingdom", flag: "GB", capital: "London", region: "Western Europe", color: "#0066CC" },
  'DE': { name: "Germany", flag: "DE", capital: "Berlin", region: "Western Europe", color: "#000000" },
  'FR': { name: "France", flag: "FR", capital: "Paris", region: "Western Europe", color: "#0055AA" },
  'AU': { name: "Australia", flag: "AU", capital: "Canberra", region: "Oceania", color: "#0066FF" },
  'BR': { name: "Brazil", flag: "BR", capital: "Brasilia", region: "South America", color: "#009900" },
  'RU': { name: "Russia", flag: "RU", capital: "Moscow", region: "Eastern Europe", color: "#0066FF" },
  'Unknown': { name: "Unknown", flag: "??", capital: "Unknown", region: "Unknown", color: "#666666" }
};

app.get("/countries", async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    
    // Dapatkan info geolocation dari IP
    const geo = geoip.lookup(clientIP);
    const userCountry = geo ? geo.country : "Unknown";
    const userCity = geo ? geo.city : "Unknown";
    
    // Ambil semua data counter untuk mendapatkan statistik negara
    const allCounters = await Counter.find({});
    
    // Gabungkan semua data countries dari semua counter
    const countryStats = {};
    allCounters.forEach(counter => {
      if (counter.countries) {
        counter.countries.forEach((count, country) => {
          countryStats[country] = (countryStats[country] || 0) + count;
        });
      }
    });

    // Urutkan negara berdasarkan jumlah visitor (top 5)
    const topCountries = Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([countryCode, visits]) => ({
        code: countryCode,
        visits: visits,
        isUserCountry: countryCode === userCountry,
        ...countryDatabase[countryCode] || countryDatabase['Unknown']
      }));

    // Jika kurang dari 5 negara, tambahkan negara default
    const defaultCountries = ['ID', 'MY', 'SG', 'TH', 'PH'];
    while (topCountries.length < 5) {
      const defaultCountry = defaultCountries[topCountries.length];
      if (!topCountries.find(c => c.code === defaultCountry)) {
        topCountries.push({
          code: defaultCountry,
          visits: 0,
          isUserCountry: defaultCountry === userCountry,
          ...countryDatabase[defaultCountry]
        });
      }
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="450" height="340" viewBox="0 0 450 340">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="450" height="340" fill="url(#bg)" rx="10"/>
        
        <!-- Title -->
        <text x="225" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">
          Top 5 Countries by Visitors
        </text>
        
        <!-- User Location Info -->
        <text x="225" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="white" fill-opacity="0.9">
          Your location: ${userCity}, ${userCountry} (${clientIP})
        </text>
        
        ${topCountries.map((country, index) => {
          const y = 65 + (index * 50);
          const isUserCountry = country.isUserCountry;
          const visitText = country.visits > 0 ? `${country.visits.toLocaleString()} visits` : 'No visits yet';
          
          return `
            <!-- Country Card -->
            <rect x="20" y="${y}" width="410" height="40" fill="white" fill-opacity="${isUserCountry ? '1' : '0.9'}" rx="8" filter="url(#shadow)" stroke="${isUserCountry ? '#FFD700' : 'none'}" stroke-width="${isUserCountry ? '2' : '0'}"/>
            
            ${isUserCountry ? `<rect x="20" y="${y}" width="410" height="40" fill="#FFD700" fill-opacity="0.1" rx="8"/>` : ''}
            
            <!-- Rank -->
            <circle cx="45" cy="${y + 20}" r="12" fill="${country.color}" fill-opacity="0.8"/>
            <text x="45" y="${y + 25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">
              ${index + 1}
            </text>
            
            <!-- Flag Code -->
            <text x="75" y="${y + 25}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">${country.flag}</text>
            
            <!-- Country Name -->
            <text x="105" y="${y + 18}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">
              ${country.name} ${isUserCountry ? '(YOU)' : ''}
            </text>
            
            <!-- Details -->
            <text x="105" y="${y + 32}" font-family="Arial, sans-serif" font-size="10" fill="#666">
              ${country.capital} • ${country.region}
            </text>
            
            <!-- Visit Count -->
            <text x="400" y="${y + 18}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${country.visits > 0 ? '#2E7D32' : '#666'}">
              ${visitText}
            </text>
            
            <!-- Progress Bar -->
            ${country.visits > 0 ? `
              <rect x="300" y="${y + 25}" width="90" height="4" fill="#E0E0E0" rx="2"/>
              <rect x="300" y="${y + 25}" width="${Math.min(90, (country.visits / Math.max(...topCountries.map(c => c.visits))) * 90)}" height="4" fill="${country.color}" rx="2"/>
            ` : ''}
          `;
        }).join('')}
        
        <!-- Footer -->
        <text x="225" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" fill-opacity="0.8">
          Generated at ${new Date().toLocaleString('id-ID')} • Based on visitor data
        </text>
      </svg>
    `;

    res.set({
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    res.send(svg);

  } catch (error) {
    console.error('Error in /countries:', error);
    
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">
        <rect width="400" height="100" fill="#ff6b6b" rx="10"/>
        <text x="200" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">
          Service Unavailable
        </text>
        <text x="200" y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white">
          Please try again later
        </text>
      </svg>
    `;
    
    res.set({
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0"
    });
    res.send(fallbackSvg);
  }
});

// Endpoint untuk mendapatkan data negara dan statistik dalam format JSON
app.get("/api/countries", async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    
    // Dapatkan info geolocation dari IP
    const geo = geoip.lookup(clientIP);
    const userCountry = geo ? geo.country : "Unknown";
    
    // Ambil semua data counter untuk mendapatkan statistik negara
    const allCounters = await Counter.find({});
    
    // Gabungkan semua data countries dari semua counter
    const countryStats = {};
    let totalVisits = 0;
    
    allCounters.forEach(counter => {
      if (counter.countries) {
        counter.countries.forEach((count, country) => {
          countryStats[country] = (countryStats[country] || 0) + count;
          totalVisits += count;
        });
      }
    });

    // Urutkan negara berdasarkan jumlah visitor
    const sortedCountries = Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .map(([countryCode, visits]) => ({
        code: countryCode,
        visits: visits,
        percentage: totalVisits > 0 ? ((visits / totalVisits) * 100).toFixed(1) : 0,
        isUserCountry: countryCode === userCountry,
        ...countryDatabase[countryCode] || countryDatabase['Unknown']
      }));

    res.json({
      message: "Statistik negara berdasarkan visitor",
      userLocation: {
        ip: clientIP,
        country: geo?.country || 'Unknown',
        countryCode: geo?.country || 'Unknown',
        city: geo?.city || 'Unknown',
        region: geo?.region || 'Unknown',
        timezone: geo?.timezone || 'Unknown',
        coordinates: geo ? { lat: geo.ll[0], lon: geo.ll[1] } : null
      },
      statistics: {
        totalVisits: totalVisits,
        totalCountries: Object.keys(countryStats).length,
        topCountries: sortedCountries.slice(0, 10)
      },
      allCountries: sortedCountries,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /api/countries:', error);
    res.status(500).json({
      error: "Gagal mendapatkan data statistik negara",
      message: error.message
    });
  }
});

app.listen(8080, () => console.log("Server running on 8080"));
# Counter dengan Cooldown

## Route yang Tersedia

### 1. `/counter/:id` - Counter Biasa (Selalu Menambah)
- **URL**: `http://localhost:8080/counter/nama-counter-anda`
- **Fungsi**: Selalu menambah counter setiap kali diakses (tidak ada cooldown)
- **Format**: Badge SVG sederhana dengan angka counter

### 2. `/country-stats/:id` - Statistik Negara (Hanya Tampil)
- **URL**: `http://localhost:8080/country-stats/nama-counter-anda`
- **Fungsi**: Hanya menampilkan statistik tanpa menambah counter
- **Format**: Badge dengan breakdown negara top 5

### 3. `/count/:id` - Counter dengan Cooldown (3 jam)
- **URL**: `http://localhost:8080/count/nama-counter-anda`
- **Cooldown**: 3 jam per IP
- **Fungsi**: Menambah counter dan menampilkan pesan "You've been count thanks!"

### 4. `/count/:id/:hours` - Counter dengan Cooldown Kustom
- **URL**: `http://localhost:8080/count/nama-counter-anda/6`
- **Cooldown**: Sesuai parameter (0-24 jam)
- **Fungsi**: Menambah counter dengan cooldown yang bisa disesuaikan

### 5. `/count-stats/:id` - Statistik Negara dengan Cooldown (BARU!)
- **URL**: `http://localhost:8080/count-stats/nama-counter-anda`
- **Cooldown**: 3 jam per IP
- **Fungsi**: Menampilkan statistik negara + menambah counter dengan cooldown
- **Format**: Badge dengan breakdown negara + indikator "(+1 NEW!)" jika berhasil count

## Fitur

✅ **Cooldown System**: Mencegah spam counting dari IP yang sama  
✅ **Pesan Sukses**: Menampilkan "You've been count thanks!" setelah berhasil count  
✅ **Pesan Cooldown**: Memberitahu berapa lama lagi harus menunggu  
✅ **Geo Detection**: Menampilkan negara asal pengunjung  
✅ **Auto Expire**: Data cooldown otomatis terhapus setelah expired  

## Contoh Penggunaan

```html
<!-- Gambar counter biasa (selalu bertambah) -->
<img src="http://localhost:8080/counter/my-project" alt="Counter">

<!-- Gambar statistik negara (hanya tampil, tidak menambah counter) -->
<img src="http://localhost:8080/country-stats/my-project" alt="Country Stats">

<!-- Gambar counter dengan cooldown 3 jam -->
<img src="http://localhost:8080/count/my-project" alt="Counter with Cooldown">

<!-- Gambar counter dengan cooldown 6 jam -->
<img src="http://localhost:8080/count/my-project/6" alt="Counter with Custom Cooldown">

<!-- Gambar statistik negara dengan cooldown (REKOMENDASI!) -->
<img src="http://localhost:8080/count-stats/my-project" alt="Country Stats with Cooldown">
```

## Rekomendasi Penggunaan

✅ **Untuk forum/website publik**: Gunakan `/count-stats/:id` - menampilkan statistik menarik + mencegah spam  
✅ **Untuk README GitHub**: Gunakan `/country-stats/:id` - hanya tampil, tidak menambah saat refresh  
✅ **Untuk testing**: Gunakan `/counter/:id` - selalu menambah untuk testing  

## Response

### Sukses Count
- Background hijau
- Pesan: "You've been count thanks! 🎉"
- Menampilkan total visitor dan negara asal
- Info kapan bisa count lagi

### Dalam Cooldown
- Background kuning
- Pesan: "Already Counted!"
- Menampilkan berapa jam lagi harus menunggu

## Database Schema

Menambahkan collection baru `CounterCooldown`:
```javascript
{
  counterId: String,    // ID counter
  ipAddress: String,    // IP address pengunjung
  lastCount: Date,      // Waktu terakhir count
  expiresAt: Date       // Waktu expired (auto delete)
}
```
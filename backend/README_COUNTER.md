# Counter dengan Cooldown

## Route Baru yang Ditambahkan

### 1. `/count/:id` - Counter dengan Cooldown Default (3 jam)
- **URL**: `http://localhost:8080/count/nama-counter-anda`
- **Cooldown**: 3 jam
- **Fungsi**: Menambah counter dan menampilkan pesan "You've been count thanks!"

### 2. `/count/:id/:hours` - Counter dengan Cooldown Kustom
- **URL**: `http://localhost:8080/count/nama-counter-anda/6`
- **Cooldown**: Sesuai parameter (0-24 jam)
- **Fungsi**: Menambah counter dengan cooldown yang bisa disesuaikan

## Fitur

✅ **Cooldown System**: Mencegah spam counting dari IP yang sama  
✅ **Pesan Sukses**: Menampilkan "You've been count thanks!" setelah berhasil count  
✅ **Pesan Cooldown**: Memberitahu berapa lama lagi harus menunggu  
✅ **Geo Detection**: Menampilkan negara asal pengunjung  
✅ **Auto Expire**: Data cooldown otomatis terhapus setelah expired  

## Contoh Penggunaan

```html
<!-- Gambar counter dengan cooldown 3 jam -->
<img src="http://localhost:8080/count/my-project" alt="Counter">

<!-- Gambar counter dengan cooldown 6 jam -->
<img src="http://localhost:8080/count/my-project/6" alt="Counter">

<!-- Gambar counter biasa (tanpa cooldown) -->
<img src="http://localhost:8080/counter/my-project" alt="Counter">
```

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
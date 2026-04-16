# 🔄 CleanTrack Backend - Migration Guide

## ✅ Perubahan Terbaru

### 1. **Database: SQLite → MySQL**
- ❌ **Sebelumnya**: Menggunakan SQLite dengan `better-sqlite3` (file `cleantrack.db`)
- ✅ **Sekarang**: Menggunakan MySQL dengan `mysql2` (RDS `uts-database`)

**File yang berubah:**
- `db.js` - Berubah dari synchronous SQLite ke asynchronous MySQL

### 2. **Upload: Local Storage → AWS S3**
- ❌ **Sebelumnya**: Menyimpan foto ke folder `uploads/` lokal
- ✅ **Sekarang**: Menyimpan foto ke AWS S3 bucket `s3uts`

**File yang berubah:**
- `routes/upload.js` - Sekarang menggunakan fungsi `uploadToS3()` dari `s3.js`

### 3. **Async/Await Updates**
Semua database queries diubah menjadi asynchronous:
- Semua `get()`, `all()`, `run()` calls sekarang menggunakan `await`
- Semua routes sudah di-update

**File yang berubah:**
- `routes/users.js`
- `routes/reports.js`
- `routes/schedules.js`
- `server.js`

### 4. **Package.json Update**
- ❌ Dihapus: `better-sqlite3`
- ✅ Sudah ada: `mysql2` (sudah di-install)
- ✅ Sudah ada: `@aws-sdk/client-s3` (untuk S3)

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
cd cleantrack-backend
npm install
```

### Step 2: Pastikan Database MySQL Sudah Siap
```bash
# Verifikasi koneksi ke database uts-database
mysql -h localhost -u admin -p uts-database

# Lihat tables
SHOW TABLES;
```

### Step 3: Verifikasi Environment Variables
File `.env` sudah memiliki konfigurasi yang benar (jangan commit `.env`!):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YOUR_DB_PASSWORD

DB_NAME=uts-database

AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
S3_BUCKET_NAME=s3uts

PORT=3000
FRONTEND_URL=http://localhost:5173
```

⚠️ **PENTING**: Jangan pernah commit `.env` file ke GitHub! Gunakan `.env.example` sebagai template.

### Step 4: Mulai Server
```bash
npm run start    # Production
npm run dev      # Development (dengan nodemon)
```

---

## 📊 Database Helper Methods

### `get(sql, params)` - Get Single Row
```javascript
const user = await get('SELECT * FROM users WHERE id = ?', [1]);
// Returns: { id: 1, name: '...', ... } atau null
```

### `all(sql, params)` - Get Multiple Rows
```javascript
const reports = await all('SELECT * FROM reports WHERE status = ?', ['pending']);
// Returns: [{ id: 1, ... }, { id: 2, ... }]
```

### `run(sql, params)` - Insert/Update/Delete
```javascript
const result = await run('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com']);
// Returns: { insertId: 1, affectedRows: 1, ... }
```

---

## 🔒 AWS S3 Configuration

### Upload Photo Flow:
1. Client mengirim foto melalui `POST /api/upload/photo`
2. Multer menyimpan file temporary di folder `uploads/`
3. `uploadToS3()` di `s3.js` mengupload ke AWS S3
4. File lokal dihapus (cleanup)
5. Return S3 URL ke client

### S3 URL Format:
```
https://s3uts.s3.ap-southeast-1.amazonaws.com/reports/1713270000000-foto.jpg
```

---

## ✨ New Features

✅ Data sekarang disimpan di MySQL RDS (uts-database)  
✅ Foto sekarang disimpan di AWS S3  
✅ Semua queries async/await  
✅ Better error handling  
✅ Production-ready  

---

## 🧪 Testing Endpoints

### Register User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "warga"
  }'
```

### Create Report
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "title": "Sampah di Taman",
    "description": "Tumpukan sampah di taman kota",
    "location_address": "Jl. Merdeka No. 1",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "photo_url": "https://s3uts.s3.ap-southeast-1.amazonaws.com/..."
  }'
```

### Upload Photo
```bash
curl -X POST http://localhost:3000/api/upload/photo \
  -F "photo=@/path/to/photo.jpg"
```

---

## 📝 Troubleshooting

### Error: "Cannot find module 'mysql2'"
```bash
npm install mysql2
```

### Error: "Connection refused"
- Pastikan MySQL server running
- Verifikasi credentials di `.env`
- Cek database `uts-database` sudah ada

### Error: "Access Denied for user 'admin'"
- Verifikasi password di `.env` sudah benar
- Run: `mysql -h localhost -u admin -p uts-database`

### Error: "Invalid AWS credentials"
- Verifikasi AWS_ACCESS_KEY_ID dan AWS_SECRET_ACCESS_KEY di `.env`
- Pastikan S3 bucket `s3uts` dapat diakses

---

## 📚 Key Files Modified

| File | Changes |
|------|---------|
| `db.js` | SQLite → MySQL, sync → async |
| `routes/users.js` | Added await to all db calls |
| `routes/reports.js` | Added await to all db calls |
| `routes/schedules.js` | Added await to all db calls |
| `routes/upload.js` | Local storage → S3 upload |
| `server.js` | Added async initialization |
| `package.json` | Removed better-sqlite3 |

---

**Last Updated: April 16, 2026**

# CleanTrack Backend

Backend API untuk aplikasi CleanTrack (Pelaporan Sampah Liar) yang dibangun dengan Node.js, Express, dan MySQL.

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- MySQL 5.7+
- npm atau yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file sesuai konfigurasi lokal Anda**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=cleantrack
   
   AWS_REGION=ap-southeast-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   S3_BUCKET_NAME=cleantrack-photos
   
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   ```

   > **Catatan:** Untuk development lokal tanpa AWS S3, Anda bisa melewati S3 configuration sementara (endpoint upload akan error, tapi database tetap berfungsi).

4. **Jalankan server**
   ```bash
   npm run dev
   ```

   Server akan berjalan di `http://localhost:3000`

## 📚 API Endpoints

### Users
- `POST /api/users/register` - Register user baru
- `POST /api/users/login` - Login user

### Reports
- `GET /api/reports` - Get semua laporan (query: ?status=pending)
- `GET /api/reports/:id` - Get detail laporan
- `POST /api/reports` - Buat laporan baru
- `PUT /api/reports/:id/status` - Update status laporan
- `DELETE /api/reports/:id` - Hapus laporan

### Upload
- `POST /api/upload/photo` - Upload foto ke S3

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('warga', 'petugas') DEFAULT 'warga',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Reports Table
```sql
CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL (FK → users.id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location_address VARCHAR(300),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url VARCHAR(500),
  status ENUM('pending', 'diproses', 'selesai') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

## 📝 Example Requests

### Register User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
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
    "title": "Sampah di Jalan Merdeka",
    "description": "Banyak sampah plastic di jalan ini",
    "location_address": "Jalan Merdeka, Jakarta",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "photo_url": "https://..."
  }'
```

### Update Report Status
```bash
curl -X PUT http://localhost:3000/api/reports/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "diproses"
  }'
```

## 🛠️ Tech Stack
- **Framework:** Express.js
- **Database:** MySQL
- **File Storage:** AWS S3
- **File Upload:** Multer
- **Environment:** dotenv
- **CORS:** cors
- **Development:** nodemon

## 🔧 Troubleshooting

### MySQL Connection Error
- Pastikan MySQL server sudah running
- Check credentials di `.env`
- Pastikan database name sudah benar

### S3 Upload Error
- Verify AWS credentials
- Check S3 bucket name
- Ensure bucket region matches

### CORS Error
- Pastikan `FRONTEND_URL` di .env sesuai dengan URL frontend Anda

## 📄 License
MIT

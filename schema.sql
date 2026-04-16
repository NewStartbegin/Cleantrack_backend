-- ============================================================================
-- CLEANTRACK DATABASE SCHEMA
-- MySQL Database
-- ============================================================================

-- Create Database (if not exists)
-- CREATE DATABASE IF NOT EXISTS `uts-database`;
-- USE `uts-database`;

-- ============================================================================
-- TABLE: USERS
-- Description: Menyimpan informasi pengguna (warga dan petugas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'warga' CHECK(role IN ('warga', 'petugas')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster email lookup
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- TABLE: REPORTS
-- Description: Menyimpan laporan penemuan sampah liar dari warga
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  location_address VARCHAR(500),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'diproses', 'selesai')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for faster queries
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- ============================================================================
-- TABLE: SCHEDULES
-- Description: Menyimpan jadwal pembersihan untuk setiap laporan sampah
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'selesai')),
  notes LONGTEXT,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for faster queries
CREATE INDEX idx_schedules_report_id ON schedules(report_id);
CREATE INDEX idx_schedules_created_by ON schedules(created_by);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);

-- ============================================================================
-- SAMPLE DATA (Optional - untuk testing)
-- ============================================================================

-- Insert sample users
INSERT INTO users (name, email, password, role) VALUES
('Warga Contoh', 'warga@example.com', 'hashed_password_here', 'warga'),
('Petugas Kebersihan', 'petugas@example.com', 'hashed_password_here', 'petugas');

-- Insert sample report
INSERT INTO reports (user_id, title, description, location_address, latitude, longitude, status) VALUES
(1, 'Tumpukan Sampah di Taman', 'Sampah menumpuk di taman kota', 'Jl. Merdeka No. 1', -6.2088, 106.8456, 'pending');

-- Insert sample schedule
INSERT INTO schedules (report_id, scheduled_date, scheduled_time, created_by, notes) VALUES
(1, '2024-01-20', '08:00', 2, 'Pembersihan rutin taman');

-- ============================================================================
-- VIEW: REPORTS_WITH_USERS (Optional - untuk convenience)
-- ============================================================================
CREATE VIEW reports_with_users AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.location_address,
  r.latitude,
  r.longitude,
  r.photo_url,
  r.status,
  r.created_at,
  r.updated_at,
  u.id as user_id,
  u.name as reported_by,
  u.email as reporter_email
FROM reports r
LEFT JOIN users u ON r.user_id = u.id;

-- ============================================================================
-- VIEW: SCHEDULES_WITH_DETAILS (Optional - untuk convenience)
-- ============================================================================
CREATE VIEW schedules_with_details AS
SELECT 
  s.id,
  s.scheduled_date,
  s.scheduled_time,
  s.status,
  s.notes,
  s.created_at,
  s.updated_at,
  r.title as report_title,
  r.location_address,
  r.latitude,
  r.longitude,
  u.name as reporter_name,
  p.name as petugas_name
FROM schedules s
LEFT JOIN reports r ON s.report_id = r.id
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN users p ON s.created_by = p.id;

-- Taste Modelling Creators Database Schema
-- Run this file to set up your MySQL database

CREATE DATABASE IF NOT EXISTS taste_modelling
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taste_modelling;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  speciality ENUM('Food','Fashion','Music','Art','Lifestyle','Travel','Beauty') NOT NULL DEFAULT 'Lifestyle',
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category ENUM('Food','Fashion','Music','Art','Lifestyle','Travel','Beauty') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id)
);

-- Sample seed data (optional)
INSERT IGNORE INTO users (name, email, password, speciality, bio) VALUES
('Alex Rivera', 'alex@example.com', '$2b$10$examplehashhere', 'Food', 'Food critic and culinary taste modeller from Barcelona.'),
('Mia Chen', 'mia@example.com', '$2b$10$examplehashhere', 'Fashion', 'Fashion forecaster and style curator based in Tokyo.'),
('Jordan Park', 'jordan@example.com', '$2b$10$examplehashhere', 'Music', 'Music tastemaker and playlist architect from Seoul.');

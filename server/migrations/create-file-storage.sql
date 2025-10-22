-- Create file_storage table for storing uploaded images
CREATE TABLE IF NOT EXISTS file_storage (
  file_key VARCHAR(255) PRIMARY KEY,
  file_data LONGTEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
);


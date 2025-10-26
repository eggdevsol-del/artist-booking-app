-- Add password column to users table for email/password authentication
ALTER TABLE users ADD COLUMN password VARCHAR(255) AFTER email;


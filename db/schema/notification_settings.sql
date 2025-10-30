-- Notification Settings Schema
-- This table stores all notification preferences for artists

CREATE TABLE IF NOT EXISTS notification_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  
  -- Follow-up Notification Settings
  followup_enabled BOOLEAN DEFAULT FALSE,
  followup_sms BOOLEAN DEFAULT FALSE,
  followup_email BOOLEAN DEFAULT FALSE,
  followup_push BOOLEAN DEFAULT FALSE,
  followup_text TEXT,
  followup_trigger_type ENUM('after_sitting', 'days', 'weeks', 'months') DEFAULT 'days',
  followup_trigger_value INT DEFAULT 1,
  
  -- Aftercare Notification Settings
  aftercare_enabled BOOLEAN DEFAULT FALSE,
  aftercare_sms BOOLEAN DEFAULT FALSE,
  aftercare_email BOOLEAN DEFAULT FALSE,
  aftercare_push BOOLEAN DEFAULT FALSE,
  aftercare_daily_message TEXT,
  aftercare_post_message TEXT,
  aftercare_frequency ENUM('daily', 'every_other_day', 'twice_weekly', 'weekly') DEFAULT 'daily',
  aftercare_duration_days INT DEFAULT 14,
  aftercare_time TIME DEFAULT '09:00:00',
  
  -- Review Notification Settings
  review_enabled BOOLEAN DEFAULT FALSE,
  review_sms BOOLEAN DEFAULT FALSE,
  review_email BOOLEAN DEFAULT FALSE,
  review_push BOOLEAN DEFAULT FALSE,
  review_text TEXT,
  review_google_link VARCHAR(500),
  review_facebook_link VARCHAR(500),
  review_custom_link VARCHAR(500),
  review_trigger_type ENUM('after_sitting', 'days', 'weeks', 'months') DEFAULT 'days',
  review_trigger_value INT DEFAULT 7,
  
  -- Pre-booking Notification Settings
  prebooking_enabled BOOLEAN DEFAULT FALSE,
  prebooking_sms BOOLEAN DEFAULT FALSE,
  prebooking_email BOOLEAN DEFAULT FALSE,
  prebooking_push BOOLEAN DEFAULT FALSE,
  prebooking_text TEXT,
  prebooking_include_details BOOLEAN DEFAULT TRUE,
  prebooking_include_time BOOLEAN DEFAULT TRUE,
  prebooking_include_maps BOOLEAN DEFAULT TRUE,
  prebooking_trigger_type ENUM('hours', 'days') DEFAULT 'hours',
  prebooking_trigger_value INT DEFAULT 24,
  
  -- Location for maps
  business_location VARCHAR(500),
  business_address TEXT,
  business_lat DECIMAL(10, 8),
  business_lng DECIMAL(11, 8),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_settings (user_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_notifications ON notification_settings(user_id);


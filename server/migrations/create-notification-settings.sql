-- Create notification settings table
CREATE TABLE IF NOT EXISTS notificationSettings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) NOT NULL UNIQUE,
  
  -- Follow-up Notification Settings
  followupEnabled BOOLEAN DEFAULT FALSE,
  followupSms BOOLEAN DEFAULT FALSE,
  followupEmail BOOLEAN DEFAULT FALSE,
  followupPush BOOLEAN DEFAULT FALSE,
  followupText TEXT,
  followupTriggerType VARCHAR(50) DEFAULT 'days',
  followupTriggerValue INT DEFAULT 1,
  
  -- Aftercare Notification Settings
  aftercareEnabled BOOLEAN DEFAULT FALSE,
  aftercareSms BOOLEAN DEFAULT FALSE,
  aftercareEmail BOOLEAN DEFAULT FALSE,
  aftercarePush BOOLEAN DEFAULT FALSE,
  aftercareDailyMessage TEXT,
  aftercarePostMessage TEXT,
  aftercareFrequency VARCHAR(50) DEFAULT 'daily',
  aftercareDurationDays INT DEFAULT 14,
  aftercareTime VARCHAR(10) DEFAULT '09:00',
  
  -- Review Notification Settings
  reviewEnabled BOOLEAN DEFAULT FALSE,
  reviewSms BOOLEAN DEFAULT FALSE,
  reviewEmail BOOLEAN DEFAULT FALSE,
  reviewPush BOOLEAN DEFAULT FALSE,
  reviewText TEXT,
  reviewGoogleLink VARCHAR(500),
  reviewFacebookLink VARCHAR(500),
  reviewCustomLink VARCHAR(500),
  reviewTriggerType VARCHAR(50) DEFAULT 'days',
  reviewTriggerValue INT DEFAULT 3,
  
  -- Pre-booking Notification Settings
  prebookingEnabled BOOLEAN DEFAULT FALSE,
  prebookingSms BOOLEAN DEFAULT FALSE,
  prebookingEmail BOOLEAN DEFAULT FALSE,
  prebookingPush BOOLEAN DEFAULT FALSE,
  prebookingText TEXT,
  prebookingIncludeDetails BOOLEAN DEFAULT TRUE,
  prebookingIncludeTime BOOLEAN DEFAULT TRUE,
  prebookingIncludeMaps BOOLEAN DEFAULT FALSE,
  prebookingTriggerType VARCHAR(50) DEFAULT 'hours',
  prebookingTriggerValue INT DEFAULT 24,
  
  -- Business Location for Maps
  businessLocation VARCHAR(500),
  businessAddress TEXT,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);


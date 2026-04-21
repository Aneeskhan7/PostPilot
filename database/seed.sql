-- PostPilot Seed Data
-- Run after schema.sql to set up the admin account
-- Replace the email below with your admin email

UPDATE profiles SET is_admin = true WHERE email = 'aneeskhan16202@gmail.com';

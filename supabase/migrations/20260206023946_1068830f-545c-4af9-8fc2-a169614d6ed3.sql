-- Add admin location settings
INSERT INTO app_settings (key, value, description) 
VALUES 
  ('admin_lat', '45.457774', 'Latitudine corrente admin'),
  ('admin_lon', '9.199024', 'Longitudine corrente admin'),
  ('admin_location_updated_at', '', 'Timestamp ultimo aggiornamento posizione admin')
ON CONFLICT (key) DO NOTHING;
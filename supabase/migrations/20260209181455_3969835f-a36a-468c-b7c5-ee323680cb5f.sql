
INSERT INTO public.app_settings (key, value, description) VALUES
  ('discount_under_3km', '0.80', 'Fattore sconto per corse sotto 3km (es. 0.80 = -20%)'),
  ('discount_3to5km', '0.92', 'Fattore sconto per corse tra 3 e 5km (es. 0.92 = -8%)'),
  ('discount_over_5km', '0.85', 'Fattore sconto per corse oltre 5km (es. 0.85 = -15%)'),
  ('distance_threshold_low', '3', 'Soglia bassa distanza in km'),
  ('distance_threshold_high', '5', 'Soglia alta distanza in km'),
  ('night_start_hour', '22', 'Ora inizio fascia notturna (0-23)'),
  ('night_end_hour', '6', 'Ora fine fascia notturna (0-23)'),
  ('night_surcharge_multiplier', '1.30', 'Moltiplicatore supplemento notturno (es. 1.30 = +30%)'),
  ('vwtroc_eta_extra', '4', 'Minuti extra ETA per VW T-Roc')
ON CONFLICT (key) DO NOTHING;

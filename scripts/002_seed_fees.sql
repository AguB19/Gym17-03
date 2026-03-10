-- Seed default fee types

INSERT INTO fees (name, type, amount, duration_days, description, is_active)
VALUES 
  ('Cuota Mensual', 'mensual', 5000.00, 30, 'Acceso completo al gimnasio por 30 días', true),
  ('Cuota Trimestral', 'trimestral', 12000.00, 90, 'Acceso completo al gimnasio por 90 días con descuento', true),
  ('Pase Diario', 'pase_diario', 500.00, 1, 'Acceso por un día al gimnasio', true)
ON CONFLICT DO NOTHING;

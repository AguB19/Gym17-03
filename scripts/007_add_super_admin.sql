-- Agregar un super admin
-- Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real de Supabase Auth

-- Primero obtenemos el user_id del usuario autenticado por su email
INSERT INTO super_admins (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'TU_EMAIL@ejemplo.com'
ON CONFLICT (user_id) DO NOTHING;

USE PlanificadorMantenimiento;
UPDATE usuarios SET password_hash = '$2a$12$6sufrJ3dgek0WqAWa3MDt.cmmnECVORLQ7JqVjcYgRecuEpQhAZOi' WHERE email='admin@empresa.com';
SELECT DATALENGTH(password_hash) AS bytes, LEN(password_hash) AS chars, password_hash FROM usuarios WHERE email='admin@empresa.com';

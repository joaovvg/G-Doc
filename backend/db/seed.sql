-- Contador Global
INSERT INTO counters (id, value)
VALUES ('00000000-0000-0000-0000-000000000000', 1)
ON CONFLICT (id) DO NOTHING;

-- Usuário Master (sem unidade fixa — a unidade deve ser criada pelo administrador)
INSERT INTO users (id, cpf, name, password)
VALUES ('80808080-8080-8080-8080-808080808080', '000.000.000-00', 'ADMINISTRADOR MESTRE', '1234')
ON CONFLICT (id) DO NOTHING;

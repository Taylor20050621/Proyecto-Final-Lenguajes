INSERT INTO users (username, email, password_hash, role)
VALUES
    ('demo_creator', 'creator@example.com',
     '$2a$10$7EqJtq98hPqEX7fNZaFWoO5Y7V1cRzT0G8S8Y1V6F5Q7FhQ7Y7L6e', 'CREATOR'),
    ('demo_tester', 'tester@example.com',
     '$2a$10$7EqJtq98hPqEX7fNZaFWoO5Y7V1cRzT0G8S8Y1V6F5Q7FhQ7Y7L6e', 'TESTER')
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;

INSERT INTO games (creator_id, title, description, genre, platform, file_path_or_url)
SELECT id, 'Astro Garden', 'Juego de prueba para validar el flujo de playtesting.',
       'Puzzle', 'WEBGL', 'https://localhost:3000/games/astro-garden'
FROM users
WHERE username = 'demo_creator'
  AND NOT EXISTS (
      SELECT 1 FROM games WHERE title = 'Astro Garden'
  );

INSERT INTO forms (game_id, title, description, is_active)
SELECT id, 'Evaluación inicial', 'Formulario básico de experiencia de juego.', TRUE
FROM games
WHERE title = 'Astro Garden'
  AND NOT EXISTS (
      SELECT 1 FROM forms WHERE title = 'Evaluación inicial'
  );

INSERT INTO questions (form_id, question_text, question_type, is_required)
SELECT id, '¿Qué tan divertido fue el juego?', 'LIKERT_1_5', TRUE
FROM forms
WHERE title = 'Evaluación inicial'
  AND NOT EXISTS (
      SELECT 1 FROM questions
      WHERE form_id = forms.id
        AND question_text = '¿Qué tan divertido fue el juego?'
  );

INSERT INTO questions (form_id, question_text, question_type, is_required)
SELECT id, '¿Qué mejorarías?', 'TEXT', FALSE
FROM forms
WHERE title = 'Evaluación inicial'
  AND NOT EXISTS (
      SELECT 1 FROM questions
      WHERE form_id = forms.id
        AND question_text = '¿Qué mejorarías?'
  );

INSERT INTO questions (form_id, question_text, question_type, is_required)
SELECT id, '¿Cuántos minutos jugaste?', 'NUMERIC', TRUE
FROM forms
WHERE title = 'Evaluación inicial'
  AND NOT EXISTS (
      SELECT 1 FROM questions
      WHERE form_id = forms.id
        AND question_text = '¿Cuántos minutos jugaste?'
  );

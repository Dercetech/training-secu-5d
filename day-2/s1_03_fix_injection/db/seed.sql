-- Fictional, local-only data for the classroom exercise.
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_notes (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);

DELETE FROM teachers;
DELETE FROM staff_notes;

INSERT INTO teachers (id, name, subject) VALUES
  (1, 'Alice Martin', 'Développement web'),
  (2, 'Samir Benali', 'Bases de données'),
  (3, 'Léa Dubois', 'Réseaux'),
  (4, 'Noah Bernard', 'Algorithmique'),
  (5, 'Chloé Lambert', 'Systèmes'),
  (6, 'Maëlle O''Neil', 'Sécurité applicative');

INSERT INTO staff_notes (id, title, body) VALUES
  (101, 'Réunion pédagogique', 'Document fictif réservé à l’équipe.'),
  (102, 'Clé de démonstration', 'Valeur locale de cours : ORANGE-17.'),
  (103, 'Brouillon interne', 'Exemple scolaire sans donnée réelle.');

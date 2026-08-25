-- Fictional, local-only data for the classroom exercise.
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author TEXT NOT NULL,
  is_public INTEGER NOT NULL CHECK (is_public IN (0, 1))
);

INSERT OR IGNORE INTO notes (id, title, body, author, is_public) VALUES
  (1, 'Bienvenue', 'Première note visible de la base locale.', 'Alice', 1),
  (2, 'SQLite', 'Une base entière tient dans un fichier.', 'Samir', 1),
  (3, 'Révision SQL', 'SELECT choisit les lignes à afficher.', 'Léa', 1),
  (4, 'Brouillon confidentiel', 'Résultat fictif réservé à l’équipe pédagogique.', 'Direction', 0),
  (5, 'Note privée', 'Information locale de démonstration : code BLEU-42.', 'Noah', 0);

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL
);

INSERT INTO users (id, email, display_name, role) VALUES
  (1, 'alice@ecole.test', 'Alice Martin', 'student'),
  (2, 'samir@ecole.test', 'Samir Benali', 'student'),
  (3, 'lea@ecole.test', 'Léa Dubois', 'student'),
  (4, 'direction@ecole.test', 'Direction Démo', 'teacher'),
  (5, 'support@ecole.test', 'Support Démo', 'support');

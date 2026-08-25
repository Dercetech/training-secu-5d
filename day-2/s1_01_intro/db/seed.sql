CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author TEXT NOT NULL,
  is_public INTEGER NOT NULL CHECK (is_public IN (0, 1))
);

INSERT OR IGNORE INTO notes (id, title, body, author, is_public) VALUES
  (1, 'Bienvenue', 'Première note de la base locale.', 'Alice', 1),
  (2, 'Courses', 'Pain, pommes et chocolat.', 'Samir', 1),
  (3, 'Brouillon', 'Cette note est encore privée.', 'Léa', 0),
  (4, 'SQLite', 'Une base entière tient dans un fichier.', 'Alice', 1),
  (5, 'Révision', 'SELECT choisit les lignes à afficher.', 'Noah', 0);

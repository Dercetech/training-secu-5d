-- Fictional, local-only data for the Day 2 recap exercise.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_sha256 TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin'))
);

INSERT OR IGNORE INTO users (id, username, password_sha256, role) VALUES
  (1, 'student', '191f524b7067890673c861db8bf22ccea0feb0d30939ace2dac875eaa9cfc93b', 'user'),
  (2, 'guest', '9e873a2df3de3e8308e0518163d23203e45785055002f80258ab6c1a2a3f795b', 'user'),
  (3, 'admin', '4b0c3d12c701d8b9cfd0036daf48b4972d9016592d44317ba86c154f4a8f9a26', 'admin');

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  port INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'stopped'))
);

INSERT OR IGNORE INTO services (id, name, port, status) VALUES
  (1, 'Passerelle Moon Nginx', 443, 'running'),
  (2, 'API des archives', 8443, 'running'),
  (3, 'Base de rapports', 5432, 'running'),
  (4, 'Worker de sauvegarde', 9100, 'running'),
  (5, 'Console de maintenance', 2222, 'running');

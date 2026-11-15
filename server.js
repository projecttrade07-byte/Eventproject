const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'db', 'events.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Unable to connect to SQLite database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at', dbPath);
});

const initializeDatabase = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Unable to initialize database:', err.message);
      process.exit(1);
    }
    console.log('Database schema ready.');
  });
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/events/new');
});

app.get('/events/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create-event.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view-events.html'));
});

app.get('/api/events', (req, res) => {
  db.all(
    'SELECT id, title, date, time, details, created_at FROM events ORDER BY date ASC, time ASC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching events:', err.message);
        return res.status(500).json({ error: 'Unable to fetch events.' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/events', (req, res) => {
  const { title, date, time, details } = req.body;

  if (!title || !date || !time || !details) {
    return res.status(400).json({ error: 'Title, date, time, and details are required.' });
  }

  db.run(
    'INSERT INTO events (title, date, time, details) VALUES (?, ?, ?, ?)',
    [title.trim(), date, time, details.trim()],
    function (err) {
      if (err) {
        console.error('Error inserting event:', err.message);
        return res.status(500).json({ error: 'Unable to save the event.' });
      }

      res.status(201).json({
        id: this.lastID,
        title: title.trim(),
        date,
        time,
        details: details.trim(),
      });
    }
  );
});

initializeDatabase();

app.listen(PORT, () => {
  console.log(`Event app listening on http://localhost:${PORT}`);
});

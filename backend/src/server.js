'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const csvRoutes = require('./routes/csvRoutes');
const errorHandler = require('./middleware/errorHandler');
const { DEFAULTS } = require('./config/constants');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/csv', csvRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use(errorHandler);

const PORT = process.env.PORT || DEFAULTS.PORT;
app.listen(PORT, () => {
  console.log(`GrowEasy CSV importer backend listening on port ${PORT}`);
});

module.exports = app;

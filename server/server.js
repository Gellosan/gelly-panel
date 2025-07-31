require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const connectDB = require('./db');
const Gelly = require('./Gelly');

// Connect to Mongo
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// WebSocket setup
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => console.log(`Gelly server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

// Leaderboard from Mongo
async function sendLeaderboard() {
  const top = await Gelly.find({})
    .sort({ points: -1, mood: -1, energy: -1, cleanliness: -1 })
    .limit(10)
    .lean();

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'leaderboard', entries: top }));
    }
  });
}

// Broadcast user state
function broadcastState(userId, state) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'update', user: userId, state }));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
});

module.exports = { sendLeaderboard, broadcastState, app };

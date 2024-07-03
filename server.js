// server.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

let rooms = [];

// Route to get list of rooms
app.get('/rooms', (req, res) => {
  res.json({ rooms: rooms });
});

// Endpoint to create a new room
app.post('/create-room', (req, res) => {
  const { name, host } = req.body;
  const roomId = generateRoomId(); // Implement function to generate unique room ID
  rooms.push({ id: roomId, name, host });
  res.json({ room: { id: roomId } });
});

// Endpoint to fetch all available rooms
app.get('/fetch-rooms', (req, res) => {
  res.json({ rooms });
});

// Endpoint to join a room
app.post('/join-room', (req, res) => {
  const { roomId, playerId } = req.body;
  const room = rooms.find(r => r.id === roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({ id: roomId, host: room.host });
});

// Endpoint to leave a room
app.post('/leave-room', (req, res) => {
  const { roomId, playerId } = req.body;
  rooms = rooms.filter(r => r.id !== roomId);
  res.json({ message: 'Left room successfully' });
});

// Endpoint to delete a room
app.post('/delete-room', (req, res) => {
  const { roomId, playerId } = req.body;
  rooms = rooms.filter(r => r.id !== roomId);
  res.json({ message: 'Deleted room successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function generateRoomId() {
  return Math.random().toString(36).substr(2, 9); // Generate random room ID
}

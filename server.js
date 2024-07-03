const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

let rooms = [];

app.use(cors());
app.use(bodyParser.json());

// Endpoint to create a room
app.post('/create-room', (req, res) => {
    const { name, host } = req.body;

    if (!name || !host) {
        return res.status(400).json({ error: 'Invalid room data' });
    }

    const newRoom = {
        id: generateRoomId(), // Function to generate unique room ID
        name: name,
        host: host,
    };

    rooms.push(newRoom);
    console.log('New room created:', newRoom);
    res.json({ room: newRoom });
});

// Endpoint to fetch all rooms
app.get('/rooms', (req, res) => {
    res.json({ rooms: rooms });
});

// Endpoint to join a room
app.post('/join-room', (req, res) => {
    const { roomId, playerId } = req.body;

    const room = rooms.find(r => r.id === roomId);

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    console.log(`Player ${playerId} joined room ${roomId}`);
    res.json(room);
});

// Endpoint to leave a room
app.post('/leave-room', (req, res) => {
    const { roomId, playerId } = req.body;

    const index = rooms.findIndex(r => r.id === roomId);

    if (index !== -1) {
        rooms.splice(index, 1);
        console.log(`Player ${playerId} left room ${roomId}`);
    }

    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Function to generate a unique room ID (replace with your own logic)
function generateRoomId() {
    return Math.random().toString(36).substring(2, 9);
}

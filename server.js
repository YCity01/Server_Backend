const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

// Create an Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

let rooms = [];

// WebSocket server handling client connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        console.log('Received: %s', message);
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'position':
                    broadcastPosition(data);
                    break;
                // Handle other message types as needed
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.send('Hello from server!');
});

// Function to broadcast player position to all clients
function broadcastPosition(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// REST API endpoints

app.post('/create-room', (req, res) => {
    const { name, host } = req.body;

    if (name && host) {
        const roomId = generateUniqueId();
        const newRoom = {
            id: roomId,
            name,
            host,
            players: []
        };

        rooms.push(newRoom);
        res.status(201).json({ message: 'Room created', room: newRoom });
    } else {
        res.status(400).json({ message: 'Invalid request data' });
    }
});

app.get('/rooms', (req, res) => {
    res.json({ rooms });
});

app.delete('/delete-room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const index = rooms.findIndex(room => room.id === roomId);

    if (index !== -1) {
        rooms.splice(index, 1);
        res.status(200).json({ message: 'Room deleted successfully' });
    } else {
        res.status(404).json({ message: 'Room not found' });
    }
});

app.post('/join-room', (req, res) => {
    const { roomId, playerId } = req.body;
    const room = rooms.find(room => room.id === roomId);

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    room.players.push(playerId);
    res.status(200).json(room);
});

app.post('/leave-room', (req, res) => {
    const { roomId, playerId } = req.body;
    const room = rooms.find(room => room.id === roomId);

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    if (room.host === playerId) {
        const index = rooms.findIndex(r => r.id === roomId);
        rooms.splice(index, 1);
        res.status(200).json({ message: 'Room deleted because host left' });
    } else {
        const playerIndex = room.players.findIndex(p => p === playerId);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            res.status(200).json({ message: 'Player left room' });
        } else {
            res.status(404).json({ message: 'Player not found in room' });
        }
    }
});

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

// Start the HTTP server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

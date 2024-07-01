const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let rooms = [];

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        console.log('Received: %s', message);
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'spawnPlayer':
                    handleSpawnPlayer(data, ws);
                    break;
                // Handle other message types as needed
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.send(JSON.stringify({ type: 'serverMessage', content: 'Hello from server!' }));
});

function handleSpawnPlayer(data, ws) {
    const { playerId, roomId } = data;
    const room = rooms.find((r) => r.id === roomId);

    if (!room) {
        console.error(`Room ${roomId} not found.`);
        return;
    }

    // Broadcast spawnPlayer message to all clients in the room
    const playerData = {
        type: 'spawnPlayer',
        playerId: playerId,
        roomId: roomId
        // Add more player data as needed
    };

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify(playerData));
        }
    });
}

app.post('/create-room', (req, res) => {
    const { name, host } = req.body;

    if (!name || !host) {
        return res.status(400).json({ message: 'Invalid request data' });
    }

    const roomId = generateUniqueId();
    const newRoom = {
        id: roomId,
        name,
        host,
        players: []
    };

    rooms.push(newRoom);
    res.status(201).json({ message: 'Room created', room: newRoom });
});

app.get('/rooms', (req, res) => {
    res.json({ rooms });
});

app.delete('/delete-room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const index = rooms.findIndex((room) => room.id === roomId);

    if (index === -1) {
        return res.status(404).json({ message: 'Room not found' });
    }

    rooms.splice(index, 1);
    res.status(200).json({ message: 'Room deleted successfully' });
});

app.post('/join-room', (req, res) => {
    const { roomId, playerId } = req.body;
    const room = rooms.find((room) => room.id === roomId);

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    room.players.push(playerId);

    // Broadcast spawnPlayer message to all clients in the room
    const playerData = {
        type: 'spawnPlayer',
        playerId: playerId,
        roomId: roomId
        // Additional player data as needed
    };

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify(playerData));
        }
    });

    res.status(200).json(room);
});

app.post('/leave-room', (req, res) => {
    const { roomId, playerId } = req.body;
    const room = rooms.find((room) => room.id === roomId);

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    if (room.host === playerId) {
        const index = rooms.findIndex((r) => r.id === roomId);
        rooms.splice(index, 1);
        res.status(200).json({ message: 'Room deleted because host left' });
    } else {
        const playerIndex = room.players.findIndex((p) => p === playerId);
        if (playerIndex === -1) {
            return res.status(404).json({ message: 'Player not found in room' });
        }
        room.players.splice(playerIndex, 1);
        res.status(200).json({ message: 'Player left room' });
    }
});

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

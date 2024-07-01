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

    // Store custom data such as roomId and playerId in the WebSocket connection
    ws.customData = {};

    ws.on('message', (message) => {
        console.log('Received: %s', message);
        try {
            const data = JSON.parse(message);
            // Store roomId and playerId when a player joins a room
            if (data.type === 'joinRoom') {
                ws.customData.playerId = data.playerId;
                ws.customData.roomId = data.roomId;
            }
            switch (data.type) {
                case 'position':
                    broadcastPosition(data);
                    break;
                case 'spawnPlayer':
                    handleSpawnPlayer(data, ws);
                    break;
                // Add other message types handling as needed
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.send(JSON.stringify({ type: 'serverMessage', content: 'Hello from server!' }));
});

// Function to broadcast player position to all clients
function broadcastPosition(data) {
    const room = rooms.find(room => room.id === data.roomId);
    if (room) {
        room.players.forEach(playerId => {
            wss.clients.forEach((client) => {
                if (client.customData && client.customData.playerId === playerId && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        });
    }
}

// Function to handle spawning a new player
function handleSpawnPlayer(data, ws) {
    const playerId = data.playerId;
    const roomId = data.roomId;

    const room = rooms.find(room => room.id === roomId);
    if (!room) {
        console.error(`Room with id ${roomId} not found`);
        return;
    }

    const playerData = {
        type: 'spawnPlayer',
        playerId: playerId,
        roomId: roomId
    };

    room.players.forEach(playerId => {
        wss.clients.forEach((client) => {
            if (client.customData && client.customData.playerId === playerId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(playerData));
            }
        });
    });
}

// REST API endpoints
// ... (Keep the REST API endpoints as they are)

// Start the HTTP server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

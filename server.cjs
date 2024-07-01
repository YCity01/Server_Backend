const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port });
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Array to store rooms (temporary storage)
let rooms = [];

// WebSocket server handling client connections
wss.on('connection', function connection(ws) {
    console.log('New client connected');

    ws.on('message', function incoming(message) {
        console.log('Received: %s', message);
        // Handle incoming messages here (e.g., player movements)
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'position':
                    // Broadcast player position to all other clients
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

// Endpoint to create a new room
app.post('/create-room', (req, res) => {
    const { name, host } = req.body;

    if (name && host) {
        // Generate a unique roomId (you can implement your own logic)
        const roomId = generateUniqueId();
        
        // Create the room object
        const newRoom = {
            id: roomId,
            name: name,
            host: host,
            players: [] // Initialize players array with host
        };

        // Add the room to the array (in-memory storage)
        rooms.push(newRoom);

        // Respond with success message and room data
        res.status(201).json({ message: 'Room created', room: newRoom });
    } else {
        // Respond with bad request if required data is missing
        res.status(400).json({ message: 'Invalid request data' });
    }
});

// Endpoint to fetch all rooms
app.get('/rooms', (req, res) => {
    res.json({ rooms: rooms });
});

// Endpoint to delete a room by roomId
app.delete('/delete-room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    
    // Find the index of the room with roomId in the rooms array
    const index = rooms.findIndex(room => room.id === roomId);
    
    if (index !== -1) {
        // If roomId exists, remove the room from the array
        rooms.splice(index, 1);
        res.status(200).json({ message: 'Room deleted successfully' });
    } else {
        // If roomId doesn't exist, respond with not found error
        res.status(404).json({ message: 'Room not found' });
    }
});

// Endpoint to join a room
app.post('/join-room', (req, res) => {
    const { roomId, playerId } = req.body;

    // Check if the room exists in your rooms array or database
    const room = rooms.find(room => room.id === roomId);

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    // Add player to the room
    room.players.push(playerId);

    // Optionally, update any other room state (like player count, etc.)

    res.status(200).json(room); // Respond with updated room data
});

// Endpoint to leave a room
app.post('/leave-room', (req, res) => {
    const { roomId, playerId } = req.body;

    // Check if the room exists in your rooms array or database
    const room = rooms.find(room => room.id === roomId);

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    // Check if the player is the host
    if (room.host === playerId) {
        // If the player is the host, delete the entire room
        const index = rooms.findIndex(r => r.id === roomId);
        rooms.splice(index, 1);
        res.status(200).json({ message: 'Room deleted because host left' });
    } else {
        // If the player is not the host, just remove the player from the room
        const playerIndex = room.players.findIndex(p => p === playerId);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            res.status(200).json({ message: 'Player left room' });
        } else {
            res.status(404).json({ message: 'Player not found in room' });
        }
    }
});

// Function to generate a unique room ID (example function, can be replaced with your logic)
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9); // Example: Generate a 9-character alphanumeric ID
}

// Function to broadcast player position to all clients
function broadcastPosition(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Server listening on specified port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

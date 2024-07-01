const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let rooms = [];

app.use(express.json());

app.get('/rooms', (req, res) => {
    res.json(rooms);
});

app.post('/rooms', (req, res) => {
    const { roomName } = req.body;
    rooms.push(roomName);
    res.status(201).send();
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

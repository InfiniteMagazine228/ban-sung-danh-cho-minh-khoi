const express = require('express');
const app = express();
const server = require('http').createServer(app);

// Cấu hình Socket.IO tương thích với hạ tầng Serverless của Vercel
const io = require('socket.io')(server, {
    path: '/socket.io/',
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let players = {};

io.on('connection', (socket) => {
    console.log(`Người chơi mới kết nối: ${socket.id}`);
    
    players[socket.id] = {
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        rotation: 0,
        id: socket.id
    };
    
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].rotation = movementData.rotation;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('playerFired', (bulletData) => {
        socket.broadcast.emit('bulletSpawned', bulletData);
    });

    socket.on('disconnect', () => {
        console.log(`Người chơi thoát: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Xuất bản máy chủ theo quy chuẩn xử lý API của Vercel
module.exports = server;

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Chỉ định thư mục public chứa file index.html của client
app.use(express.static(__dirname + '/public'));

let players = {}; // Lưu trữ danh sách toàn bộ người chơi

io.on('connection', (socket) => {
    console.log(`Người chơi mới kết nối: ${socket.id}`);
    
    // Khởi tạo người chơi mới với vị trí ngẫu nhiên và góc xoay bằng 0
    players[socket.id] = {
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        rotation: 0,
        id: socket.id
    };
    
    // Gửi danh sách toàn bộ người chơi hiện tại cho người vừa kết nối
    socket.emit('currentPlayers', players);
    
    // Báo cho các người chơi cũ biết có một người mới vừa tham gia vào
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Lắng nghe sự kiện di chuyển và xoay từ người chơi
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].rotation = movementData.rotation;
            
            // Gửi vị trí cập nhật này cho toàn bộ những người chơi khác
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Lắng nghe sự kiện bắn súng
    socket.on('playerFired', (bulletData) => {
        // Broadcast thông tin viên đạn cho tất cả mọi người khác để hiển thị
        socket.broadcast.emit('bulletSpawned', bulletData);
    });

    // Xử lý khi có người ngắt kết nối (tắt tab hoặc mất mạng)
    socket.on('disconnect', () => {
        console.log(`Người chơi thoát: ${socket.id}`);
        delete players[socket.id];
        // Báo cho toàn phòng xóa nhân vật này đi
        io.emit('playerDisconnected', socket.id);
    });
});

// Chạy server tại cổng 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server game đang chạy tại: http://localhost:${PORT}`);
});

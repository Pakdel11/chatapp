
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const {addUser, removeUser, getUser, getUserInRoom, getUsersInRoom} = require('./users.js');
// port 
const PORT = process.env.PORT || 3000;

// Router

const router = require('./router');

// server 
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// intgrete io with app
io.on('connection', (socket)=>{
    socket.on('join', ({name, room}, callback) =>{
        const {error, user } = addUser({id: socket.id, name, room});
        if(error) return callback(error);

        socket.emit('message', {user: 'admin', text: `welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined!`});
        
        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('sendMessage', (message, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('RoomData', {room: user.room, users: getUsersInRoom(user.room)});
        

        callback()
    })


    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.`});
        }
    })
})
// app use 
app.use(router);
app.use(cors);

//s run server
server.listen(PORT, console.log(`the server is runing on ${PORT}`));
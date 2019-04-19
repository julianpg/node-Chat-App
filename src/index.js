const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {generateMessage,generateLocationMessage}= require('./utils/messages')
const {addUser,removeUser,getUser,getUserInRoom} = require('./utils/users')
const Filter = require('bad-words')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicdirectory = path.join(__dirname,'../public')

app.use(express.static(publicdirectory))

io.on('connection',(socket)=>{
    console.log('New Connection detected')

    socket.on('join',({username,room},callback)=>{
       const {error, user} = addUser({id: socket.id,username,room})

       if(error){
            return callback(error)
       }

       socket.join(user.room)

        socket.emit('message',generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) =>{
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)){

            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))//emits to all connections
        callback('Delivered')
    })
    socket.on('sendLocation', (location,callback) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))//emits to all connections
        callback('Location sent')
    })
    socket.on('disconnect', () =>{
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    
        
    })
})
server.listen(port, ()=>{
    console.log('server is up and running '+ port)
})
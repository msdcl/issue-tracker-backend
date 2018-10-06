/**
 * modules dependencies.
 */
const socketio = require('socket.io');

const events = require('events');
const eventEmitter = new events.EventEmitter();

const tokenLib = require("./tokenLib.js");
const check = require("./checkLib.js");
const response = require('./responseLib')
const sock_session = require("./activeSockets")
const redisLib = require("./redisLib.js");



let setServer = (server) => {

    //let allOnlineUsers = []

    let io = socketio.listen(server);

    let myIo = io.of('/')

    myIo.on('connection', (socket) => {
        socket.on('register-User',(userId)=>{
            console.log("listen-register-user")
          sock_session.sessions[userId]=socket
        })

        socket.on('logout-User',(userId)=>{
            console.log("listen-register-user")
           delete sock_session.sessions[userId]
          })
    });

    

}



module.exports = {
    setServer: setServer
}

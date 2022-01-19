const http = require('http');
const express = require('express');
const socketio = require('socket.io');
var colors = require('colors');

const app = express();

app.use(express.static(`${__dirname}/../client`));

const server = http.createServer(app);
const io = socketio(server);
var users = [];

io.on('connection', (sock) => { // For each socket
  users.push(sock.id);
  sock.emit('clientid', sock.id); // Give player their id
  console.log('['+colors.green('Server')+'] '+'Player '+colors.green.bold(sock.id)+' connected');

  sock.once('disconnect', function() { // When player disconnects
    io.emit('exitserverplayer', sock.id);
    console.log('['+colors.green('Server')+'] '+'Player '+colors.red.bold(sock.id)+' disconnected');
    users.splice(sock.id);
  });

  sock.on('clientmsg', (text) => { // Forward chat message to all players upon receiving from client
    io.emit('servermsg', text);
    console.log(text);
  });

  sock.on('askplayercount', () => { // Send player count
    sock.emit('playercount', users.length);
  });



  sock.on('localplayerupdate', (data) => { // Receive and send local player updates to all players
    io.emit('serverplayerupdate', data);
    sock.emit('serverplayerdata', data);
  });
});

const port = 80 // Server port
server.on('error', (err) => { // On error
  console.error(err);
});
server.listen(port, () => { // On start
  console.log(colors.blue.bold('Ponytown Cinema'));
  console.log('['+colors.green('Server')+'] '+colors.green.bold('Listening on port '+port));
});

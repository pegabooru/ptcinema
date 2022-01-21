const port = 80; // Server port
const version = 'Pony Cinema v0.1.0a'; // Version

const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const colors = require('colors');

const app = express();

app.use(express.static(`${__dirname}/../client`));

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (sock) => { // For each socket
  date = new Date();
  sock.emit('clientid', [sock.id, version]); // Give player their id
  io.emit('enterserverplayer', sock.id);
  console.log('['+colors.gray(date.getHours()+':'+date.getMinutes()+':'+date.getSeconds())+'] '+'Player '+colors.green.bold(sock.id)+' connected');

  sock.once('disconnect', function() { // When player disconnects
    date = new Date();
    io.emit('exitserverplayer', sock.id);
    console.log('['+colors.gray(date.getHours()+':'+date.getMinutes()+':'+date.getSeconds())+'] '+colors.red.bold(sock.id)+' disconnected');
  });

  sock.on('clientmsg', (text) => { // Forward chat message to all players upon receiving from client
    date = new Date();
    io.emit('servermsg', text);
    console.log('['+colors.gray(date.getHours()+':'+date.getMinutes()+':'+date.getSeconds())+'] '+text);
  });



  sock.on('playerupdate', (data) => { // Receive and send local player updates to all players
    sock.emit('localplayerupdate', [data[4], data[5]]); // Return the data back to local player
    io.emit('serverplayerupdate', data); // Forward data to all other players
  });
});

server.on('error', (err) => { // On error
  console.error(err);
});
server.listen(port, () => { // On start
  date = new Date();
  console.log(colors.blue.bold('---Ponytown Cinema---'));
  console.log('['+colors.gray(date.getHours()+':'+date.getMinutes()+':'+date.getSeconds())+'] '+colors.green.bold('Listening on port '+port));
});

setInterval(() => { // Send ticks to clients
  io.emit('tick', [5000, 5000]);
}, 10);

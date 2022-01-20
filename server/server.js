const http = require('http');
const express = require('express');
const socketio = require('socket.io');
var colors = require('colors');

const app = express();

app.use(express.static(`${__dirname}/../client`));

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (sock) => { // For each socket
  sock.emit('clientid', sock.id); // Give player their id
  console.log('['+colors.green('Server')+'] '+'Player '+colors.green.bold(sock.id)+' connected');

  sock.once('disconnect', function() { // When player disconnects
    io.emit('exitserverplayer', sock.id);
    console.log('['+colors.green('Server')+'] '+'Player '+colors.red.bold(sock.id)+' disconnected');
  });

  sock.on('clientmsg', (text) => { // Forward chat message to all players upon receiving from client
    io.emit('servermsg', text);
    console.log(text);
  });

  sock.on('askplayercount', () => { // Send player count
    sock.emit('playercount', users.length);
  });



  sock.on('playerupdate', (data) => { // Receive and send local player updates to all players
    sock.emit('localplayerupdate', [data[4], data[5]]); // Return the data back to local player
    io.emit('serverplayerupdate', data); // Forward data to all other players
    console.log(data);
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

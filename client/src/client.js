// Server stuff
var myid = 'anonymous';

const sock = io();

sock.on('clientid', (id) => { // Give player an id
  myid = id;
  console.log('Your ID: '+myid);
});

function sendmessage(msg) { // Send a message to server and all players
  sock.emit('clientmsg', myid+': '+msg);
};
sock.on('servermsg', (text) => console.log(text)); // Receive player messages

function playercount() { // Ask server for player count
  sock.emit('askplayercount', '');
};
sock.on('playercount', (data) => {console.log(data)});



// Main game
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player { // Local player
  constructor(x, y, s, c) {
    this.x = x;
    this.y = y;
    this.speed = s;
    this.color = c;
  };

  update() {
    var velX = 0;
    var velY = 0;

    // Obviously if you need more keybinds for stuff just copy one of the if statements
    if (keys['SHIFT']) {this.speed = 3} else {this.speed = 2}; // Sprint
    if (keys['S']) { // Down
      velY = this.speed;
    };
    if (keys['W']) { // Up
      velY = -this.speed;
    };
    if (keys['D']) { // Right
      velX = this.speed;
    };
    if (keys['A']) { // Left
      velX = -this.speed;
    };
    sock.emit('localplayerupdate', [myid, this.x, this.y, this.color]);
    this.draw(velX, velY);
  };

  draw(vx, vy) {
    this.x += vx;
    this.y += vy;
    c.beginPath();
    c.fillStyle = this.color;
    c.fillRect(this.x, this.y, 64, 64);
  };
};

class ServerPlayer { // Server player
  constructor(x, y, c, id) {
    this.x = x;
    this.y = y;
    this.color = c;
    this.id = id;
  };

  draw() {
    c.beginPath();
    c.fillStyle = this.color;
    c.fillRect(this.x, this.y, 64, 64);
  };
};

var serverplayers = [];
var serverplayersid = [];
var keys = [];

var colorid = Math.floor(Math.random() * 6);
console.log(colorid);
var mycolor = 'blue';
if (colorid == 0) {
  mycolor = 'red';
} else if (colorid == 1) {
  mycolor = 'orange';
} else if (colorid == 2) {
  mycolor = 'yellow';
} else if (colorid == 3) {
  mycolor = 'green';
} else if (colorid == 4) {
  mycolor = 'blue';
} else if (colorid == 5) {
  mycolor = 'purple';
};
const player = new Player(Math.floor(canvas.width/2), Math.floor(canvas.height/2), 2, mycolor); // Create instance of local player: startx, starty, speed, color

function animate() {
  c.clearRect(0, 0, canvas.width, canvas.height);
  player.update();
  for (let i = 0; i < serverplayers.length; i++) {
    if (serverplayers[i].id != myid) {
      serverplayers[i].draw();
    };
  };
  requestAnimationFrame(animate);
};

addEventListener('keydown', function (e) { // Keys down
  keys[e.key.toUpperCase()] = true;
});
addEventListener('keyup', function (e) { // Keys up
  keys[e.key.toUpperCase()] = false;
});

sock.on('serverplayerupdate', (data) => { // Receive updates from other players, add them to players list if they are not in it already and update id list
  if (data[0] != myid) {
    if (data[0] != 'anonymous') {
      if (serverplayersid.indexOf(data[0]) == -1) {
        serverplayersid.push(data[0]); // Append their id to the list of player ids
        serverplayers.push(new ServerPlayer(data[1], data[2], data[3], data[0])); // New instance of server player, index corresponds with index of serverplayersid
      }
      else {
        serverplayers[serverplayersid.indexOf(data[0])].x = data[1]; // Update their x coordinate
        serverplayers[serverplayersid.indexOf(data[0])].y = data[2]; // Update their y coordinate
        serverplayers[serverplayersid.indexOf(data[0])].color = data[3]; // Update their color
      };
    };
  };
});
sock.on('exitserverplayer', (theirid) => {
  if (theirid != myid) {
    serverplayers.splice(serverplayersid.indexOf(theirid), 1);
    serverplayersid.splice(serverplayersid.indexOf(theirid), 1);
    console.log('Player '+theirid+' disconnected');
  };
});

animate();
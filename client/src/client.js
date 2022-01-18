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
    if (keys['SHIFT']) {this.speed = 2} else {this.speed = 1}; // Sprint
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
var keys = [];

const player = new Player(canvas.width/2, canvas.height/2, 1, 'blue'); // Create instance of local player: startx, starty, speed, color

function animate() {
  c.clearRect(0, 0, canvas.width, canvas.height);
  player.update();
  for (let i = 0; i < serverplayers.length; i++) {
    serverplayers[i].draw();
  };
  requestAnimationFrame(animate);
};

addEventListener('keydown', function (e) { // Keys down
  keys[e.key.toUpperCase()] = true;
});
addEventListener('keyup', function (e) { // Keys up
  keys[e.key.toUpperCase()] = false;
});

sock.on('serverplayerupdate', (data) => {
  if (data[0] != myid) {
    if (data[0] != 'anonymous') {
      serverplayers.push(new ServerPlayer(data[1], data[2], 'red', data[0]));
    }
    else if (serverplayers.indexOf(data[0]) != -1) {
      serverplayers[serverplayers.indexOf(data[0])].x = data[1];
      serverplayers[serverplayers.indexOf(data[0])].x = data[2];
      serverplayers[serverplayers.indexOf(data[0])].color = data[3];
    };
  };
});
sock.on('exitserverplayer', (theirid) => {
  if (theirid != myid) {
    serverplayers.pop(theirid);
  };
});

animate();
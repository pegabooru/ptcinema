// Server stuff
var myid = 'anonymous';

const sock = io();

sock.on('clientid', (id) => { // Give player an id
  myid = id;
  console.log('Your ID: '+myid);
});

function msg(msg) { // Send a message to server and all players
  sock.emit('clientmsg', myid+': '+msg);
};
sock.on('servermsg', (text) => console.log(text)); // Receive player messages

function name(name) {
  player.name = name;
};



// Main game
const canvas = document.querySelector('canvas');
canvas.width = innerWidth;
canvas.height = innerHeight;
canvas.background = 'img/bg.png';
const c = canvas.getContext('2d');

class Player { // Local player
  constructor(myid, x, y, s, c) {
    this.name = myid
    this.x = x;
    this.y = y;
    this.speed = s;
    this.color = c;
  };

  update() {
    canvas.width = innerWidth; // Update canvas dimensions if changed
    canvas.height = innerHeight;
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
    sock.emit('playerupdate', [myid, this.x, this.y, this.color, velX, velY, this.name]); // Send updates to server
    this.draw();
  };

  draw() { // Draw player
    c.beginPath();
    c.fillStyle = this.color;
    c.arc(this.x, this.y, 16, 0, 2*Math.PI);
    c.fill()
  };
};

class ServerPlayer { // Server player
  constructor(x, y, c, id, name) {
    this.x = x;
    this.y = y;
    this.color = c;
    this.id = id;
    this.name = name;
  };

  draw() { // Draw server player
    c.beginPath();
    c.fillStyle = this.color;
    c.textAlign = 'center';
    c.arc(this.x, this.y, 16, 0, 2*Math.PI);
    c.fill()
    c.fillStyle = 'black';
    c.fillText(this.name, this.x, this.y-20);
  };
};

var serverplayers = [];
var serverplayersid = [];
var keys = [];

var colorid = Math.floor(Math.random() * 6);
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

const player = new Player(myid, Math.floor(canvas.width/2), Math.floor(canvas.height/2), 2, mycolor); // Create instance of local player: startx, starty, speed, color

function animate() { // Animation loop
  c.clearRect(0, 0, canvas.width, canvas.height);
  player.update(); // Update player
  for (let i = 0; i < serverplayers.length; i++) { // Update server players
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

sock.on('localplayerupdate', (data) => { // Receive updates from self only when server receives them
  player.x += data[0];
  player.y += data[1];
});
sock.on('serverplayerupdate', (data) => { // Receive updates from other players, add them to players list if they are not in it already and update id list
  if (data[0] != myid && data[0] != 'anonymous') { // Make sure to not update self from other updates
    if (serverplayersid.indexOf(data[0]) == -1) {
      serverplayersid.push(data[0]); // Append their id to the list of player ids
      serverplayers.push(new ServerPlayer(data[1], data[2], data[3], data[0], data[7])); // New instance of server player, index corresponds with index of serverplayersid
    }
    else {
      serverplayers[serverplayersid.indexOf(data[0])].x = data[1]; // Update their x coordinate
      serverplayers[serverplayersid.indexOf(data[0])].y = data[2]; // Update their y coordinate
      serverplayers[serverplayersid.indexOf(data[0])].color = data[3]; // Update their color
      serverplayers[serverplayersid.indexOf(data[0])].name = data[6]; // Update their name
    };
  };
});
sock.on('exitserverplayer', (theirid) => { // When a player disconnects
  if (theirid != myid) {
    serverplayers.splice(serverplayersid.indexOf(theirid), 1);
    serverplayersid.splice(serverplayersid.indexOf(theirid), 1);
    console.log('Player '+theirid+' disconnected');
  };
});

animate();

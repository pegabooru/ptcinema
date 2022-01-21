// Server stuff
var myid = 'anonymous';
var version = '';

const sock = io();

sock.on('clientid', (id) => { // Give player an id
  myid = id[0];
  version = id[1];
  console.log('Your ID: '+myid);
});

function msg(msg) { // Send a message to server and all players
  sock.emit('clientmsg', player.name+': '+msg);
};
sock.on('servermsg', (text) => { // Receive messages
  notify(text, 'black');
  console.log(text);
});

function notify(msg, color) { // Normal
  var notifier = document.getElementById("notify");
  notifier.style.backgroundColor = color
  var notifierText = document.getElementById("notifyText");
  notifierText.innerText = msg;
  notifier.style.visibility = 'visible';
  setTimeout(() => {notifier.style.visibility='hidden'}, 5000);
}

function command() { // Normal
  var console = document.getElementById("console");
  console.style.backgroundColor = 'black'
  var consoleText = document.getElementById("consoleText");
  consoleText.innerText = '';
  console.style.visibility = 'visible';
}

function send(e) {
  if (event.key === 'Enter') {
    var consoleText = document.getElementById("consoleText");
    if (consoleText.value.substring(0,1) == '/') {
      if (consoleText.value.substring(0,5) == '/name' || consoleText.value.substring(0,5) == '/nick') { // Nickname
        player.name = consoleText.value.substring(6);
      } else if (consoleText.value.substring(0,6) == '/color') { // Color
        player.color = consoleText.value.substring(7);
      } else if (consoleText.value.substring(0,5) == '/goto' || consoleText.value.substring(0,3) == '/tp' || consoleText.value.substring(0,9) == '/teleport') { // Teleport
        var coords = consoleText.value.match(/[0-9]+/g);
        if (coords.length == 2) {
          player.x = parseInt(coords[0]);
          player.y = parseInt(coords[1]);
        } else {
          notify('Invalid coordinates', '#740000');
        }
      } else {
        notify('Invalid command', '#740000');
      };
    } else { // Send chat
      msg(consoleText.value);
    };

    consoleText.value = '';
  };
};

// Main game
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

class Player { // Local player
  constructor(myid, x, y, s, c) {
    this.name = myid;
    this.x = x;
    this.y = y;
    this.speed = s;
    this.color = c;
  };

  update() {
    var velX = 0;
    var velY = 0;

    // Obviously if you need more keybinds for stuff just copy one of the if statements
    if (keys['ENTER'] || keys['Y']) {
      command();
      document.getElementById("consoleText").focus();
    };
    if (keys['ESCAPE']) {
      var console = document.getElementById("console");
      console.style.visibility = 'hidden';
    };
    if (document.body === document.activeElement) {
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
    };
    sock.emit('playerupdate', [myid, this.x, this.y, this.color, velX, velY, this.name]); // Send updates to server
    this.draw();
  };

  draw() { // Draw player
    c.beginPath();
    var ogColor = tinycolor(this.color);
    var darkerColor = ogColor.darken(10).toString();
    c.fillStyle = darkerColor;
    c.arc(this.x, this.y, 16, 0, 2*Math.PI);
    c.fill()
    c.closePath();
    
    c.beginPath();
    c.fillStyle = this.color;
    c.arc(this.x, this.y, 12, 0, 2*Math.PI);
    c.fill()
    c.textAlign = 'center';
    c.font = '15px sans-serif';
    c.fillText(this.name+' (You)', this.x, this.y-20);
    c.fillText('X: '+this.x+' Y: '+this.y, this.x, this.y+30);
    c.closePath();
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
    var ogColor = tinycolor(this.color);
    var darkerColor = ogColor.darken(10).toString();
    c.fillStyle = darkerColor;
    c.arc(this.x, this.y, 16, 0, 2*Math.PI);
    c.fill()
    c.closePath();
    
    c.beginPath();
    c.fillStyle = this.color;
    c.arc(this.x, this.y, 12, 0, 2*Math.PI);
    c.fill();
    c.textAlign = 'center';
    c.font = '15px sans-serif';
    c.fillText(this.name, this.x, this.y-20);
    c.fillText('X: '+this.x+' Y: '+this.y, this.x, this.y+30);
    c.closePath();
  };
};

var serverplayers = [];
var serverplayersid = [];
var keys = [];

var colorid = Math.floor(Math.random() * 8);
var mycolor = 'blue';
if (colorid == 0) {
  mycolor = 'red';
} else if (colorid == 1) {
  mycolor = 'orange';
} else if (colorid == 2) {
  mycolor = 'yellow';
} else if (colorid == 3) {
  mycolor = 'lime';
} else if (colorid == 4) {
  mycolor = 'blue';
} else if (colorid == 5) {
  mycolor = 'purple';
} else if (colorid == 6) {
  mycolor = 'cyan';
} else if (colorid == 7) {
  mycolor = 'deeppink';
};

const player = new Player(myid, 100, 100, 2, mycolor); // Create instance of local player: startx, starty, speed, color

sock.on('tick', (data) => { // On tick
  canvas.width = data[0];
  canvas.height = data[1];
  c.clearRect(0, 0, canvas.width, canvas.height);
  const versionText = document.getElementById("versionText");
  versionText.innerText = version;
  window.scrollTo(player.x-innerWidth/2, player.y-innerHeight/2); // Keep player in center of screen
  for (let i = 0; i < serverplayers.length; i++) { // Update server players
    if (serverplayers[i].id != myid) {
      serverplayers[i].draw();
      if (serverplayers[i].id == null) {
        serverplayers.splice(serverplayers[i], 1);
        serverplayersid.splice(serverplayers[i], 1);
      };
    };
  };
  player.update(); // Update player
  player.name = player.name.substring(0, 16);
});

addEventListener('keydown', function (e) { // Keys down
  keys[e.key.toUpperCase()] = true;
});
addEventListener('keyup', function (e) { // Keys up
  keys[e.key.toUpperCase()] = false;
});

sock.on('localplayerupdate', (data) => { // Receive updates from self only when server receives them
  player.x += data[0];
  player.y += data[1];
  if (player.x-16 <= 0) {player.x = 16};
  if (player.y-16 <= 0) {player.y = 16};
  if (player.x+16 >= canvas.width) {player.x = canvas.width-16};
  if (player.y+16 >= canvas.height) {player.y = canvas.height-16};
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
sock.on('enterserverplayer', (theirid) => {
  notify('Player '+theirid+' connected', '#00744d');
  console.log('Player '+theirid+' connected');
});
sock.on('exitserverplayer', (theirid) => { // When a player disconnects
  if (theirid != myid) {
    serverplayers.splice(serverplayersid.indexOf(theirid), 1);
    serverplayersid.splice(serverplayersid.indexOf(theirid), 1);
    notify('Player '+theirid+' disconnected', '#747200');
    console.log('Player '+theirid+' disconnected');
  };
});

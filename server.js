const defaultMoney = 10000;
const maxAmountPlayers = 6;
var idIndex = 0;
var game;

var http = require('http');
const WebSocket = require("ws");

let t = require("timers");


const express = require('express');
const cors = require('cors');


function broadcast(data, source) {
	wss.clients.forEach(value => {
		if (value.readyState === WebSocket.OPEN && value != source) {
			value.send(JSON.stringify(data));
		};
	});
};

//var interval = t.setInterval(broadcast, 1000, "Hello world!!!");

function init(){
	game = new Object();
	game.players = [];
	game.objects = [];
	game.globalWarming = 0;
	
	game.dice = new Object();
	game.dice.number = 1;
	game.dice.x = 1592;
	game.dice.y = 728;
}

function parseData(data, source) {
	if ('addPlayer' in data) {
		addPlayer(data.addPlayer);
	}
	
	if ('moveObject' in data) {
		if(moveObject(data.moveObject))	broadcast(data, source);
	}
	
	if ('createObject' in data) {
		createObject(data.createObject, 'tile');
	}
	
	if ('deleteObject' in data) {
		if(deleteObject(data.deleteObject)) broadcast(data);
	}
	
	if ('updateMoney' in data) {
		updateMoney(data.updateMoney, source);
	}
	
	if ('resetBoard' in data) {
		resetBoard();
	}
	
	if ('rollDice' in data) {
		game.dice.number = Math.floor(Math.random() * Math.floor(6))+1;
		data.rollDice = game.dice.number;
		broadcast(data);
	}
	
	if('globalWarming' in data){
		globalWarmingMeter(data, source);
	}
}

function moveObject(data) {
	if(data.id == "dice") {
		game.dice.x = data.x;
		game.dice.y = data.y;
		return true;
	}
	var object = game.objects.filter(obj => {
	  return obj.id == data.id;
	})[0];
	if(typeof object === 'undefined') return false;	
	object.x = data.x;
	object.y = data.y;
	return true;
}

function deleteObject(data) {
	for(var i = 0; i < game.objects.length; i++){
		if(game.objects[i].id == data.id) {
			if(game.objects[i].type == 'player'){
				game.objects[i].x = 0;
				game.objects[i].y = 0;
				var data = new Object();
				data.moveObject = new Object();
				data.moveObject.id = game.objects[i].id;
				data.moveObject.x = game.objects[i].x;
				data.moveObject.y = game.objects[i].y;
				broadcast(data);
				return false;
			}
			game.objects.splice(i, 1);
			return true;
		}
	}
	console.log("error. object nog gevonden");
	return false;
}

function addPlayer(data) {
	if(game.players.length >= maxAmountPlayers) return false;
	var player = new Object();
	player.id = idIndex++;
	player.name = data.name;
	player.imageUrl = data.imageUrl;
	player.money = defaultMoney;
	game.players.push(player);
	
	data = new Object();
	data.players = game.players;
	broadcast(data);
	
	data = new Object();
	data.imageUrl = player.imageUrl;
	createObject(data, 'player');
}

function createObject(data, type, source) {
	var object = new Object();
	object.id = idIndex++;
	object.imageUrl = data.imageUrl;
	object.type = type;
	if ('x' in data) {
		object.x = data.x;
		object.y = data.y;
	} else {
		object.x = 0;
		object.y = 0;
	}
	game.objects.push(object);
	var data = new Object();
	data.createObject = object;
	broadcast(data);
}

function updateMoney(data, source){
	var object = game.players.filter(obj => {
	  return obj.id == data.id;
	})[0];
	if(typeof object === 'undefined') return false;
	object.money = data.money;
	var data = new Object();
	data.players = game.players;
	broadcast(data, source);
	return true;
}

function resetBoard(){
	init();
	broadcast(game);
}

function globalWarmingMeter(data, source){
	game.globalWarming = data.globalWarming;
	broadcast(data, source);
}

//webpagina shizzles
init();
console.log("Setting up server...");
const server = http.createServer();
const app = express();
app.use(cors());
app.use(express.static('public'));
server.on("request", app);

server.listen(process.env.PORT || 80, () => {
 console.log(`http/ws server listening on ${process.env.PORT || 80}`);
});

// Setup websockets
let wss = new WebSocket.Server({server});

wss.on('connection', function connection(ws) {
	console.log("Client connected.");
	ws.send(JSON.stringify(game));
	
	ws.on('message', function incoming(message) {
		parseData(JSON.parse(message), this);
	});
});
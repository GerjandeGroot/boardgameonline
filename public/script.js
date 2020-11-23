const maxAmountPlayers = 6;
var socket;

window.addEventListener('load', (event) => {
	//draggable stuff
	document.getElementById('map').ondragstart = function() { return false; };
	
	document.onmousedown = startDrag;
	document.onmouseup = stopDrag;
	
	document.getElementById("addPlayer").onclick = function() {
		document.getElementById("addPlayerModal").style.display = "block";
		document.getElementById("playerName").focus();
	}
	document.getElementById("resetBoard").onclick = function() {
		document.getElementById('resetBoardModal').style.display = "block";
	}
	window.onclick = function(event) {
		if (event.target.classList.contains("modal")) {
			event.target.style.display = "none";
		}
	}
	var elements = document.getElementsByClassName("selectable");
	var select = function() {
		if (document.getElementsByClassName("selected").length > 0) {
			document.getElementsByClassName("selected")[0].classList.remove("selected");
		}
		this.classList.add("selected");
	};
	for (var i = 0; i < elements.length; i++) {
		elements[i].addEventListener('click', select, false);
	}
	document.getElementById("addPlayerSubmit").onclick = addPlayer;
	
	var elements = document.getElementsByClassName("creatable");
	for (var i = 0; i < elements.length; i++) {
		elements[i].onmousedown = requestCreateObject;
	}	
	
	document.getElementById("globalWarming").oninput = sendGlobalWarming;
	
	//create connection
	console.log('page is fully loaded connecting to backend:');
	socket = new WebSocket("ws://213.247.101.190/");
	
	socket.onopen = function(e) {
		console.log("[open] Connection established");
	};

	socket.onmessage = function(event) {
		//console.log(`[message] Data received from server:`);
		//console.log(event.data);
		
		var data = JSON.parse(event.data);
		
		if (typeof data.players !== 'undefined') {
			parsePlayers(data.players);
		}
		
		if (typeof data.objects !== 'undefined') {
			parseObjects(data.objects);
		}
		
		if (typeof data.moveObject !== 'undefined') {
			moveObject(data.moveObject);
		}
		
		if (typeof data.createObject !== 'undefined') {
			createObject(data.createObject);
		}
		
		if (typeof data.deleteObject !== 'undefined') {
			deleteObject(data.deleteObject);
		}
		
		if (typeof data.rollDice !== 'undefined') {
			rollDice(data.rollDice);
		}
		
		if (typeof data.globalWarming !== 'undefined') {
			globalWarming(data.globalWarming);
		}
		
		if (typeof data.dice !== 'undefined') {
			var dice = document.getElementById("dice").style.left = data.dice.x;
			var dice = document.getElementById("dice").style.top = data.dice.y;
			rollDice(data.dice.number);
		}
		
	};

	socket.onclose = function(event) {
	  if (event.wasClean) {
		alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
	  } else {
		// e.g. server process killed or network down
		// event.code is usually 1006 in this case
		alert('[close] Connection died');
		location.reload();
	  }
	};

	socket.onerror = function(error) {
	  alert(`[error] ${error.message}`);
	  location.reload();
	};
});

function requestResetBoard() {
	var data = new Object();
	data.resetBoard = new Object();
	socket.send(JSON.stringify(data));
}

function addPlayer() {
	var data = new Object();
	data.addPlayer = new Object();
	data.addPlayer.name = document.getElementById("playerName").value;
	var el = document.getElementsByClassName("selected");
	
	if(el.length == 0) {
		alert("Select hero");
		return;
	}
	data.addPlayer.imageUrl = el[0].src;
	socket.send(JSON.stringify(data));
	var modal = document.getElementById("addPlayerModal");
	modal.style.display = "none";
}
function parsePlayers(players) {
	var btn = document.getElementById("addPlayer");
	if(players.length >= maxAmountPlayers) {
		btn.style.display = "none";
	} else {
		btn.style.display = "inline";
	}
	var els = document.getElementsByClassName("player");
	while (els.length > 0) {
		els[0].remove();
	}
	
	var el = document.getElementById("players");
	for (var i = 0; i < players.length; i++) {
		var inventory = document.createElement("td");
		
		var name = document.createElement("td");
		name.appendChild(document.createTextNode(players[i].name));
		
		var hero = document.createElement("td");
		var img = document.createElement("img");
		img.classList.add("playerHero");
		img.src = players[i].imageUrl;
		hero.appendChild(img);
		
		var money = document.createElement("td");
		var moneyInput = document.createElement("input");
		moneyInput.type = 'number';
		moneyInput.value = players[i].money;
		moneyInput.oninput = function() {
			var data = new Object();
			data.updateMoney = new Object();
			data.updateMoney.id = this.parentNode.parentNode.id;
			data.updateMoney.money = this.value;
			socket.send(JSON.stringify(data));
		}
		moneyInput.onclick = this.focus();	
		money.appendChild(moneyInput);
				
		var node = document.createElement("tr");
		node.class = "player";
		node.appendChild(inventory);
		node.appendChild(name);
		node.appendChild(hero);
		node.appendChild(money);
		node.classList.add("player");
		node.id = players[i].id;
		
		el.appendChild(node);
	}
}
function parseObjects(objects) {
	var els = document.getElementsByClassName("object");
	while (els.length > 0) {
		els[0].remove();
	}
	for (var i = 0; i < objects.length; i++) {
		createObject(objects[i]);
	}
}
function createObject(data) {
	var img = document.createElement("img");
		
	img.src = data.imageUrl;
	img.classList.add("dragable");
	img.classList.add("object");
	img.classList.add("object_" + data.type);
	img.id = "" + data.id;
	img.style.left = data.x;
	img.style.top = data.y; 
	
	document.body.appendChild(img);
	
	if (typeof targ !== 'undefined' && targ.className == 'creatable') {
		targ = img;

		// calculate integer values for top and left 
		// properties
		coordX = parseInt(targ.style.left);
		coordY = parseInt(targ.style.top);
		drag = true;

		// move div element
		document.onmousemove=dragDiv;
	}
}

function moveObject(data) {
	var targ = document.getElementById(data.id);
	targ.style.left=data.x;
	targ.style.top=data.y;
}

function deleteObject(data) {
	document.getElementById("" + data.id).remove();
}

function offset(el) {
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}

function requestCreateObject(e) {
	var data = new Object();
	data.createObject = new Object();
	data.createObject.imageUrl = this.src;
	data.createObject.x = offset(this).left;
	data.createObject.y = offset(this).top;
	
	socket.send(JSON.stringify(data));
	dragRequest = true;
}

function startDrag(e) {
	// determine event object
	if (!e) {
		var e = window.event;
	}

	// IE uses srcElement, others use target
	targ = e.target ? e.target : e.srcElement;
	
	// calculate event X, Y coordinates
	offsetX = e.clientX;
	offsetY = e.clientY;
	
	while(!targ.classList.contains('dragable') && !targ.classList.contains('creatable')) {
		targ = targ.parentNode;
		if(targ === document) return;
	}
	
	if(e.preventDefault) e.preventDefault();
	// assign default values for top and left properties
	if(!targ.style.left) { targ.style.left='0px'};
	if (!targ.style.top) { targ.style.top='0px'};

	// calculate integer values for top and left 
	// properties
	coordX = parseInt(targ.style.left);
	coordY = parseInt(targ.style.top);
	drag = true;

	// move div element
	document.onmousemove=dragDiv;
	return false;

}
function dragDiv(e) {
	if (!drag) {return};
	if (!e) { var e= window.event};
	// var targ=e.target?e.target:e.srcElement;
	// move div element
	targ.style.left=coordX+e.clientX-offsetX+'px';
	targ.style.top=coordY+e.clientY-offsetY+'px';
	
	var data = new Object();
	data.moveObject = new Object();
	data.moveObject.id = targ.id;
	data.moveObject.x = targ.style.left;
	data.moveObject.y = targ.style.top;
	socket.send(JSON.stringify(data));
	return false;
}
function stopDrag() {
	if(typeof targ.classList === "undefined") return;
	
	var map = document.getElementById("map");
	if (targ.classList.contains("dice")) {
		requestRollDice();
		
	} else if (parseInt(targ.style.top) > map.height) {
		var data = new Object();
		data.deleteObject = new Object();
		data.deleteObject.id = targ.id;
		socket.send(JSON.stringify(data));
	}
	drag=false;
}

function requestRollDice(){
	var data = new Object();
	data.rollDice = new Object();
	socket.send(JSON.stringify(data));
}

function rollDice(number) {
	const dice = [...document.querySelectorAll(".die-list")];
	dice.forEach(die => {
		toggleClasses(die);
		die.dataset.roll = number;
	});
}

function toggleClasses(die) {
  die.classList.toggle("odd-roll");
  die.classList.toggle("even-roll");
}

function getRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function closeModal(target) {
	target.parentNode.parentNode.style.display = "none";
}

function globalWarming(data){
	var targ = document.getElementById("globalWarming");
	targ.value = data;
}

function sendGlobalWarming(){
	var targ = document.getElementById("globalWarming");
	var data = new Object();
	data.globalWarming = targ.value;
	socket.send(JSON.stringify(data));
}
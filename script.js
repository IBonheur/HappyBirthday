


alert()
var messages = ["Hello There, It's my Birthday  <br /> Happy Birthday to Me <br> BONHEUR ",

	];

var i = messages.length;
var s = Math.floor(Math.random() * i);

document.getElementById("msg")
	.innerHTML = '" ' + messages[s] + ' "';

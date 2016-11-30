/*
Setup:
  npm install ws

Usage:
  Create an API key in Rancher and start up with:

  node socket.js address.of.rancher:8080 access_key secret_key
*/
var WebSocket = require('ws');
var http = require('http');
var proxy = require('redbird')({port: 80});

var host = process.env.RANCHER_HOST;
var accessKey = RANCHER_ACCESS_KEY;
var secretKey = RANCHER_SECRET_KEY;

var URL_LABEL = "proxy_url";

var url = 'ws://'+accessKey+':'+secretKey+'@'+host+'/v1/subscribe?eventNames=resource.change';
var socket = new WebSocket(url);

socket.on('open', function() {
  console.log('Socket opened');
});




socket.on('message', function(messageStr) {
  var message = JSON.parse(messageStr);

  if ( message.name === 'resource.change') {
  	if( message.resourceType === 'container'){
	   	if(message.data){
		    var resource = message.data.resource;

		    if(resource.labels[URL_LABEL]){
		    	var config = extractConfig(resource);
		    	//remove configuration where stopped
		    	if(resource.state === 'stopped')
		    	{
		    		console.log("remove config for "+config.serverName);
		    		proxy.unregister(config.serverName);
		    	}
				//create configuration where stopper
		    	else if(resource.state === 'running'){
		    		console.log("add config for "+config.serverName+" : "+config.serverRedirect+":"+config.serverRedirectPort);

					proxy.register(config.serverName, "http://"+config.serverRedirect+":"+config.serverRedirectPort);
		    	}
		    	console.log(resource);
			}
		}
		
	}else{
	  //	console.log("message.resourceType : "+message.resourceType)
	} 
  }else{
  //	console.log("message.name : " + message.name);
  }
});

socket.on('close', function() {
  console.log('Socket closed');
});

function extractConfig(resource){
	var config = {};
	config.serverName = resource.labels[URL_LABEL];
	config.serverRedirect = resource.resourceprimaryIpAddress;


	resource.links.ports
	config.serverRedirectPort = 80;
	data.privatePort
	return config;
	
}
/*
function getPort(resource){
	var options = {
		host: 'www.random.org',
		path: '/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
	};

	callback = function(response) {
		var str = '';

		//another chunk of data has been recieved, so append it to `str`
		response.on('data', function (chunk) {
		str += chunk;
		});

		//the whole response has been recieved, so we just print it out here
		response.on('end', function () {
			var message = JSON.parse(messageStr);
			console.log(str);
		});
	}

	http.request(options, callback).end();
}*/
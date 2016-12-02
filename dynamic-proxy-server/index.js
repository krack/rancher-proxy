
 /* jshint -W082:true */
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
var accessKey = process.env.RANCHER_ACCESS_KEY;
var secretKey = process.env.RANCHER_SECRET_KEY;

var URL_LABEL = "proxy_url";

var urlEvent = 'ws://'+accessKey+':'+secretKey+'@'+host+'/v1/subscribe?eventNames=resource.change';


function callApi(path, callback){
	var apiHost = "localhost";
	var portHost = 80;


	var hostPart = host.split(':');
	if(hostPart.length ==2){
		apiHost = hostPart[0];	
		portHost = hostPart[1];	
	}else{
		apiHost = host;
	}
	var options = {
		host: apiHost,
		port : portHost,
		path: '/v1/containers',
		auth: accessKey+':'+secretKey
	};
	
	http.get(options, function(res) {
		  // Continuously update stream with data
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function() {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            callback(parsed);
        });
	}).on('error', function(e) {
		console.log(e);
	});
}

function manageContainer(container){
	if(container.labels[URL_LABEL]){
    	var config = extractConfig(container);
    	//remove configuration where stopped
    	if(container.state === 'stopped')
    	{
    		console.log("remove config for "+config.serverName+"/ : "+config.serverRedirect+":"+config.serverRedirectPort);
    		 proxy.unregister(config.serverName+"/", config.serverRedirect+":"+config.serverRedirectPort);
    	}
		//create configuration where stopper
    	else if(container.state === 'running'){
    		console.log("add config for "+config.serverName+" : "+config.serverRedirect+":"+config.serverRedirectPort);
			var entry = proxy.register(config.serverName, "http://"+config.serverRedirect+":"+config.serverRedirectPort);
    	}
    }
}
function extractConfig(resource){
	var config = {};
	config.serverName = resource.labels[URL_LABEL];
	config.serverRedirect = resource.primaryIpAddress;
	var allInfo = resource.ports[0];
	config.serverRedirectPort = allInfo.split(":")[0];
	return config;
	
}

function addRunningServer(){
	callApi('/v1/containers', function(result){
		for(var i = 0; i < result.data.length; i++){
			var container = result.data[i];
			manageContainer(container);
		}
	});
}

function runEventListener(){
	var socket = new WebSocket(urlEvent);

	socket.on('open', function() {
	  console.log('Socket opened');
	});

	socket.on('message', function(messageStr) {
	  var message = JSON.parse(messageStr);
	  if ( message.name === 'resource.change') {
	  	if( message.resourceType === 'container'){
		   	if(message.data){
			    var resource = message.data.resource;
			    manageContainer(resource);
			}		
		}
	  }
	});

	socket.on('close', function() {
	  console.log('Socket closed');
	});
}


runEventListener();
addRunningServer();

import {sack} from "sack.vfs";
import path from "path";

import {accept,connect} from "./game.mjs"

const extMap = { '.js': 'text/javascript'
              ,  '.mjs':'text/javascript'
              , '.js.gz':'text/javascript'
              , '.gz':'text/javascript'
              ,  '.css':'text/css'
              ,'.json':'application/json'
              ,'.png':'image/png'
              ,'.html':'text/html'
              ,'.htm':'text/html'
              ,'.jpg':'image/jpg'
              ,'.wav':'audio/wav'
              ,'.crt':'application/x-x509-ca-cert'
              ,'.pem':'application/x-pem-file'
              ,'.wasm': 'application/wasm'
              , '.asm': 'application/wasm' }

export function openServer( opts, cb )
{
	var serverOpts = opts || {port:Number(process.argv[2])||8888} ;
	var server = sack.WebSocket.Server( serverOpts )
	var disk = sack.Volume();
	//console.log( "disk?", disk, Object.getPrototypeOf( disk ) );
	console.log( "serving on " + serverOpts.port );
	//console.log( "with:", disk.dir() );

	server.onrequest = function( req, res ) {
		var ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
			 req.connection.remoteAddress ||
			 req.socket.remoteAddress ||
			 req.connection.socket.remoteAddress;

		//console.log( "Received request:", req );
		if( req.url === "/" ) req.url = "/index.html";
		var filePath = "." + unescape(req.url);
		if( req.url.startsWith( "/node_modules/" ) && ( req.url.startsWith( "/node_modules/@d3x0r" ) || req.url.startsWith( "/node_modules/jsox" ) ) )
			filePath=".." + unescape(req.url);
		var extname = path.extname(filePath);
		var contentType = extMap[extname] || "text/plain";

		do {
			console.log( ":", extname, filePath )
			if( disk.exists( filePath ) ) {
				res.writeHead(200, { 'Content-Type': contentType });
				console.log( "Read:", "." + req.url );
				res.end( disk.read( filePath ) );
				break;
			} else {
				if( !extname ) {
					extname = ".html";
					filePath += ".html";
					continue;
				}

				console.log( "Failed request: ", req );
				res.writeHead( 404 );
				res.end( "<HTML><HEAD>404</HEAD><BODY>404</BODY></HTML>");
				break;
			} 
		} while(1);
	};

	server.onaccept = accept;
	server.onconnect = connect;
}

console.log( "module?",  import.meta );
//if( !module.parent )
	openServer();

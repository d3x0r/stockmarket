
import {sack} from "sack.vfs";
import path from "path";
//const mypath = import.meta.url.split("/");
//const myroot = (mypath.splice(mypath.length-1,1),mypath.join('/')+"/");
//console.log( "THINK:", myroot );
process.chdir( "ui");
//console.log( "Dir?", process.cwd );
import {accept,connect} from "./game.mjs"

const encMap = { '.gz':'gzip'
};
const extMap = { '.js': 'text/javascript'
              ,  '.mjs':'text/javascript'
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
	const requests = [];
	var serverOpts = opts || {port:Number(process.argv[2])||process.env.PORT||8888} ;
	var server = sack.WebSocket.Server( serverOpts )
	var disk = sack.Volume();
	//console.log( "disk?", disk, Object.getPrototypeOf( disk ) );
	//console.log( "serving on " + serverOpts.port );
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
		let extname = path.extname(filePath);
		let contentEncoding = encMap[extname];
		if( contentEncoding ) {
			extname = path.extname(path.basename(filePath,extname));
		}
		var contentType = extMap[extname] || "text/plain";

		do {
			//console.log( ":", extname, filePath )
			if( disk.exists( filePath ) ) {
				const headers = { 'Content-Type': contentType };
				if( contentEncoding ) headers['Content-Encoding']=contentEncoding;
				res.writeHead(200, headers);
				if( requests.length === 0 )
					setTimeout( logRequests, 100 );
				requests.push( req.url );

				//console.log( "Read:", "." + req.url );
				res.end( disk.read( filePath ) );
				break;
			} else {
				if( !extname ) {
					extname = ".html";
					filePath += ".html";
					continue;
				}
				requests.push( "Failed request: " + req );
				res.writeHead( 404 );
				res.end( "<HTML><HEAD>404</HEAD><BODY>404</BODY></HTML>");
				break;
			} 
		} while(1);
	};

	server.onaccept = accept;
	server.onconnect = connect;
	function logRequests() {
		const log = requests.join();
		requests.length = 0;
		console.log( "Requests:", log );
	}
}

//console.log( "module?",  import.meta );
//if( !module.parent )
	openServer();

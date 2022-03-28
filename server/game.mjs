
import {sack} from "sack.vfs";
import stocks from "./stocks.jsox"
console.log( "got Stocks:", stocks );
import board from "./board.jsox"

//const board = sack.JSOX.
console.log( "got board:", board );

const JSOX=sack.JSOX;
const hello = JSOX.stringify( { op:"data", stocks:stocks, board:board } );

export function connect(ws) {
		//console.log( "Connect:", ws );
		ws.onmessage = getHandler( ws );
		ws.onclose = function() {
                	//console.log( "Remote closed" );
	        };
	
}


export function accept( ws ) {
		//if( cb ) return cb(ws)
		const protocol = ws.headers["Sec-WebSocket-Protocol"];
	console.log( "Connection received with : ", protocol, " path:", ws );
           //     if( process.argv[2] == "1" )
	   //     	this.reject();
           //     else
			this.accept();
};




function getHandler( ws ) {
	const parser = JSOX.begin( dispatchMessage );
	ws.send( hello );
	return parser.write.bind( parser );

        
        function dispatchMessage(msg) {
	        switch( msg.op ) {
        	case "hello":
			const msg = JSOX.stringify( { op:"data", stocks:stocks, board:board } );
        		break;
	        }
        }
        
}


import {JSOX} from "/node_modules/jsox/lib/jsox.mjs";

let ws = null;
let connected = false;


class Events {
	#events = {};
	on( evt, d ) {
		if( "function" === typeof d ) {
			if( evt in this.#events ) this.#events[evt].push(d);
			else this.#events[evt] = [d];
		}else {
			if( evt in this.#events ) for( let cb of this.#events[evt] ) { const r = cb(d); if(r) return r; }
		}
	}
}


class GameState extends Events {
	board = null;
	stocks = null;
}

export const gameState = new GameState();
let gameEvents = null;

export function doReopen() {
        const peer = location.protocol.replace( "http", "ws" )+"//"+location.host +"/";

	ws = new WebSocket( peer, "stock-market" );
	ws.onclose = reopen;
	ws.onmessage = getHandler();
	ws.onopen = opened;

	function getHandler() {
		
		const parser = JSOX.begin( dispatchMessage );
		let ws = null;
		return function handleGameProtocol( evt ) {
			ws = evt.target;
			console.log ("GameEvent:", evt, this );
			parser.write( evt.data );
		} 
		function dispatchMessage( msg ) {
			parseMessage( ws, msg );
		}

	}

}


function opened() {
	connected = true; 	
}

function reopen() {
	if( !connected )
		setTimeout( 5000, doReopen );
	else {
		connected = false;
		// if this WAS connected, reconnect immediate.
		doReopen();
	}
}



function parseMessage( ws, msg ) {
	switch( msg.op ) {
	case "data":
		gameState.board = msg.board;
		gameState.stocks = msg.stocks;
		gameEvents = new Events();
		gameState.on( "load", gameEvents );
		break;
	default: // just make everything dispatched to callbacks.
		gameEvents.on( msg.op, msg );
		break;
	}

}

export function send( msg ) {
	if( "string" === typeof msg ) 
		ws.send( msg );
	else 
		ws.send( JSOX.stringify( msg ) );
}
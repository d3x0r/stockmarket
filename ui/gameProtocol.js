
import {JSOX} from "/node_modules/jsox/lib/jsox.mjs";

let ws = null;
let connected = false;


import {Events} from "./events.js";

class GameState extends Events {
	board = null;
	stocks = null;
	events = new Events();
}


export function joinGame( name ) {
	send( {op:"join", name:name } );
}

export function createGame( name ) {
	send( {op:"game", name:name } );
}

export function	sendUserName( name )  {

	send( {op:"username", name:name } );
}


export const gameState = new GameState();

let gameEvents = null;

export function on(a,b) {
	return gameEvents.on(a,b);
}

export function doReopen() {
        const peer = location.protocol.replace( "http", "ws" )+"//"+location.host +"/";

	ws = new WebSocket( peer, "stock-market" );
	ws.onclose = reopen;
	ws.onmessage = getHandler();
	ws.onopen = opened;

	function getHandler() {
		
		const parser = JSOX.begin( dispatchMessage );
		gameEvents = new Events();
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
	pending.forEach( send );	
	pending.length = 0;
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
		//gameEvents = new Events();
		gameEvents.on( "load" );
		break;
	default: // just make everything dispatched to callbacks.
		gameEvents.on( msg.op, msg );
		break;
	}

}


const pending = [];
export function send( msg ) {
	if( ws.readyState === 1 ) {
		if( "string" === typeof msg ) 
			ws.send( msg );
		else 
			ws.send( JSOX.stringify( msg ) );
	}else {
		//if( ws.readyState === 1 )
		 {
			pending.push(msg );
		}
	}
}



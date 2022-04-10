
import {JSOX} from "/node_modules/jsox/lib/jsox.mjs";

let ws = null;
let connected = false;


import {Events} from "./events.js";

class GameState extends Events {
	board = null;
	stocks = null;
	players = null;
	currentPlayer = null;
	thisPlayer = null;
	username = null;
	game = null;
	events = new Events();
}

export function sendSale( target, invoice ) {
	send( {op:"sale", target, invoice })
}

export function sendSelling() {
	// hold rolling?
	send( {op:"selling" } );
}

export function sendColor(color) {
	send( {op:"color", color } );
}

export function sendQuit() {
	send( {op:"quit" } );
}


export function sendNoSale() {
	send( {op:"no-sale" } );
}

export function sendBuy( stock, shares ) {
	send( {op:"buy", stock:stock.id, shares } );
}

export function sendSpace( id, stock, stockDir ) {
	send( {op:"space", space:id, stock:stock, stockDir:stockDir } );
}

export function sendRoll() {
	send( {op:"roll" } );
}

export function sendReady() {
	send( {op:"ready" } );
}
export function sendUnready() {
	send( {op:"unready" } );
}

export function joinGame( name ) {
	send( {op:"join", name:name } );
}

export function createGame( name ) {
	send( {op:"game", name:name } );
}

export function	sendUserName( name )  {
	gameState.username = name;
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
			//console.log ("GameEvent:", evt, this );
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

function setPlayerColor( player, color ) {
		for( let u of gameState.game.users ) {
			if( u.name === player ) u.color = color;
		}
	}        


function parseMessage( ws, msg ) {
	/* 
	// auto replace user in message with a known user...
	// some messages will not have a user name.
	if( "user" in msg ) {
		if( "string" typeof msg.user )
			for( let player of gameState.game.users ) {
				if( player.name === msg.user ) {
					msg.user = player;
					break;
				}
			}
		
	} 
	*/
	switch( msg.op ) {
	case "data":
		gameState.board = msg.board;
		gameState.stocks = msg.stocks;
		gameState.game = msg.game;
		gameState.players = msg.game.users;
		for( let player of gameState.game.users ) {
			if( player.name === gameState.username ) {
				gameState.thisPlayer = player;
				break;
			}
		}
		//if( !gameState.thisPlayer) debugger;
		//gameEvents = new Events();
		gameEvents.on( "load" );
		// already sent appropriate game data events...
		return;
	case "color":
		setPlayerColor( msg.name, msg.color );
		break;
	case "market":
		gameState.game.marketLine = msg.line;
		// allow UI to get triggered to read new value... (it shouldn't use msg...)
		break;
	case 'turn':
	case 'start':
		for( let player of gameState.game.users ) {
			if( player.name === msg.name) {
				gameState.currentPlayer = player;
				gameState.currentPlayer.rolled = false;
				break;
			}
		}
		gameState.game.currentPlayer = msg.current;
		break;
	case "pay": 
		{
			for( let player of gameState.game.users ) {
				if( player.name === msg.user) {
					player.cash = msg.balance;
					break;
				}
			}
		}
		break;
	case "give": 
	case "take": 
		{
			for( let player of gameState.game.users ) {
				if( player.name === msg.user) {
					for( let stock of player.stocks ) {
						if( stock.id === msg.stock ) {
							stock.shares = msg.balance;
							break;
						}
					}
					break;
				}
			}
		}
		break;
	case "stock":
		{
			
			for( let player of gameState.game.users ) {
				if( player.name === msg.user) {
					for( let stock of player.stocks ) {
						if( stock.id === msg.stock.id ) {
							stock.shares = msg.stock.shares;
							if( player.name === gameState.username ) {
								// tell localUI(s)
								gameEvents.on( msg.op, msg );
							}
							break;
						}
					}
					break;
				}
			}
		}
		// already sent appropriate stock events...
		return;
	case "player":
		{
			const old = gameState.players.find( player=>player.name===msg.user.name );
			if( !old ) {
				gameState.players.push( msg.user );
			} 
			else {
				Object.assign( old, msg.user );
				msg.user = old;
			}
		}
		/* fallthrough */
	default: // just make everything dispatched to callbacks.
		break;
	}
	gameEvents.on( msg.op, msg );
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



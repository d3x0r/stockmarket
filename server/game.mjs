
import {sack} from "sack.vfs";
import stocks from "./stocks.jsox"
console.log( "got Stocks:", stocks );
import board from "./board.jsox"

//const board = sack.JSOX.
console.log( "got board:", board );

const JSOX=sack.JSOX;
const hello = JSOX.stringify( { op:"data", stocks:stocks, board:board } );

class Lobby {
	users = [];
	games = [];
	constructor() {
	}
}


class Game {
	users = [];
	name = '';
	constructor(name) {
		this.name = name;
	}
}

class User { 
	name = '';
	#ws = null;
	#game = null;

	get game() { return this.#game; }
	set game(val) { this.#game=val; }
	get ws() { return this.#ws; }
	set ws(val) { this.#ws=val; }

	constructor( name ) {
		this.name = name;
	}
}

const lobby = new Lobby();

// lookup with username, gets user state
const users = new Map();

// create game with name
const games = new Map();

export function connect(ws) {
		//console.log( "Connect:", ws );
		ws.onmessage = getHandler( ws );
		ws.onclose = function() {
                	console.log( "Remote closed..." );			
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
	
	let user = null;

	return parser.write.bind( parser );

        
        function dispatchMessage(msg) {
	        switch( msg.op ) {
		case "username":
try {
			const oldUser = users.get( msg.name );
			if( oldUser ) {
				oldUser.ws.close( 1000, "Reconnected from another terminal?" );

				oldUser.ws = ws;
				user = oldUser;
				if( oldUser.game ) {
					// resume game state; skip lobby
					ws.send( hello );
					break;
				}
			}else {
				user = new User( msg.name );
				users.set( msg.name, user );
				user.ws = ws;
				lobby.users.push( user );
			}
			
			const msgout = JSOX.stringify( { op:'lobby', lobby:lobby.users, rooms:lobby.games } ); 
			ws.send( msgout );
}catch(err) {
	console.log( "Callback failed:", err );
}
			break;
		case 'game':
			const oldGame = games.get( msg.name );
			if( oldGame ) {
				// send Reject
				const msgout = JSOX.stringify( { op:'game', fail:true } ); 
				ws.send( msgout );
			} else {
				const game = new Game( msg.name );
				games.set( msg.name, game );
				const userId = lobby.users.find( u=>u===user );
				if( userId >= 0 ) {
					lobby.users.splice( userId, 1 );
				}
				lobby.games.push( game );
				game.users.push( user );
				user.game = game;
				ws.send( hello );

			}
			break;
	        }
		
        }
        
}

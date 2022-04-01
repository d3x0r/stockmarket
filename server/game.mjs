
import {sack} from "sack.vfs";
import stocks from "./stocks.jsox"
import board from "./board.jsox"
Object.freeze( stocks.stocks );
stocks.stocks.forEach( stock=>Object.freeze(stock) );

import {Market} from "./market.mjs"
import {Lobby} from "./lobby.mjs"

const JSOX=sack.JSOX;

import {Game} from "./gameClass.mjs"
import {User} from "./user.mjs"

const lobby = new Lobby();

// lookup with username, gets user state
const users = new Map();

// create game with name
const games = new Map();

export function connect(ws) {
	//console.log( "Connect:", ws );
	const shared = { lastMessage : 0 };
	ws.onmessage = getHandler( ws, shared );
	ws.onclose = function() {
        	console.log( "Remote closed..." );
		clearTimeout( pingTimer );
	};

	let pingTimer =null;
	pingTick();
	function pingTick(){
		if( ws.readyState === 1 ) {
			let now = Date.now();
			if( (now - shared.lastMessage) >= 30000 )     {
				//console.log( "Ping", (now - ws.lastMessage) );
				ws.ping();
				shared.lastMessage = now;
			}
			
			pingTimer = setTimeout( pingTick, 30000 - (now - shared.lastMessage) );
		}
	}
	
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


let joinLobby = null;

function getHandler( ws, shared ) {
	const parser = JSOX.begin( dispatchMessage );
	
	let user = null;
	joinLobby = joinLobby_
	return parser.write.bind( parser );

        
        function dispatchMessage(msg) {
	try {           
		shared.lastMessage = Date.now();
	        switch( msg.op ) {
		case "username":
			const oldUser = users.get( msg.name );
			if( oldUser ) {
				oldUser.ws.close( 1000, "Reconnected from another terminal?" );

				oldUser.ws = ws;
				user = oldUser;
				if( oldUser.game ) {
					// resume game state; skip lobby
					const hello = JSOX.stringify( { op:"data", stocks:stocks, board:board, game:oldUser.game } );
					ws.send( hello );
					break;
				}
			}else {
				user = new User( msg.name );
				users.set( msg.name, user );
				user.ws = ws;

			}
			joinLobby_( user )
			
			break;
		case 'buy':
			{
				user.buy( msg.stock, msg.share );
				user.game.nextTurn();
			}
			break;
		case 'quit':
			user.quit();
			break;

		case 'roll':
			user.roll();
			break;

		case 'join':	
			{
				const oldGame = games.get( msg.name );
				if( oldGame ) {
					joinGame( user, oldGame );
				} else {
					const msgout = JSOX.stringify( { op:'game', fail:true } ); 
					ws.send( msgout );
				}	
			}
			break;
		case "color": {
				user.color = msg.color;
				if( user.game ) {
					const msgout = JSOX.stringify( {op:"color", name:user.name, color:msg.color } );
					for( let player of user.game.users ) {
						if( user === player ) continue;
						// tell everyone else in the game about the color change...
						player.ws.send( msgout );
					}
				} 
			}
			break;
		case "ready": {
				user.ready = true;
				const rdy = JSOX.stringify( { op:"ready", user:user } );
				for( let peer of user.game.users )	
					peer.ws.send( rdy );
			}
			break;			
		case "unready": {
				user.ready = false;
				const rdy = JSOX.stringify( { op:"unready", user:user } );
				for( let peer of user.game.users )	
					peer.ws.send( rdy );
			}
			break;			
		case "space": {				
				user.move( msg.space, msg.stock );
			}
			break;
		case "no-sale":
			console.log( "User did not buy; sending next turn" );			
			user.game.nextTurn();
			user.game.flush();
			break;
		case 'game': {
			const oldGame = games.get( msg.name );
			if( oldGame ) {
				// send Reject
				const msgout = JSOX.stringify( { op:'game', fail:true } ); 
				ws.send( msgout );
			} else {
				const game = new Game( msg.name );
				games.set( msg.name, game );
				const userId = lobby.users.findIndex( u=>u===user );
				if( userId >= 0 ) {
					const ur = lobby.users.splice( userId, 1 );
					
				}
				lobby.games.push( game );

				joinGame( user, game );

			}
			} 
			break;
	        }
		
	}catch(err){ console.log( "MessageError:", err);        }
        }

	function joinGame(user, game) {

		const userId = lobby.users.findIndex( u=>u===user );
		let thisuser = null;
		if( userId >= 0 ) {
			thisuser = lobby.users[userId];
			const ur = lobby.users.splice( userId, 1 );
			thisuser.reset();
		}

		const gameJoin = JSOX.stringify( { op:"player", user:thisuser } );
		// before adding this user, tell all old users about this new user.
		for( let user of game.users ) {
			user.ws.send( gameJoin );
		}

		game.users.push( user );
		user.game = game;

		const hello = JSOX.stringify( { op:"data", stocks:stocks, board:board, game:game } );
		user.ws.send( hello );

		// user leave lobby + add game to lobby
		const newMsg= JSOX.stringify( {op:"part", user:user } )  + JSOX.stringify( {op:"game", game:game } );  
		lobby.users.forEach( user=>{
			user.ws.send( newMsg );
		} );

	}
	function joinLobby_( user_ ) {
		
		//while in a game, the users and games isn't updated... so send the current list.
		if( !lobby.users.find( u=>u===user_ ) ) {
			const newMsg = JSOX.stringify( {op:'user',user:user_} );
			lobby.users.forEach( user=>user.ws.send(newMsg ) );
			lobby.users.push( user_ );
		}
		const msgout = JSOX.stringify( { op:'lobby', lobby:lobby.users, rooms:lobby.games } ); 
		user_.ws.send( msgout );
	}
}

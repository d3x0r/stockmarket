
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

export const lobby = new Lobby();

// lookup with username, gets user state
const users = new Map();

// create game with name
export const games = new Map();

export function connect(ws) {
	//console.log( "Connect:", ws );
	const shared = { lastMessage : 0 };
	const handler = ws.onmessage = getHandler( ws, shared );
	ws.onclose = function(code,reason) {
        	console.log( "Remote closed..." );
		handler.close( code, reason );
		clearTimeout( pingTimer );
	};

	let pingTimer =null;
	pingTick();
	function pingTick(){
		let now = Date.now();
		if( ws.readyState === 1 ) {
			if( (now - shared.lastMessage) >= 30000 )     {
				//console.log( "Ping", (now - ws.lastMessage) );
				ws.ping();
			}
			
		}
		shared.lastMessage = now;
		pingTimer = setTimeout( pingTick, 30000 - (now - shared.lastMessage) );
	}
	
}


export function accept( ws ) {
//		const protocol = ws.headers["Sec-WebSocket-Protocol"];
//		const url = ws.url;

	//console.log( "Connection received with : ", protocol, " path:", ws );
	this.accept();
};


export let joinLobby = null;

function getHandler( ws, shared ) {
	const parser = JSOX.begin( dispatchMessage );
	
	let user = null;
	joinLobby = joinLobby_

	const binding = parser.write.bind( parser );
	binding.close = doClose;
	return binding;

        
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
					let found = false;
					// resume game state; skip lobby
					for( let u = 0; u < user.game.users.length; u++ ) {
						const gameuser = user.game.users[u];
						if( gameuser === user ) {
							found = true;
						}
					}

					if( !found ) {
						// let the other people know... 
						// they get a whole user state to add to their game...
						const gameJoin = JSOX.stringify( { op:"player", user:user } );
						// before adding this user, tell all old users about this new user.
						for( let gameuser of user.game.users ) {
							gameuser.ws.send( gameJoin );
						}

						user.game.users.push( user );

					}
					// tell the player joining about the game.
					const hello = JSOX.stringify( { op:"data", stocks:stocks, board:board, game:oldUser.game } );
					ws.send( hello );
					// this user can never have been the current player.
					break;
				} else {
				}
			} else {
				// for some reason this makes me do a null for my name...
				user = new User( msg.name );
				users.set( msg.name, user );
				user.ws = ws;

			}
			joinLobby_( user )
			
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
				user.choosing = false; // made a choice.				
				user.move( msg.space, msg.stock, msg.stockDir );
			}
			break;
		case "buy":
			//console.log( "User bought; sending next turn", msg );
			user.buy( msg );
			break;
		case "sell":
			//console.log( "User sold something; unlocking selling mode?", msg );
			user.sell( msg );
			break;
		case "sale":
			//console.log( "User sold something; unlocking selling mode?", msg );
			user.sale( msg );
			break;
		case "selling":
			user.selling = true;
			const msgout = JSOX.stringify( {op:"selling", user:user.name }) ;
			for( let peer of user.game.users ) {
				if( peer != user )
					peer.ws.send( msgout );
			}
			break;
		case "bankrupt":
			user.reset();
			user.inPlay = user.game.inPlay;
			const newMsg = JSOX.stringify( {op:"quit", user:user.name } ) + JSOX.stringify( {op:"player", player:user } )
			user.game.nextTurn();
			for( let peer of user.game.users ) {
				peer.queue.push( newmsg );
			}
			user.game.flush();
			break;
		case "no-sale":
			console.log( "User did not buy; sending next turn" );			
			if( user.buying || user.selling ) {
				if( user.buying || user.selling )
					if( user.rolled )
						user.game.nextTurn();

				user.buying = user.selling = false;
				
				user.game.flush();
			}
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
				user.reset();

				const newMsg = JSOX.stringify( {op:"part", user:user.name } ) + JSOX.stringify( {op:"game", game:msg.name } )
				lobby.users.forEach( user=>{
					// tell everyone else in the lobby about the new game.
					user.ws.send( newMsg );
				} );

				joinGame( user, game );

			}
			} 
			break;
	        }
		
	}catch(err){ console.log( "MessageError:", err);        }
        }

	function doClose( code,reason ) {
		if( !user ) {
			console.log( "Wow, closed before even a login, rude..." );
			return;
		}
		const user_ = user?.name;
		//users.get( msg.name )
		if( user.game ) {
			const partGame = JSOX.stringify( {op:"quit", user:user_ } );
			for( let u = 0; u < user.game.users.length; u++ ) {
				const gameuser = user.game.users[u];
				if( gameuser != user ) {
					// tell the other people this guy left...
					gameuser.ws.send( partGame );
				} else  {
					// leave the game reference on the user, so we can keep their game status?
					user.game.users.splice( u, 1 );
					u--; // retry this element of the array.
				}
			}
		}else{
			const uid = lobby.users.findIndex( u=>u.name===user_ );
		console.log( "closed user was in lobby?", uid );
			if( uid >= 0 ) {                                                	
				lobby.users.splice( uid, 1 );
				// tell everyone in the lobby this guy left.
				const newMsg = JSOX.stringify( {op:'part',user:user_} );
				lobby.users.forEach( user=>user.ws.send(newMsg )  );
			}
		}
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

		// tell the lobby this player is leaving
		if( !user.game ) {
			const newMsg= JSOX.stringify( {op:"part", user:user.name } );  
			lobby.users.forEach( user=>{
				user.ws.send( newMsg );
			} );
		}

		user.reset();
		game.users.push( user );
		user.game = game; // setting user game sets inPlay to false.
		user.inPlay = game.inPlay;

		// tell the player joining the game about the game...
		const hello = JSOX.stringify( { op:"data", stocks:stocks, board:board, game:game } );
		user.ws.send( hello );

		// user leave lobby + add game to lobby

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

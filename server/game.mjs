
import {sack} from "sack.vfs";
import stocks from "./stocks.jsox"
import {Stock} from "../ui/stock.mjs"
import {StockSpace} from "../ui/stockSpace.mjs"
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
	bank = 1500000; // 1.5m total cash?(config!)
	#stocks = stocks.stocks.map( stock=>(new Stock(stock)) )
	#spaces = [];

	constructor(name) {
		this.name = name;
		for( let space of board.spaces ) {
			new StockSpace( {stocks:this.#stocks,spaces:this.#spaces } 
				,space );
		};
	}
	roll() {
		const d1 = Math.floor( Math.random() * 6 + 1 );
		const d2 = Math.floor( Math.random() * 6 + 1 );
		const msg=`{op:roll,count:${d1+d2}}`;
		for( let user of this.users ) {
			user.ws.send( msg );
		}
	}
}

class UserStock {
	id = 0;
	shares = 0;
	#stock = null;
	constructor(stock) { this.#stock = stock; this.id = stock.id; } 
}

class User { 
	name = '';

	stocks = stocks.stocks.map( stock=>(new Stock(stock)) )
	cash = 0;
	space = 0;

	#ws = null;
	#game = null;

	get game() { return this.#game; }
	set game(val) { this.#game=val; }
	get ws() { return this.#ws; }
	set ws(val) { this.#ws=val; }

	constructor( name ) {
		this.name = name;
	}

	modStock( id, val ) {
		const peers = this.#game.users;
		for( let peer of peers ) {
			peer.ws.send( {op:"stock", user:user.name, stock:id, shares:val } );
		}
		this.stocks.find( (stock)=>{
			if( stock.id === id ) {
				stock.shares += val;
				return true;
			}
		} );
	}

	

	sendMoney( val ) {
		const peers = this.#game.users;
		for( let peer of peers ) {
			peer.ws.send( {op:"money", user:user.name, cash:val } );
		}
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
	//try {
	        switch( msg.op ) {
		case "username":
			const oldUser = users.get( msg.name );
			if( oldUser ) {
				oldUser.ws.close( 1000, "Reconnected from another terminal?" );

				oldUser.ws = ws;
				user = oldUser;
				if( oldUser.game ) {
					// resume game state; skip lobby
					const hello = JSOX.stringify( { op:"data", stocks:stocks, board:board, players:oldUser.game.users } );
					ws.send( hello );
					break;
				}
			}else {
				user = new User( msg.name );
				users.set( msg.name, user );
				user.ws = ws;

				joinLobby( user )
			}
			
			const msgout = JSOX.stringify( { op:'lobby', lobby:lobby.users, rooms:lobby.games } ); 
			ws.send( msgout );
			break;

		case 'quit':
			{
				const partGame = JSOX.stringify( {op:"quit", user } );

				const userId = user.game.users.findIndex( u=>u===user );
				if( userId >= 0 ) {
					user.game.users.splice( userId,1 );
					
				}
				// after leaving the game, tell the remaining guys someone quit.
				user.game.users.forEach( user=>user.ws.send( partGame ) );

				user.game = null;
				joinLobby( user );
			}
			break;

		case 'roll':
			{
				user.game.roll();
			}
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
		
	//}catch(err){ console.log( "MessageError:", err);        
        }

	function joinGame(user, game) {

		const userId = lobby.users.findIndex( u=>u===user );
		if( userId >= 0 ) {
			const ur = lobby.users.splice( userId, 1 );
			
		}
		game.users.push( user );
		user.game = game;

		const hello = JSOX.stringify( { op:"data", stocks:stocks, board:board, players:game.users } );
		user.ws.send( hello );

		// user leave lobby + add game to lobby
		const newMsg= JSOX.stringify( {op:"part", user:user } )  + JSOX.stringify( {op:"game", game:game } );  
		lobby.users.forEach( user=>{
			user.ws.send( newMsg );
		} );

	}
	function joinLobby( user ) {
		const newMsg = JSOX.stringify( {op:'user',user:user} );
		lobby.users.forEach( user=>{
			user.ws.send(newMsg );
		});
		lobby.users.push( user );
	}
}


import {sack} from "sack.vfs";
import stocks from "./stocks.jsox"
import {Stock} from "../ui/stock.mjs"
import {StockSpace} from "../ui/stockSpace.mjs"
import board from "./board.jsox"
Object.freeze( stocks.stocks );
stocks.stocks.forEach( stock=>Object.freeze(stock) );

class Market {
	stocks = [];
	// precomputes market lines from stock information
	constructor(stockList) {
		const stages = stocks.stages;

		for( let s = 0; s < stockList.length; s++ ) {
			const stock = stockList[s];
			const marketLines = Array.from( {length:stages*2+1} );
			const values = stockList.map( s=>s.minimum );
			this.stocks.push( { id:stock.id, lines:marketLines } );
			for( let line = 0; line <= stages; line++ ) {
				let staging = stock.staging[0];
				let val;
				if( line > stocks.secondStagingStarts ) {

				        const effectivestage = line - stocks.secondStagingStarts;
					const val1 = stocks.secondStagingStarts * stock.staging.one.num / stock.staging.one.den ;
					const val2 = effectivestage * stock.staging.two.num / stock.staging.two.den ;
						
					marketLines[stages+(stock.inversed?-1:1)*line] = stock.baseline + ((val1+val2)|0);
					marketLines[stages-(stock.inversed?-1:1)*line] = stock.baseline - ((val1+val2)|0);
				}
				else {
					const val1 = line * stock.staging.one.num / stock.staging.one.den ;
				
					marketLines[stages-(stock.inversed?-1:1)*line] = stock.baseline - ((val1)|0);
					if( line )
						marketLines[stages+(stock.inversed?-1:1)*line] = stock.baseline+(val1)|0;
				}
				
			}
			
		}
	console.log( "market:", this );
	}



}

const JSOX=sack.JSOX;

class Lobby {
	users = [];
	games = [];
	constructor() {
	}
}


class Game {
	users = [];
	currentPlayer = 0;
	name = '';

	bank = 1500000; // 1.5m total cash?(config!)
	marketLine = 0;

	#stocks = stocks.stocks.map( stock=>(new Stock(this,stock)) )
	#spaces = [];
	#starts = [];
	
	market = new Market( this.#stocks );

	constructor(name) {
		this.name = name;
		for( let space of board.spaces ) {
			new StockSpace( {stocks:this.#stocks,spaces:this.#spaces } 
				,space );
		};
		
		for( let space of this.#spaces ) {
			if( space.start ) 
				this.#starts.push( {space:space.id,stock:null} );
	
		} 
		console.log( "STARTS?", this.#starts );
	}
	roll(forUser) {
		//console.log( "Current:", this.currentPlayer, this.users
		if( forUser !== this.users[this.currentPlayer] ) return;
	
		const d1 = Math.floor( Math.random() * 6 + 1 );
		const d2 = Math.floor( Math.random() * 6 + 1 );
		const msg=`{op:roll,count:${d1+d2},d1:${d1},d2:${d2}}`;
		for( let user of this.users ) {
			user.ws.send( msg );
		}
		
		this.play( forUser, d1+d2 );
	}
	pickStart() {
		for( let i = 0; i < this.users.length; i ++ ) {
			const swap = Math.floor( Math.random() * this.users.length );
			if( swap != i ) {
				const old = this.users[swap];
				this.users[swap] = this.users[i];
				this.users[i] = old;				
			}
			
		}
		const someUser = this.currentPlayer = Math.floor( Math.random() * this.users.length );
		const msg=JSOX.stringify( {op:"start", name:this.users[someUser].name } );
		for( let user of this.users ) {
			user.ws.send( msg );
		}
	}

	move(name, spaceId, stockId ) {
		const space = this.#spaces.find( space=>space.id === spaceId );
		if( space ) { // there really better be a space, an else can not be caught in coverage; without state/protocol hacks
			const msg=JSOX.stringify( {op:"space", name, id:spaceId } );
			let go = false;
			for( let user of this.users ) {
				// send update to everyone
				user.ws.send( msg );  // skip the user?
			}
			const thisPlayer = this.users[this.currentPlayer];
			if( space.start ) {
				if ((!thisPlayer.space) || thisPlayer.space_.job ){
				} else {
					thisPlayer.charge( board.startFee );
				}
			}

			if( space.market ) {
				this.moveMarket( space.market );
			}

			if( space.broker ) {
				const shares = thisPlayer.stocks.reduce(  ( (acc,r)=>acc+=r.shares ), 0 );
				const fee = shares * board.brokerFee;
				thisPlayer.pay( fee );
				if( fee > thisPlayer.cash ) {
					go = true;
				} else {
					thisPlayer.ws.send( "{op:fee,amount:"+fee+"}" );
				}
			}

			// holders meeting
			if( space.split ) {
				for( let stock of thisPlayer.stocks ) {
					if( thisPlayer.meeting === stock.id ) {
						const shares = Math.floor( stock.shares * space.split[0] / space.split[1] );
						// pay player amount of shares * min
						thisPlayer.give( stock.id, shares );
						break;
					}
				}
				go = true;
			}

			if( space.sell ) {				
				for( let stock of thisPlayer.stocks ) {
					if( space.stock.id === stock.id ) {
						const cost = stock.shares * space.stock.minimum;
						// pay player amount of shares * min
						thisPlayer.pay( cost );
						thisPlayer.take( stock.id, stock.shares );
						break;
					}
				}
				go = true;
			} else if( space.stock ) {
				for( let stock of thisPlayer.stocks ) {
					if( space.stock.id === stock.id ) {
						const div = stock.dividend * stock.shares;
						thisPlayer.pay( div );
						break;
					}
				}				
			}

			if( go )
				this.nextTurn();

			this.flush();
			return space;
		}
		
	}


	flush() {
		// flush game changes to players
		for( let player of this.users ) {
			const q = player.queue;
			if( q.length ) {
				player.ws.send( q.join('') );
				q.length = 0;
			}
		}
	}
	play( user, number ) {
		//const user = this.users
		const space = user.space_;
		{
			let workers = 0;
			const paid = [];
			for( let player of this.users ) {
				if( !player.space ) continue;
				const space = player.space_;
				if( !space.job ) continue;
				workers++;
				const roll = space.onRoll;
				if( roll.includes(number) ) {
					player.pay( space.pay );
					paid.push( player );
				}
			}
			if( workers && paid.length ) {
				for( let player of this.users ) {
					if( user === player 
					   && player.cash >= board.minCash 
					   && player.space_.job ) {
						player.queue.push( JSOX.stringify( {op:"choose", choices:this.#starts } ) );						
					}
					//player.queue.push( msg );
				}
			}
		} 

		if( space ) {
			if( space.job ) {
				// user is currenty on a job, there is no update to position.
				this.nextTurn();
			} else if( space.start ) {
				if( number & 1 ) { // is odd 
					this.getMoves( user, space, number, false );
				} else {
					this.getMoves( user, space, number, true );
				}
			} else {
				if( space.leaveLeft ) {
					this.getMoves( user, space, number, true );
				} else if( space.leaveRight ) {
					this.getMoves( user, space, number, false );
				} else {
					this.getMoves( user, space, number, user.movingLeft );
				}
			}
		} else {
			// player doesn't have any choices... (isn't even on the board)
			this.nextTurn();
		}

		this.flush();
	}

	moveMarket( by ) {
		this.marketLine += by;
	        let bounced;
		do {
			bounced = false;
			if( this.marketLine > stocks.stages ) {
				this.marketLine = stocks.stages*2 - this.marketLine;
				bounced = true;
			}
			if( this.marketLine < -stocks.stages ) {
				this.marketLine = -stocks.stages*2 - this.marketLine;
				bounced = true;
			}
		} while( bounced );
		
		const msg = JSOX.stringify( {op:"market", line:this.marketLine+stocks.stages } );
		if( msg ) for( let peer of this.users ) peer.queue.push(msg);
	}

	getMoves( user, space, number, left ) {
		// gets what moves a player can do, and tells that player.
		let choices = [{stock:space.stock?.id||0,space:space,dir:left}];
		{
			let n = 0;
			while( number-- ) {
				for( let c =0; c < choices.length; c++ ) {
					const was = choices[c].space;
					if( choices[c].dir )
						choices[c].space = choices[c].space.left;
					else
						choices[c].space = choices[c].space.right;
					if( number ) // have to have at least 1 more move after this to start this chain.
						if( !was.split && choices[c].space.meeting ) { // don't go back into a meeting
							choices.push( {stock:choices[c].space.stock, space:choices[c].space.meeting,dir:space.meetingDirection} );
						}
				}
			}
		}		
		if( user ) 
			user.ws.send( JSOX.stringify( {op:"choose", choices:choices.map( choice=>({ space:choice.space.id, stock:choice.stock.id }) ) } ) );
		return ;
	}

	nextTurn() {
		this.currentPlayer++;
		if( this.currentPlayer >= this.users.length )
			this.currentPlayer = 0;
		const msg=JSOX.stringify( {op:"turn", name:this.users[this.currentPlayer].name, current:this.currentPlayer } );
		for( let user of this.users ) {
			user.queue.push( msg );
		}
	}
	
}

class UserStock {
	id = 0;
	shares = 0;
	#stock = null;
	constructor(stock) { this.#stock = stock; this.id = stock.ID; } 
}

class User { 
	name = '';
	#ready = false;
	stocks = stocks.stocks.map( stock=>(new UserStock(stock)) )
	cash = 1000;
	space = 0;
	movingLeft = true;
	inPlay = false;
	meeting = 0;

	#queue = [];
	#ws = null;
	#game = null;
	#space_ = null;
	
	get queue() { return this.#queue; }

	get space_() { return this.#space_}
	get ready(){ return this.#ready }
	set ready(val){
		this.inPlay = val; // sort of a duplicate ready status that is returned on state reload.
		if( val ) {
			this.#ready = true;
			if( this.#game && ( !this.#game.inPlay ) ) {
				for( let user of this.#game.users ) {
					if( !user.ready ) return;
				}
				this.#game.inPlay = true;	
				const gomsg = '{op:go}';  // this clears the wait message
				for( let user of this.#game.users ) {
					user.ws.send( gomsg );
				}
		
				this.#game.pickStart();
			} else {
				const msg=JSOX.stringify( {op:"turn", name:this.#game.users[this.#game.currentPlayer].name, current:this.#game.currentPlayer } );
				this.ws.send( msg ); // inform of current turn.
				
			}
		} else {
			this.#ready = false;
		}
	}
	get game() { return this.#game; }
	set game(val) { this.#game=val; }
	get ws() { return this.#ws; }
	set ws(val) { this.#ws=val; }

	constructor( name ) {
		this.name = name;
	}

	reset() {
		// when joining a new game, clear player state.
		this.#ready = false;
		this.cash = 0;
		this.space = 0;
		for( let stock of this.stocks ) {
			stocks.shares = 0;
		}
	}

	pay( cash ) {
		// that this is done is sent later with this updated balance.
		console.log( "CASH Change:", this, cash );
		this.cash += cash;
		const msg = JSOX.stringify( {op:"pay",user:this.name, balance:this.cash, credit:this.#space_.pay } )
		if( msg ) for( let peer of this.game.users ) peer.queue.push(msg);
	}

	take( stockId, shares ) {
		let msg;
		for( let stock of this.stocks ) {
			if( stock.id === stockId ) {
				stock.shares -= shares;
				msg = JSOX.stringify( {op:"take", user:this.name, stock:stockId, balance:stock.shares, shares } );
				break;
			}
		}
		if( msg ) for( let peer of this.game.users ) peer.queue.push(msg);
	}

	give( stockId, shares ) {
		let msg;
		for( let stock of this.stocks ) {
			if( stock.id === stockId ) {
				stock.shares += shares;
				msg = JSOX.stringify( {op:"give", user:this.name, stock:stockId, balance:stock.shares, shares } );
				break;
			}
		}
		if( msg ) for( let peer of this.game.users ) peer.queue.push(msg);
	}

	roll() {
	
		return this.game.roll(this);
	}

	move( spaceId, stockId ) {
		this.space = spaceId;
		this.#space_ = this.game.move( this.name, spaceId, stockId );
	}

	rename(newname) {
		const msg = JSOX.stringify( {op:"rename", oldname:this.name, newname:newname } );
		this.name = newname;
		// send to lobby and everywhere I am...
		const list = ( !this.#game )? lobby.users: this.#game.users;

		for( let peer of list ) {
			if( user != this ) {
				user.ws.send( msg );
			}
		}
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

	buy( stockId, shares ) {
		this.stocks.find( (stock)=>{
			
			if( stock.id === stockId ) {
				stock.shares += shares;
				
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

	quit() {

		if( this.#game ) {
			const partGame = JSOX.stringify( {op:"quit", user:this.name } );
			const peers = this.#game.users;
			let pid = -1;
			for( let p = 0; p < peers.length; p++ ) {
				const peer = peers[p];
				if( peer === this ) {
					if( p === this.#game.currentPlayer ) {
						this.#game.turn();
					}
					pid = p;
					continue;
				}
				peer.ws.send( partGame );
			}
			// fix next current player.
			if( this.#game.currentPlayer > pid ) this.#game.currentPlayer--;
			// removed from game, and game removed from this...
			peers.splice( pid, 1 );
			if( !peers.length ) {
				// when there's no more players in the game, delete it.
				games.delete( this.#game.name );
				const msg = JSOX.stringify( {op:"delete", game:this.#game.name } );
				for( let player of lobby.users ) {
					player.ws.send( msg );
				}
				const gameId = lobby.games.findIndex( game=>game === this.#game );
				if( gameId >= 0 ) {
					lobby.games.splice( gameId, 1 );
				}
			}
			
			this.#game = null;
			/* reset player */
			this.inPlay = false;
			this.space = 0;
			this.cash = 1000;
			this.stocks.forEach( stock=>stock.shares = 0 );
			
			joinLobby( this );
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


let joinLobby = null;

function getHandler( ws ) {
	const parser = JSOX.begin( dispatchMessage );
	
	let user = null;
	joinLobby = joinLobby_
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
		
	//}catch(err){ console.log( "MessageError:", err);        
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
			const newMsg = JSOX.stringify( {op:'user',user:user} );
			lobby.users.forEach( user=> user.ws.send(newMsg ) );
			lobby.users.push( user );
		}
		const msgout = JSOX.stringify( { op:'lobby', lobby:lobby.users, rooms:lobby.games } ); 
		user_.ws.send( msgout );
	}
}

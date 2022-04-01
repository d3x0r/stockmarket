
import stocks from "./stocks.jsox"
import board from "./board.jsox"



class UserStock {
	id = 0;
	shares = 0;
	#stock = null;
	constructor(stock) { this.#stock = stock; this.id = stock.ID; } 
}

export class User { 
	name = '';
	#ready = false;
	stocks = stocks.stocks.map( stock=>(new UserStock(stock)) )
	cash = board.startCash;
	space = 0;
	movingLeft = true;
	inPlay = false;
	meeting = 0;
	color = Math.floor(Math.random()*8);

	#queue = [];
	#ws = null;
	#game = null;
	#space_ = null;
	#turn = false;

	set moveEndsTurn( val) {
		this.#turn = val;
	}	
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
		this.cash = board.startCash;
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
				if( peers.length > 1 )
					if( peer === this ) {
						if( p === this.#game.currentPlayer ) {
							this.#game.nextTurn();
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
			this.cash = 0;
			this.stocks.forEach( stock=>stock.shares = 0 );
			
			joinLobby( this );
		}
	}
	
}

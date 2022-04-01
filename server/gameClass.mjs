
import stocks from "./stocks.jsox"
import board from "./board.jsox"


import {Stock} from "../ui/stock.mjs"
import {StockSpace} from "../ui/stockSpace.mjs"

import {Market} from "./market.mjs"
import {Lobby} from "./lobby.mjs"



export class Game {
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
					this.nextTurn();
				} else {
					thisPlayer.charge( board.startFee );
					if( thisPlayer.cash > 0 ) this.nextTurn();
				}
			}

			if( space.market ) {
				this.moveMarket( space.market );
			}

			if( space.broker ) {
				const shares = thisPlayer.stocks.reduce(  ( (acc,r)=>acc+=r.shares ), 0 );
				const fee = shares * board.brokerFee;
				thisPlayer.pay( fee );
				if( thisPlayer.cash > 0 ) {
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
						this.flush();
						return;
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
		this.marketLine -= stocks.stages;
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
		this.marketLine += stocks.stages;
		
		const msg = JSOX.stringify( {op:"market", line:this.marketLine } );
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
		const thisUser = this.users[this.currentPlayer];
		const msg=JSOX.stringify( {op:"turn", name:thisUser.name, current:this.currentPlayer } );
		for( let user of this.users ) {
			user.queue.push( msg );
		}
		if( thisUser.space_.job && thisUser.cash > board.minCash ) {
			thisUser.queue.push( JSOX.stringify( {op:"choose", choices:this.#starts } ) );						
		}
	}
	
}

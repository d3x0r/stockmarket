
const pendingMeetings = [];   // the actual meeting points aren't created until after the entrances...

export class StockSpace {
	mode = null;
	def = null;
	id = 0;
	pay = 0;
	job = false;
	onRoll = null;
	stock = null;
	leaveLeft = false;
	leaveRight = false;
	right = null;
	left = null;
	size = null;
	position = null;
	market = 0;
	direction = 0; // draw normal flat left-right sorta
	broker = false;
	
	holders = null; // array
	meeting = null; // space pointer
	meetingDirection = true; // left/right

	constructor( board, space ) {
		
		this.def = space;
		this.id = space.id;
		if( "market" in space ) {
			this.market = space.market;
		}
		if( "stock" in space ) {
			this.stock = board.stocks.find( s=>s.id==space.stock );
			if( "holders" in space ) {
				this.holders = space.holders;
				this.meeting = board.spaces.find( s=>(s.id === this.holders[0] ) );
				if( !this.meeting ) pendingMeetings.push( this );
				this.meetingDirection = this.holders[1]<0;// convert to bool  (reverse value)			
			}
		}
		if( "label" in space ) {
			this.label = space.label;
			this.pay = space.pay;
			this.onRoll = space.on;
		}
		this.position = space.position;
		this.size = space.size;
		this.color = space.color;
		if( "align" in space )
			this.direction = ( space.align.includes( "right" )?1:space.align.includes( "left")?0:( space.align.includes( "down" )?3:/*up*/2 )) 

		if( "left" in space ) {
			this.left = board.spaces.find( s=>(s.id === space.left ) );
			if( this.left && !this.left.right ) this.left.right = this;
		}
		if( "right" in space ) {
			this.right = board.spaces.find( s=>(s.id === space.right ) );
			if( this.right && !this.right.left ) this.right.left = this;
		}

		if( "leaveLeft" in space ) {
			this.leaveLeft = space.leaveLeft;
		}
		if( "leaveRight" in space ) {
			this.leaveRight = space.leaveRight;
		}

		for( let i = 0; i < pendingMeetings.length; i++ ) {
			if( pendingMeetings[i].holders[0]=== this.id ) {
				pendingMeetings[i].meeting = this;
				pendingMeetings.splice(i,1);
				break;
			}
		}

		if( space.start ) {
			this.start = true;
		} else if( space.roll ) {
			// roll the dice.
			this.roll = true;
		} else if( space.quit ) {
			// quit the game.
			this.quit = true;
		} else if( space.sellStocks ) {
			this.sellStocks = true;
		} else if( space.center ) {
			this.job = true;
		} else if( space.broker ) {
			this.broker = true;	
		} else if( space.sell ) {
			this.sell = true;
		} else if( space.split ) {
			this.split = space.split.split('/');		
		}
		
		if( board.handleStart ) {
	
			if( space.start ) {
				this.mode = board.handleStart.bind( board, this );
			} else if( space.center ) {
				// pay prospector...
				this.mode = board.handlePay.bind( board, this );
					
			} else if( space.roll ) {
				// roll the dice.
				this.mode = board.handleRoll.bind( board, this );
			} else if( space.quit ) {
				// quit the game.
				this.mode = board.handleQuit.bind( board, this );
			} else if( space.split ) {
				// quit the game.
				this.mode = board.handleSplit.bind( board, this );
			} else if( space.sellStocks ) {
				// sell some stocks...
				this.mode = board.handleSellStocks.bind( board, this );
				/* click space*/
			} else if( space.broker ) {
				this.mode = board.handleBroker.bind( board, this );
			} else if( space.sell ) {
				this.mode = board.handleSell.bind( board, this );
			}else {
				this.mode = board.handleSpace.bind( board, this );
			}
		}
		board.spaces.push( this );
	}
}

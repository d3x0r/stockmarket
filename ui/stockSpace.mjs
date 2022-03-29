

export class StockSpace {
	mode = null;
	def = null;
	id = 0;
	pay = 0;
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
	
	constructor( board, space ) {
		
		this.def = space;
		this.id = space.id;
		if( "market" in space )
			this.market = space.market;
		if( "stock" in space ) {
			this.stock = board.stocks.find( s=>s.id==space.stock );
			if( "holders" in space )
				this.holders = space.holders;
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
			if( this.left ) this.left.right = this;
		}
		if( "right" in space ) {
			this.right = board.spaces.find( s=>(s.id === space.right ) );
			if( this.right ) this.right.right = this;
		}

		if( "leaveLeft" in space ) {
			this.leaveLeft = space.leaveLeft;
		}
		if( "leaveRight" in space ) {
			this.leaveRight = space.leaveRight;
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
		} else if( space.broker ) {
			this.broker = true;	
		} else if( space.sell ) {
			this.sell = true;
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
				this.split = space.split.split('/');
				
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

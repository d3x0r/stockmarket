

import * as protocol from "./gameProtocol.js"
import {GameWait} from "./gameWait.js" 
import {Stock} from "./stock.mjs" 
import {StockSpace} from "./stockSpace.mjs" 
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"

function makeGameBoard( gameBoard, ctx, overlayCtx ) {
	const gameState = protocol.gameState;

	const board = new Board( gameState.board, gameState.stocks, overlayCtx );
	
	console.log( "Draw a new board:", board );
	board.draw( ctx );

              new GameWait( gameBoard )
        return board;
}

export class GameBoard extends Popup {

	board = null;

	constructor(form) {
		super( "Stock Market", form );
        
		const gameBoard = this.gameBoard = document.createElement( "canvas" );
		gameBoard.width = 4096;
		gameBoard.height = 4096;
		//gameBoard.style.position="relative";
		gameBoard.style.width = "90vh";
		gameBoard.style.height = "90vh";
		
		this.gameCtx = gameBoard.getContext( "2d" );

		const gameBoardOverlay = this.gameBoardOverlay = document.createElement( "canvas" );
		gameBoardOverlay.width = 4096;
		gameBoardOverlay.height = 4096;
		gameBoardOverlay.style.position="absolute";
		gameBoardOverlay.style.left="12px";
		gameBoardOverlay.style.width = "90vh";
		gameBoardOverlay.style.height = "90vh";
		
		this.gameCtxOverlay = gameBoardOverlay.getContext( "2d" );
	

		this.appendChild( this.gameBoard );
		this.appendChild( this.gameBoardOverlay );
		this.board = makeGameBoard( this, this.gameCtx, this.gameCtxOverlay );


		this.gameBoardOverlay.addEventListener( "mousemove", (evt)=>this.mousemove(event) );
		this.gameBoardOverlay.addEventListener( "mouseup", (evt)=>this.mouseup(event) );
		this.gameBoardOverlay.addEventListener( "mousedown", (evt)=>this.mousedown(event) );
	}


	mousemove(evt){
		var rect = this.gameBoard.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;
		
		const xr = x* 26  / rect.width ;
		const yr = y * 26 / rect.height;

		const isIn = this.board.selected.find( space=>{
			return( xr >= space.position[0] && yr >= space.position[1] &&
				xr <= ( space.position[0]+space.size[0] ) && yr <= ( space.position[1]+space.size[1] ) )
		} );
		this.board.setActive( isIn );
	}
}


export class Board {
	spaces = [];
	random = true;
	stocks = [];
	modeHandlers = {};
	ctx = null; // overlay context
	waiter = null;
	hover = null;
	constructor( board, stocks, ctx ) {
		this.ctx = ctx;
		stocks.stocks.forEach( stock=>{
			this.stocks.push( new Stock(stock) );	
		} );
		board.spaces.forEach( (space)=>new BoardSpace( this, space ) );		

		//this.waiter = new GameWait( this );

		this.addHighlight( this.spaces[0] );
		this.addHighlight( this.spaces[1] );
		this.addHighlight( this.spaces[2] );
		this.addHighlight( this.spaces[3] );
		

	}

	setActive( space ) {
		if( this.hover === space ) return;
		if( !space ) {
			if( this.hover ) {
				this.hover = null;
				this.animate();
			}
			return;
		} else {
			if( this.hover ) {
				
			}
			this.hover = space;
			this.animate();
		}
	}

	draw( ctx ) {
		for( let space of this.spaces ) space.draw( ctx );

		//this.spaces[3].drawHighlight( this.ctx );
	}

	selected =  [];
	timer = null;

	animate(n) {
		if( !this.timer )
			this.timer = setTimeout(  ()=>{
				this.timer = 0;
				this.animate( true )
			}, 500 );
		
		this.ctx.clearRect( 0, 0, 4096, 4096 );
		this.selected.forEach( space=>{if( space === this.hover ) return;space.drawHighlight( n, this.ctx ) });

		if( this.hover )
			this.hover.drawHover( this.ctx );

	}

	addHighlight( space ) {
		
		if( this.selected.push( space ) == 1) {
			if( !this.timer ) this.animate(false);

		}
	}


	handleRoll( space ) {
	}
	handleSellStocks( space ) {
	}
	handleQuit( space ) {
	}
	handleSell( space ) {
	}
	handlePay( space ) {
	}
	handleStart( space ) {
	}
	handleBroker( space ) {
	}
	handleSpace( space ) {
	}

	handleSplit( space ) {
	}
}

const xScale = (x)=>x / 26 * 4096;
const yScale = (x)=>x / 26 * 4096;

class BoardSpace extends StockSpace {


	timer = 0;
	state = 0;

	drawHover( ctx ) {
			ctx.shadowBlur = 120;
			ctx.shadowColor = "green";
			ctx.strokeStyle = "gold";
			ctx.lineWidth = 8;
			ctx.fillStyle="#33333330";

		ctx.strokeRect( xScale(this.position[0]), yScale(this.position[1]),xScale(this.size[0]), yScale(this.size[1]) );
		ctx.fillRect( xScale(this.position[0]), yScale(this.position[1]),xScale(this.size[0]), yScale(this.size[1]) );

	}

	drawHighlight( change, ctx ) {
		if( change )
			this.state = 1-this.state;
		if( this.state ) {
			ctx.shadowBlur = 120;
			ctx.shadowColor = "gold";
			ctx.strokeStyle = "gold";
			ctx.lineWidth = 8;
			ctx.fillStyle="#33333330";
		} else {
			ctx.shadowBlur = 0;
			ctx.shadowColor = null;
			ctx.strokeStyle = "red";
			ctx.lineWidth = 8;
			ctx.fillStyle="transparent";
		}
		ctx.strokeRect( xScale(this.position[0]), yScale(this.position[1]),xScale(this.size[0]), yScale(this.size[1]) );
		ctx.fillRect( xScale(this.position[0]), yScale(this.position[1]),xScale(this.size[0]), yScale(this.size[1]) );

	}

	draw( ctx ) {
		ctx.strokeStyle = "black";
		ctx.lineWidth = 8;
		if( this.stock )
			ctx.fillStyle = this.stock.color;
		else {
			if( this.color )
				ctx.fillStyle = this.color;
			else ctx.fillStyle = "white";
		} 

		ctx.fillRect( xScale(this.position[0]), yScale(this.position[1]),xScale(this.size[0]), yScale(this.size[1]) );
		ctx.strokeRect( xScale(this.position[0]), yScale(this.position[1]),xScale(this.size[0]), yScale(this.size[1]) );

		ctx.save();
		ctx.textAlign= "center";


		if( this.pay ) {
		}
		ctx.font = "80px Arial";
		ctx.fillStyle = "black";

			switch( this.direction ) {
			case 0:
			default:
				ctx.translate( xScale(this.position[0]) + xScale(this.size[0]/2), yScale(this.position[1]) + yScale(this.size[1]/2) );
				ctx.rotate( 0 );
				break;
			case 2:
				ctx.translate( xScale(this.position[0])  +  xScale(this.size[0]/2), yScale(this.position[1]) +  yScale(this.size[1]/2) );
				ctx.rotate( Math.PI / 2 );

				break;
			case 1:
				ctx.translate( xScale(this.position[0]) + xScale(this.size[0]/2), yScale(this.position[1]) +  yScale(this.size[1]/2) );
				ctx.rotate( Math.PI*2 / 2 );

				break;
			case 3:
				ctx.translate( xScale(this.position[0]) + xScale(this.size[0]/2), yScale(this.position[1]) +  yScale(this.size[1]/2) );
				ctx.rotate( Math.PI*3 / 2 );

				break;
			}  

		if( this.stock ) {


			ctx.fillText( this.stock.symbol, 0, -yScale(this.size[1]/4) );
			if( this.sell ) {
				ctx.fillText( "Sell", 0, xScale(0.15) );
			}
			if( this.holders ) {
				ctx.fillText( "Limit 1", 0, xScale(0.15) );
				ctx.font = "40px Arial";
				if( this.holders[1] > 0 ) {
					ctx.fillText( this.stock.stock + " Holders Meeting", xScale(3.15), -yScale(1.125) );
					ctx.beginPath();
					ctx.moveTo( xScale(1.5)               , -yScale(2.25)+yScale(this.size[1]*3/8) );
					ctx.lineTo( xScale(2.5)                , -yScale(2.25)+yScale(this.size[1]*3/8) );
					ctx.lineTo( xScale(2.5) - xScale(0.15) , -yScale(2.25)+yScale(this.size[1]*3/8) + yScale( 0.15 ) );
					ctx.moveTo( xScale(2.5)                , -yScale(2.25)+yScale(this.size[1]*3/8) );
					ctx.lineTo( xScale(2.5) - xScale(0.15) , -yScale(2.25)+yScale(this.size[1]*3/8) - yScale( 0.15 ) );
					ctx.stroke();
					
				} else {
					ctx.fillText( this.stock.stock + " Holders Meeting", -xScale(3.15), -yScale(1.125) );
					ctx.beginPath();
					ctx.moveTo( -xScale(1.5)               , -yScale(2.25)+yScale(this.size[1]*3/8) );
					ctx.lineTo( -xScale(2.5)                , -yScale(2.25)+yScale(this.size[1]*3/8) );
					ctx.lineTo( -xScale(2.5) + xScale(0.15) , -yScale(2.25)+yScale(this.size[1]*3/8) + yScale( 0.15 ) );
					ctx.moveTo( -xScale(2.5)                , -yScale(2.25)+yScale(this.size[1]*3/8) );
					ctx.lineTo( -xScale(2.5) + xScale(0.15) , -yScale(2.25)+yScale(this.size[1]*3/8) - yScale( 0.15 ) );
					ctx.stroke();
				}
			}
			//ctx.strokeText( this.stock.symbol, 0, 0 );

//			ctx.fillText( this.stock.symbol, xScale(this.position[0] ), xScale( this.position[1]) );
//			ctx.strokeText( this.stock.symbol, xScale(this.position[0] ), xScale( this.position[1]) );
		}
		        if( this.pay ) {
				ctx.fillText( `${this.label}`, 0, -yScale(this.size[1]/4) );
				ctx.fillText( `Pays ${'$'+this.pay}`, 0, -yScale(this.size[1]*0/4) );
				ctx.fillText( `on ${this.onRoll[0]} or ${this.onRoll[1]}`, 0, yScale(1) );
			}
			if( this.broker ) {
				ctx.fillText( "Broker", 0, -yScale(this.size[1]/4) );
			}
			if( this.split ) {
				ctx.fillText( `${this.split[0]} to ${this.split[1]}`, 0, 0 );
			}
			if( this.start ) {
				ctx.fillStyle = "red";
				ctx.fillText( "Start", 0, 0 );
				ctx.fillStyle = "black";
				ctx.font = "50px Arial";
				ctx.fillText( "Even", -xScale(this.size[0]/4 ), yScale(this.size[1]/4));
				ctx.fillText( "Odd", +xScale(this.size[0]*1/4 ), yScale(this.size[1]/4));
				ctx.font = "80px Arial";

				ctx.beginPath();
				ctx.moveTo( xScale(0.05), +yScale(this.size[1]*3/8) );
				ctx.lineTo( xScale(0.5), +yScale(this.size[1]*3/8) );
				ctx.lineTo( xScale(0.5) - xScale(0.15), +yScale(this.size[1]*3/8) + yScale( 0.15 ) );
				ctx.moveTo( xScale(0.5), +yScale(this.size[1]*3/8) );
				ctx.lineTo( xScale(0.5) - xScale(0.15), +yScale(this.size[1]*3/8) - yScale( 0.15 ) );

				ctx.moveTo( -xScale(0.05), +yScale(this.size[1]*3/8) );
				ctx.lineTo( -xScale(0.5), +yScale(this.size[1]*3/8) );
				ctx.lineTo( -xScale(0.5) + xScale(0.15), +yScale(this.size[1]*3/8) + yScale( 0.15 ) );
				ctx.moveTo( -xScale(0.5), +yScale(this.size[1]*3/8) );
				ctx.lineTo( -xScale(0.5) + xScale(0.15), +yScale(this.size[1]*3/8) - yScale( 0.15 ) );

				ctx.stroke();
			}
			if( this.market ) {
				ctx.fillStyle = "black";
				ctx.font = "60px Arial";
				if( this.market > 0 ) 
					ctx.fillText( `Up ${this.market}`, 0, yScale(0.5) );
				else
					ctx.fillText( `Down ${-this.market}`, 0, yScale(0.5) );
			}
			if( this.roll ) {
				ctx.fillStyle = "black";
				ctx.fillText( "Roll", 0, 0 );
			}
			if( this.sellStocks ) {
				ctx.fillStyle = "#008000";
				ctx.fillText( "Sell", 0, 0 );
				ctx.fillText( "Stocks", 0, xScale(this.size[1]/4) );
			}
			if( this.quit ) {
				ctx.fillStyle = "black";
				ctx.fillText( "Quit", 0, 0 );
			}

		if( this.leaveRight ) {
			ctx.beginPath();
			ctx.moveTo( -xScale(0.5), +yScale(this.size[1]*3/8) );
			ctx.lineTo( xScale(0.5), +yScale(this.size[1]*3/8) );
			ctx.lineTo( xScale(0.5) - xScale(0.15), +yScale(this.size[1]*3/8) + yScale( 0.15 ) );
			ctx.moveTo( xScale(0.5), +yScale(this.size[1]*3/8) );
			ctx.lineTo( xScale(0.5) - xScale(0.15), +yScale(this.size[1]*3/8) - yScale( 0.15 ) );
			ctx.stroke();
		}

		if( this.leaveLeft ) {
			ctx.beginPath();
			ctx.moveTo( xScale(0.5), +yScale(this.size[1]*3/8) );
			ctx.lineTo( -xScale(0.5), +yScale(this.size[1]*3/8) );
			ctx.lineTo( -xScale(0.5) + xScale(0.15), +yScale(this.size[1]*3/8) + yScale( 0.15 ) );
			ctx.moveTo( -xScale(0.5), +yScale(this.size[1]*3/8) );
			ctx.lineTo( -xScale(0.5) + xScale(0.15), +yScale(this.size[1]*3/8) - yScale( 0.15 ) );
			ctx.stroke();
		}

		ctx.restore();
	}
}

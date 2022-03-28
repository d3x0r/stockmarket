
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"

import * as protocol from "./gameProtocol.js"
                                   
// <link rel="stylesheet" href="../styles.css">
const style = document.createElement( "link" );
style.rel = "stylesheet";
style.href = "/node_modules/@d3x0r/popups/styles.css";
document.head.appendChild( style );
const style2 = document.createElement( "link" );
style2.rel = "stylesheet";
style2.href = "./styles.css";
document.head.appendChild( style2 );

export function go() {
	/* go. */
        
	const useform = document.body;
	
	const form = new Popup( null, null, {from:useform} );

	protocol.doReopen();
	
	protocol.gameState.on( "load", (events)=>{ loadGameForm( form, events ) } );

	//loadGameForm( form );
}


let oldGame = null;
let loginForm = null;

function loadGameForm(form, events) {
	// on reconnect, we're going to potentially have a different game data...
	if( oldGame ) oldGame.remove();
	
	const GameBoard = new Popup( "Stock Market", form );

	oldGame = GameBoard;

	const gameBoard = document.createElement( "canvas" );
	gameBoard.width = 4096;
	gameBoard.height = 4096;
	gameBoard.style.width = "90vh";
	gameBoard.style.height = "90vh";
	
	const gameCtx = gameBoard.getContext( "2d" );
	GameBoard.appendChild( gameBoard );
	drawGameBoard( gameCtx );
	                      
	const login = new Login( GameBoard );
	loginForm = login;
	login.show();



	events.on( "join", ()=>{
		login.hide();
	} );

	events.on( "join", ()=>{
		login.hide();
	} );
}


class Login extends Popup {
	
	info = { name: '' };
	username = null;

	constructor( parent ) {
		super( "Login", parent, { suffix:'-login' } );
		this.username = popups.makeTextInput( this, this.info, "name", "Name" );
		popups.makeButton( this, "Login", ()=>{ this.doLogin() } );
		this.center();
	}

	show() {
		this.center();
		super.show();

	}

	doLogin() {
		if( this.info.name ) {
			protocol.send( {op:"username", name:this.info.name } );
			this.hide();
		} else {
			popups.Alert( "Name can't be blank..." );
		}
	}

}

const boardData = {
	
}


function drawGameBoard( ctx ) {
	const gameState = protocol.gameState;
	const board = gameState.board;

	const gameBoard = new Board( gameState.board, gameState.stocks );
	console.log( "Draw a new board:", board );
	gameBoard.draw( ctx );
}


class Board {
	spaces = [];
	random = true;
	stocks = [];
	modeHandlers = {};

	constructor( board, stocks ) {
		stocks.stocks.forEach( stock=>{
			this.stocks.push( stock );	
		} );
		board.spaces.forEach( (space)=>new BoardSpace( this, space ) );		

	}
	draw( ctx ) {
		for( let space of this.spaces ) space.draw( ctx );
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

class BoardSpace {

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
	
	constructor( board, space ) {
		
		this.def = space;
		this.id = space.id;
		if( "market" in space )
			this.market = space.market;
		if( "stock" in space ) {
			this.stock = board.stocks.find( s=>s.ID==space.stock );
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
			this.mode = board.handleStart.bind( board, this );
			this.start = true;
		} else if( space.center ) {
			// pay prospector...
			this.mode = board.handlePay.bind( board, this );
				
		} else if( space.roll ) {
			// roll the dice.
			this.mode = board.handleRoll.bind( board, this );
			this.roll = true;
		} else if( space.quit ) {
			// quit the game.
			this.mode = board.handleQuit.bind( board, this );
			this.quit = true;
		} else if( space.split ) {
			// quit the game.
			this.split = space.split.split('/');
			
			this.mode = board.handleSplit.bind( board, this );
		} else if( space.sellStocks ) {
			// sell some stocks...
			this.mode = board.handleSellStocks.bind( board, this );
			/* click space*/
			this.sellStocks = true;
		} else if( space.broker ) {
			this.mode = board.handleBroker.bind( board, this );
			this.broker = true;	
		} else if( space.sell ) {
			this.mode = board.handleSell.bind( board, this );
			this.sell = true;
		}else {
			this.mode = board.handleSpace.bind( board, this );
		}
		board.spaces.push( this );
	}
}

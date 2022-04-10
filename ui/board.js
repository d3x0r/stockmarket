
import {JSOX} from "/node_modules/jsox/lib/jsox.mjs";

const tokenInfo = await fetch( "./images/tokens.jsox" ).then( data =>{
	return data.text().then( text=>{
		return JSOX.parse(text );
	} )
} );        

const tokens = document.createElement( "img" );
tokens.src = "./images/"+tokenInfo.lowres.name;

const tokenSpots = [];
for( let y = 0; y < 2; y++ ) for( let x = 0; x < 4; x++ )   {
	tokenSpots.push( {x: x*tokenInfo.lowres.width/4, y:y*tokenInfo.lowres.height/2} );
}

export const tokenShare = {
	tokenInfo,
	tokens,
	tokenSpots,
}

import * as protocol from "./gameProtocol.js"
import {GameWait} from "./gameWait.js" 
import {Stock} from "./stock.mjs" 
import {BuyForm} from "./buyForm.js"
import {SellForm} from "./sellForm.js"
import {DebtForm} from "./debtForm.js"
import {PlayerStatusForm} from "./playerStatusForm.js"
import {StockForm} from "./stockForm.js"
import {StockSpace} from "./stockSpace.mjs" 
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"

let gameWaiter = null;
let waiterHidden = false;

// gameBoard is the form containing the game canvases.
// contexts are contexts for game canvases...
function makeGameBoard( gameBoard, ctx, overlayCtx ) {
	const gameState = protocol.gameState;

	const board = new Board( gameState.board, gameState.stocks, overlayCtx, gameBoard );
	
	board.draw( ctx );

        return board;
}

export class GameBoard extends Popup {
	showing = true;
	board = null;
	#allowPlay = false;
	isIn = null;
	currentPlayer = null;
	currentSpace = null;
	thisPlayer = null;
	gameAlert = new popups.AlertForm();

	rolling = false;
	stockForm = null;
	playerStatus = null; // form;
	buyForm = new BuyForm( this );
	debtForm = new DebtForm( this );

	get allowPlay() { return this.#allowPlay }
	set allowPlay(val){
		this.#allowPlay = val;
		
	}
	constructor(form) {
		super( "Stock Market", form );

		const game = protocol.gameState.game;

		this.currentPlayer = game.users[game.currentPlayer];
		for( let u = 0; u < game.users.length; u++ ) {
			if( game.users[u].name === protocol.gameState.username ) {
			}
		}


		const players = protocol.gameState.players;
		let inProgress = true;

		for( let player of players ) {
			if( player.name === protocol.gameState.username ) 
				this.thisPlayer = player;
			if( !player.space ) inProgress = false;
		}


		this.gameAlert.hide();


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



		if( this.thisPlayer.inPlay && this.thisPlayer.name === this.currentPlayer.name ) {
			this.board.allowPlay = true;
			this.board.addHighlight( this.board.roll );
		}

		if( !this.thisPlayer.inPlay ) {
			if( !gameWaiter ) gameWaiter = new GameWait( this );
			else              gameWaiter.reset();
		}
		else
			if( this.thisPlayer ) {
				// I should be a player, but for my player, find my space, and set it current in the board
				// otherwise it's a new game... this should also be 'inProgress'
				const playerSpace = this.board.spaces.find( space=>space.id===this.thisPlayer.space );
		        
				this.currentSpace = playerSpace;		
			}

		for( let player of players ) {
			if( player.space ) {
				const space = this.board.spaces.find( space=>space.id===player.space );
				if( space ) this.board.addToken( player, space );
			}
		}

		protocol.on( "go", ()=>{
			this.board.allowPlay = true;
			if( !waiterHidden ) {
				waiterHidden = true;
				if( gameWaiter ) gameWaiter.hide();
			}
		} );
		protocol.on( "roll", (msg)=>{
			this.rolling = false;
			//console.log( "got roll:", msg );
		} );
		protocol.on( "turn", (msg)=>{
			this.board.allowPlay = true;
			if( !waiterHidden ) {
				waiterHidden = true;
				if( gameWaiter ) gameWaiter.hide();
			}
			this.currentPlayer = protocol.gameState.players.find( player=>player.name === msg.name );
			if( this.currentPlayer ) 
				if( this.currentPlayer.name === protocol.gameState.username ) {
					this.rolling = true;
					this.board.addHighlight( this.board.roll );
					this.gameAlert.show( "It's your turn..." );
				}else
					this.gameAlert.show( "It's " + this.currentPlayer.name + "'s turn..." );
			else
				console.log( "Game thinks current player is someone I don't know... (no turns available)." );
		} );
		protocol.on( "start", (msg)=>{
			// this should include the player turn order too.
			this.currentPlayer = protocol.gameState.players.find( player=>player.name === msg.name );
			this.board.allowPlay = true;
			if( this.currentPlayer.name === protocol.gameState.username ) {
				this.rolling = true;
				this.board.addHighlight( this.board.roll );
				this.gameAlert.show( "It's your turn..." );
			}else
				this.gameAlert.show( "It's " + this.currentPlayer.name + "'s turn..." );
		} );

		protocol.on( "player", (msg)=>{
			if( this.showing ) {
				this.playerStatus.addPlayerRow( msg.user );
			}
		} );
		protocol.on("quit", (msg)=>{
				this.playerStatus.removePlayer( msg.user );
				
				this.board.removeToken( msg.user );
			} );
		protocol.on( "space", (msg)=>{
			console.log( "got playerMove:", msg );
			const space = this.board.spaces.find( (space)=>space.id === msg.id );			
			if( msg.name === protocol.gameState.username ) {
				if( space.stock && !space.sell ) {
					if( space.meeting )
						this.buyForm.show( this.thisPlayer, space.stock, 1 );
					else
						this.buyForm.show( this.thisPlayer, space.stock, Infinity );
				}
				if( this.rolling ) {
					this.board.addHighlight( this.board.roll,null );
				}
				this.currentSpace = space;
				this.board.addToken( this.thisPlayer, space );
				this.board.animate();
			} else {
				const player = protocol.gameState.players.find( player=>player.name === msg.name );
				this.board.addToken( player, space );
			}
			
		} );

		protocol.on( "pay", (msg)=>{
			const paid = protocol.gameState.players.find( player=>player.name === msg.user );
			console.log( "Player Cash Update:", msg );
			paid.cash = msg.balance;			
		} );
		protocol.on( "give", (msg)=>{
			if( msg.user === protocol.gameState.username ) {
				//stocks
				// shares and balance included..
				const stock = this.thisPlayer.stocks.find( stock=>stock.id === msg.stock.id );
				if( stock ) {
					stock.shares = msg.balance;
				}
			}
		} );
		protocol.on( "stock", (msg)=>{
			if( msg.user === protocol.gameState.username ) {
				//stocks
				const stock = this.thisPlayer.stocks.find( stock=>stock.id === msg.stock.id );
				if( stock ) {
					stock.shares = msg.stock.shares;
				}
			}
		} );
		protocol.on( "choose", (msg)=>{
			this.board.clearHighlights();
			for( let space of this.board.spaces ) {
				let c;
				if( c = msg.choices.find( c=>c.space === space.id ) ) {
					this.board.addHighlight( space, c.stock, c.stockDir );
				}
			}
			// refresh overlay
			this.board.animate();
		} );

		this.gameBoardOverlay.addEventListener( "mousemove", (evt)=>this.mousemove(event) );
		this.gameBoardOverlay.addEventListener( "mouseup", (evt)=>this.mouseup(event) );
		this.gameBoardOverlay.addEventListener( "mousedown", (evt)=>this.mousedown(event) );

		this.sellForm = new SellForm( this, this.board.stocks );
        this.stockForm = new StockForm( this, this.board.stocks );
		this.playerStatus = new PlayerStatusForm( this, this.thisPlayer, this.board.stocks );


	}
	hide() {
		super.hide();
		this.showing = false;
	}
	show(  ) {
		this.showing = true;
		this.board.sweepTokens();
		
		const game = protocol.gameState.game;
		this.currentPlayer = game.users[game.currentPlayer];

		const players = protocol.gameState.players;
		let inProgress = true;

		for( let player of players ) {
			if( player.name === protocol.gameState.username ) 
				this.thisPlayer = player;
			if( !player.space ) inProgress = false;
			else{
				const space = this.board.spaces.find( space=>space.id===player.space );
				if( space ) this.board.addToken( player, space );
			}
		}

		this.playerStatus.show( this.thisPlayer );

		if( this.thisPlayer.name === this.currentPlayer.name ) {
			this.board.allowPlay = true;
			
			this.board.addHighlight( this.board.roll );
		}

		if( !this.thisPlayer.inPlay ) {
			if( !gameWaiter ) gameWaiter = new GameWait( this );
			else              gameWaiter.reset();
		}
		else
			if( this.thisPlayer ) {
				// I should be a player, but for my player, find my space, and set it current in the board
				// otherwise it's a new game... this should also be 'inProgress'
				const playerSpace = this.board.spaces.find( space=>space.id===this.thisPlayer.space );
		        
				this.currentSpace = playerSpace;		

			}

		super.show();
	}

	mousedown(evt){
		if( this.isIn ) {
			this.isDown = this.isIn;
		}
	}
	mouseup(evt){
		if( this.isIn ) {
			if( this.isIn === this.isDown ) {
				this.isDown.space.mode( this.isDown.stock,this.isDown.stockDir );
			}
		}
		this.isDown = null;
	}
	mousemove(evt){
		var rect = this.gameBoard.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;
		
		const xr = x* 26  / rect.width ;
		const yr = y * 26 / rect.height;

		const isIn = sel=>{ const space = sel.space;
			return( xr >= space.position[0] && yr >= space.position[1] &&
				xr <= ( space.position[0]+space.size[0] ) && yr <= ( space.position[1]+space.size[1] ) )?sel:null;
		};
		this.isIn = this.board.selected.find( isIn );
		if( !this.isIn )
			if( this.isIn = isIn( this.board.sell ) ) {
			} else if( this.isIn = isIn( this.board.quit ) ) {			
			}
		if( this.isIn ) {
			this.board.setActive( this.isIn.space, this.isIn.stock );
		}else			this.board.setActive( null, null );

		
	}
}


export class Board {
	stopped = false;
	spaces = [];
	random = true;
	stocks = [];
	modeHandlers = {};
	ctx = null; // overlay context
	waiter = null;
	hover = null;
	//currentSpace = null;
	state = 0;
	roll = null;
	//starts = [];
	jobs = [];
	quit = {space:null,stock:null};
	sell = {space:null,stock:null};
	allowedPlay = false;
	selected =  [];
	timer = null;
	canSell = false;
	#gameBoard = null;
	tokens = [];

	constructor( board, stocks, ctx, gameBoard ) {
		this.ctx = ctx;
		this.#gameBoard = gameBoard;
		stocks.stocks.forEach( stock=>{
			this.stocks.push( new Stock( protocol.gameState.game, stock) );	
		} );
		
		board.spaces.forEach( (space)=>new BoardSpace( this, space ) );		
		this.spaces.forEach( space=>{
			if( space.roll) this.roll = space;
			//if( space.start) this.starts.push( space );
			if( space.job) this.jobs.push( space );
			if( space.quit) this.quit.space = space;
			if( space.sellStocks) this.sell.space = space;
			if( space.id === gameBoard.currentPlayer.space ) this.setCurrent( space, null );
		} );
		//this.waiter = new GameWait( this );
		if( !gameBoard.currentSpace || gameBoard.currentSpace.job ) 
			this.jobs.forEach( job=>this.addHighlight( job ) );
		
		//this.jobs.forEach( job=>this.addHighlight( job ) );
	}

	setCurrent(space,stock, stockDir) {
		if( space != this.#gameBoard.currentSpace ) {
			if( !this.#gameBoard.thisPlayer.rolled && this.#gameBoard.thisPlayer === this.#gameBoard.currentPlayer && protocol.gameState.game.inPlay )
				this.addHighlight( this.roll );

			this.#gameBoard.currentSpace = space;
			protocol.sendSpace( space.id, stock, stockDir );
			if( !space.job ) this.selected.length = 0;
			return;
		}
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

	removeToken( user ) {
		const game = protocol.gameState.game;

		//this.currentPlayer = game.users[game.currentPlayer];
		let gameuser = null;
		for( let u = 0; u < game.users.length; u++ ) {
			if( game.users[u].name === user ) {
				gameuser = game.users[u];
				break;
			}
		}

		// find the token list for the user's current space
		// find the token in the list on the space, remove token, if empty, remove list.
		for( let t = 0; t < this.tokens.length; t++ )  {
			const tokenList = this.tokens[t];
			if( tokenList.id === gameuser.space ) {
				for( let u = 0; u < tokenList.users.length; u++ ) {
					const us = tokenList.users[u];
					if( us === gameuser ) {
						tokenList.users.splice( u, 1 );
						if( !tokenList.users.length ) {
							this.tokens.splice( t, 1 );
						}
						break;
					}
				}				
				break;
			}
		}
	}

	addToken( user, space ) {
		//console.log( "Player is now moved...", user.name, space.id );
		let next = -1;;
		let cur = -1;
		{
			for( let t = 0; t < this.tokens.length; t++ )  {
				const tokenList = this.tokens[t];
				if( tokenList.id === space.id ) {
					next = t;
				}
				if( tokenList.id === user.space ) {
					cur = t;
				}
			}
		}
		//console.log( "player current, next is:", cur, next );
		if( cur >= 0 ) {	
			const list = this.tokens[cur];//tokenList.users;
			for( let u = 0; u < list.users.length; u++ ) {
				const us = list.users[u];
				if( us === user ) {
					list.users.splice( u, 1 );
					break;
				}
			}
			if( cur!=next && list.users.length === 0 ) {
				this.tokens.splice( cur, 1 );
				if( next > cur ) next--;
			}
		}

		if( next < 0 ) {
			this.tokens.push( {id:space.id,space:space,users:[user]} );
		}else{
			this.tokens[next].users.push( user );
		}
			

		user.space = space.id;
	}

	draw( ctx ) {
		for( let space of this.spaces ) space.draw( ctx );

		//this.spaces[3].drawHighlight( this.ctx );
	}


	sweepTokens() {
		this.tokens.length = 0;
	}
	animate(n) {
		if( !this.timer ) {
			if( !this.stopped )
				this.timer = setTimeout(  ()=>{
					this.timer = 0;
					this.state = 1-this.state;
					this.animate( true )
				}, 500 );
		}		


		this.ctx.clearRect( 0, 0, 4096, 4096 );

		for( let token of this.tokens  ) {
			for( let p = 0; p < token.users.length; p++ ) {
				const pawn = token.users[p];
				token.space.drawToken( this.ctx, pawn.color, p );
			}
		}

		this.selected.forEach( sel=>{const space=sel.space; if( space === this.hover || space == this.currentSpace ) return; space.state=this.state; space.drawHighlight( n, this.ctx ) });

		if( this.#gameBoard.currentSpace ) {
			this.#gameBoard.currentSpace.state=this.state;
			this.#gameBoard.currentSpace.drawCurrent( this.ctx );
		}

		if( this.hover ) {
			this.hover.state=this.state;
			if( this.#gameBoard.currentSpace == this.hover ) {
			} else {
			
				this.hover.drawHover( this.ctx );
			}
		}
		this.quit.space.state = this.state;
		this.quit.space.drawQuit( this.ctx );
		if( this.canSell ) {
			this.sell.space.state = this.state;
			this.sell.space.drawSell( this.ctx );
		}

		/*
			// debug left-right linkages...
		for( let space of this.spaces ) {
			if( space.left ) {
				this.ctx.strokeStyle= "green";
				this.ctx.beginPath();
				this.ctx.moveTo( xScale( space.position[0] +0.5), yScale( space.position[1] +0.5) );
				this.ctx.lineTo( xScale( space.left.position[0] +1.5), yScale( space.left.position[1] +1.5) );
				this.ctx.stroke();
			}
			if( space.right ) {
				this.ctx.strokeStyle= "red";
				this.ctx.beginPath();
				this.ctx.moveTo( xScale( space.position[0] +0.5), yScale( space.position[1] +0.5) );
				this.ctx.lineTo( xScale( space.right.position[0] +1.5), yScale( space.right.position[1] +1.5) );
				this.ctx.stroke();
			}
		}
		*/
	}

	addHighlight( space, stock, stockDir ) {
		if( !space ) return;
		if( !this.selected.find( sel=>sel.space === space ) )			
			if( this.selected.push( {space,stock, stockDir} ) == 1) {
				if( !this.timer ) this.animate(false);
		        
			}
	}
	clearHighlights() {
		//let needRoll = false;
		//for( let sel of this.selected ) if( sel.space === this.roll ) needRoll = true;
		this.selected.length = 0;
		//if( needRoll ) 
		//	this.addHighlight( this.roll, null );
	}
	clearHighlight( space ) {
		const id = this.selected.findIndex( s=>s.space===space );
		if( id >= 0 ) {
			this.selected.splice( id, 1 );
			this.animate();
		}
	}




	handleRoll( space ) {
		this.#gameBoard.thisPlayer.rolled = true;
		if( this.allowPlay ) {
			this.clearHighlight( space );
			protocol.sendRoll();
			
		}
	}

	handleSellStocks( space ) {
		this.#gameBoard.sellForm.show( this.#gameBoard.thisPlayer, space.stock );
	}
	handleQuit( space ) {
		protocol.sendQuit();
		this.#gameBoard.hide();
	}
	handleSell( space ) {
		this.setCurrent( space );
	}
	handlePay( space, stock ) {
		this.setCurrent( space,stock );
	}
	handleStart( space ) {
		if( this.#gameBoard.rolling )
			this.addHighlight( this.roll,null );
		this.setCurrent( space );
	}
	handleBroker( space ) {
		this.setCurrent( space );
	}
	handleSpace( space ) {
		this.setCurrent( space );
	}

	handleSplit( space, stock, stockDir ) {
		this.setCurrent( space, stock, stockDir );
	}
}

const xScale = (x)=>x / 26 * 4096;
const yScale = (x)=>x / 26 * 4096;

class BoardSpace extends StockSpace {


	timer = 0;
	state = 0;


	drawToken( ctx, n, m ) {
		const spot = tokenSpots[n];
		ctx.drawImage( tokens
				, spot.x, spot.y, tokenInfo.lowres.width/4,tokenInfo.lowres.height/2
				, xScale( m * 0.4 + this.position[0]+this.size[0]/10 ), xScale( this.position[1]+this.size[1]*6/8 ), xScale( this.size[0]/4 ), yScale( this.size[0]/4 ) );
	}

	drawCurrent( ctx ) {
		if( this.state ) {
			ctx.shadowBlur = 60;
			ctx.shadowColor = "#ee33cc";
		}
		
			ctx.strokeStyle = "#ee33cc";
			ctx.lineWidth = 8;
			ctx.fillStyle="#ee33cc";

		this.drawBorder(ctx);

	}

	drawBorder( ctx ) {
		ctx.strokeRect( -xScale(0.05)+xScale(this.position[0]), yScale(this.position[1]),xScale(0.1), yScale(this.size[1]) );
		ctx.fillRect( -xScale(0.05)+xScale(this.position[0]), yScale(this.position[1]),xScale(0.1), yScale(this.size[1]) );


		ctx.strokeRect( xScale(this.position[0]), -yScale(0.05)+yScale(this.position[1]),xScale(this.size[0]), yScale(0.1) );
		ctx.fillRect( xScale(this.position[0]), -yScale(0.05)+yScale(this.position[1]),xScale(this.size[0]), yScale(0.1) );

		ctx.strokeRect( -xScale(0.05)+xScale(this.position[0]+this.size[0]), yScale(this.position[1]),xScale(0.1), yScale(this.size[1]) );
		ctx.fillRect( -xScale(0.05)+xScale(this.position[0]+this.size[0]), yScale(this.position[1]),xScale(0.1), yScale(this.size[1]) );

		ctx.strokeRect( xScale(this.position[0]), -yScale(0.05)+yScale(this.position[1]+this.size[1]),xScale(this.size[0]), yScale(0.1) );
		ctx.fillRect( xScale(this.position[0]), -yScale(0.05)+yScale(this.position[1]+this.size[1]),xScale(this.size[0]), yScale(0.1) );
	}

	drawHover( ctx ) {
			ctx.shadowBlur = 60;
			ctx.shadowColor="#44aa99";
			ctx.strokeStyle="#44aa99";
			ctx.lineWidth = 8;
			ctx.fillStyle="#44aa99";

		this.drawBorder(ctx);

	}

	drawSell( ctx ) {
		if( !this.state ) {
			ctx.shadowBlur = 60;
			ctx.shadowColor="#44EE44";
			ctx.strokeStyle="#44EE44";
			ctx.lineWidth = 8;
			ctx.fillStyle="#44ee44";
		}else {
			ctx.shadowBlur = 0;
			ctx.shadowColor = null;
			ctx.strokeStyle = "#aa8800";
			ctx.lineWidth = 8;
			ctx.fillStyle="#aa8800";
		}

		this.drawBorder(ctx);

	}
	drawQuit( ctx ) {
		
/*		if( !this.state ) {
			ctx.shadowBlur = 0;
			ctx.shadowColor="#44aa99";
			ctx.strokeStyle="#44aa99";
			ctx.lineWidth = 8;
			ctx.fillStyle="#44aa99";
		}else */
		{
			ctx.shadowBlur = 0;
			ctx.shadowColor = null;
			ctx.strokeStyle = "#025";
			ctx.lineWidth = 8;
			ctx.fillStyle="#025";
		}

		this.drawBorder(ctx);

	}
	drawHighlight( change, ctx ) {
		if( this.state ) {
			ctx.shadowBlur = 60;
			ctx.shadowColor = "gold";
			ctx.strokeStyle = "gold";
			ctx.lineWidth = 8;
			ctx.fillStyle="#eecc00";
		} else {
			ctx.shadowBlur = 0;
			ctx.shadowColor = null;
			ctx.strokeStyle = "#aa8800";
			ctx.lineWidth = 8;
			ctx.fillStyle="#aa8800";
		}
		this.drawBorder(ctx);

	}

	draw( ctx ) {
		ctx.save();
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




import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"
import * as protocol from "./gameProtocol.js"


export class GameWait extends Popup {
	
	playerList = document.createElement( "div" );
        #rows = []; 
	#tokens = [];
	username = protocol.gameState.username;
	currentToken = -1;
	ready = false;

        constructor( parent ) {
        	super( "Waiting for players...", parent, {suffix:'-game-wait'} );
                
                this.playerList.className = "game-player-list";
                

                this.appendChild( this.playerList );

		{
			const row = document.createElement( "div" );
			for( let c = 0; c < 8; c++ ) {
				this.addToken( row, c );
			}
			this.appendChild( row );
		}


                //const selfPlayer = this.addPlayer( null );
		const players = protocol.gameState.players;
		for( let p = 0; p < players.length; p++ ) {
			const player = players[p];
			if( player.name === protocol.gameState.username ) {
				this.selectToken( player.color );
			}
			this.addPlayer( player );
		}

		protocol.on( "player", (msg)=>this.addPlayer( msg.user ) );		
		protocol.on( "ready", (msg)=>this.readyPlayer( msg.user ) );                
		protocol.on( "unready", (msg)=>this.unreadyPlayer( msg.user ) );                
		protocol.on( "go", (msg)=>this.readyPlayer( msg.user ) );                
		protocol.on( "color", (msg)=>this.setPlayerColor( msg.user, msg.color ) );

                this.readyButton = popups.makeButton( this, "Ready", ()=>{
			this.ready = !this.ready;
			if( this.ready )
				protocol.sendReady();
			else
				protocol.sendUnready();
                	//this.hide();
                } );
		this.center();
        }

	readyPlayer( player ) {
		const playerId = this.#rows.findIndex( r=>player?(r.player.name === player.name):this.username===r.player.name ) ;
		if( playerId >= 0 ){
			const row = this.#rows[playerId];
			row.status.textContent = "Ready";
			row.status.style.color = "green";
			if( row.player.name === this.username )
				this.readyButton.buttonInner.textContent = "Unready";
		}
	}
	unreadyPlayer( player ) {
		const playerId = this.#rows.findIndex( r=>player?(r.player.name === player.name):this.username===r.player.name ) ;
		if( playerId >= 0 ){
			const row = this.#rows[playerId];
			row.status.textContent = "not ready...";
			row.status.style.color = "red";
			if( row.player.name === this.username )
				this.readyButton.buttonInner.textContent = "Ready";
		}
	}

	setPlayerColor( player, color ) {
		for( let u of protocol.gameState.game.users ) {
			if( u.name === player ) u.color = color;
		}
	}        

	addToken( row, c ) {
		
		const frame = document.createElement( "div" );
		frame.className = "token-frame";
		const shape = document.createElement( "canvas" );
		shape.className = "token-image";
		shape.width = tokens.tokenInfo.lowres.width/4;
		shape.height = tokens.tokenInfo.lowres.height/2;
		const ctx = shape.getContext( "2d" );
		ctx.drawImage( tokens.tokens, (c%4)*shape.width, ((c/4)|0)*shape.height, shape.width, shape.height, 0, 0, shape.width, shape.height );
		
		frame.appendChild( shape );
		row.appendChild( frame );
		//addToken

		frame.addEventListener( "click", (evt)=>{
			this.selectToken( c );
					
		} );
		this.#tokens.push( {color:c,frame:frame,shape:shape} );
	}


	selectToken( n ) {
		if( this.currentToken >= 0 ) {
			const token = this.#tokens.find( token=>token.color===this.currentToken );
			token.shape.className = "token-image";
		} 
		this.currentToken = n;
		const token = this.#tokens.find( token=>token.color===n );
		token.shape.className = "token-image-active";
		protocol.sendColor( n );
	}
	
        addPlayer(player) {

		const row = document.createElement( "div" );
		row.style.display = "table-row";
		const name = document.createElement( "span" );
		const isMe = ( !player ) || ( player.name === protocol.gameState.username );
		if( !isMe )
			name.textContent = player.name;
		else
			name.textContent = "You";
		name.style.minWidth = "25vw";
		name.style.display = "table-cell";
		row.appendChild( name );

		const statusField = document.createElement( "span" );
		if( player ) {
			if( player.inPlay ){
				statusField.textContent = "Ready";
				statusField.style.color = "green";
				if( isMe ) this.hide();
			}
			else {
				statusField.innerText = "not ready...";
				statusField.style.color = "red";
			}
		}
		statusField.style.display = "table-cell";
		statusField.style.float = "right";
		row.appendChild( statusField );

		this.playerList.appendChild( row );
		const info = {row:row, status:statusField, player:player}
		this.#rows.push( info );


		return info;
        }

        dropPlayer(player) {
		const playerId = this.#rows.findIndex( p=>p === player ) ;
		if( playerId >= 0 ){
			this.#rows.splice( playerId, 1 );
		}
        }

	reset() {

        	// I expect I don't want to re-register protocol events....
                // and that this form will be kept, and recycled.
		while( this.playerList.childNodes.length ) this.playerList.childNodes[0].remove();
		const players = protocol.gameState.players;
		for( let p = 0; p < players.length; p++ ) {
			const player = players[p];
			if( player.name === protocol.gameState.username ) {
				this.selectToken( player.color );
			}
			this.addPlayer( player );
		}
		
		this.ready = false;
		this.readyButton.buttonInner.textContent = "Ready";
		this.show();
        }
}

let tokens;
import( "./board.js" ).then( (module)=>tokens = module.tokenShare );

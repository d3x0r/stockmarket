
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"

import * as protocol from "./gameProtocol.js"

import {Login} from "./login.js"
import {Lobby} from "./lobby.js"
import {Board,makeGameBoard} from "./board.js"
                                   
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
	let lobby = null;
        
	const useform = document.body;
	
	const form = new Popup( null, null, {from:useform} );

	protocol.doReopen();

		const user = localStorage.getItem( "userName" );
		
		if( !user ) {
			new Login( form );
		} else
			protocol.sendUserName( user );

	protocol.on( "login", (msg)=>{
		console.log( "default login handler? !!!!! UNUSED?!" );
		lobby = new Lobby( form );
	});

	protocol.on( "lobby", (msg)=>{
		//console.log( "lobby handler?", msg );
		lobby = new Lobby( form, msg );
	});
	protocol.on( "load", (data)=>{
		//console.log( "loadGame handler?", data );
		loadGameForm( form, protocol );
		// lobby.remove(); ??
		lobby.hide();

		//new Lobby( form, msg );
	});

	protocol.on( "join", (msg)=>{
		lobby.addUser( msg );
	} );

	protocol.on( "part", (msg)=>{
		lobby.dropUser( msg );
	} );

	protocol.gameState.on( "load", (events)=>{ 


	} );

	

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
	makeGameBoard( gameCtx );
	                      



	events.on( "join", ()=>{
		login.hide();
	} );

}




import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"

import * as protocol from "./gameProtocol.js"

import {Login} from "./login.js"
import {Lobby} from "./lobby.js"
import {GameBoard,Board} from "./board.js"

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

	let login = null;
	let lobby = null;

	let oldGame = null;
        
	const useform = document.body;
	
	// make page body a popup so it's got other trackable properties set.
	const form = new Popup( null, null, {from:useform} );

	protocol.doReopen();

	const user = localStorage.getItem( "userName" );
	
	if( !user ) {
		login = new Login( form );
	} else {
		protocol.sendUserName( user );
	}

	protocol.on( "lobby", (msg)=>{
		//console.log( "lobby handler?", msg );
		if( !lobby )
			lobby = new Lobby( form, msg, login?.username || user );
		else
			lobby.reload( msg );
	});
	protocol.on( "load", ()=>{
		//console.log( "loadGame handler?", data );
		if( oldGame ) {
			// will re-init the board instead? it's still the same game?
			oldGame.show();
		}
		else 
			oldGame = new GameBoard( form, protocol );
		// lobby.remove(); ??
		if(lobby) // might have skipped the lobby step altogether
			lobby.hide();

	});

	protocol.on( "join", (msg)=>{
		lobby.addUser( msg );
	} );

	protocol.on( "part", (msg)=>{
		lobby.dropUser( msg );
	} );

	protocol.gameState.on( "load", (events)=>{ 


	} );



}

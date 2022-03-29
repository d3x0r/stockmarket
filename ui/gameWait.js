


import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"
import * as protocol from "./gameProtocol.js"


export class GameWait extends Popup {
	
	playerList = document.createElement( "div" );
        
        constructor( parent ) {
        	super( "Waiting for players...", parent );
                
                this.playerList.className = "game-player-list";
                
                this.appendChild( this.playerList );
                
                
                popups.makeButton( this, "Go", ()=>{
                	this.hide();
                } );
		this.center();
        }
        
        addPlayer(player) {
        }

        dropPlayer(player) {
        }

	reset() {

        	// I expect I don't want to re-register protocol events....
                // and that this form will be kept, and recycled.
        }
}


import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"

export class Lobby extends Popup {
	constructor( parent ) {
		super( "Lobby", parent, { suffix:'-lobby' } );

		//popups
		popups.makeButton( this, "Create Game", ()=>{
		} );
		popups.makeButton( this, "Join Game", ()=>{
			
		} );
		this.center();
		
	}
}



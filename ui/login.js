
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"


export class Login extends Popup {
	
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

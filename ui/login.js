
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"

import {Events} from "./events.js";


import * as protocol from "./gameProtocol.js"

class LoginForm extends Popup {
	
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
			localStorage.setItem( "userName", this.info.name );
			protocol.sendUsername( this.info.name );
			this.hide();
		} else {
			popups.Alert( "Name can't be blank..." );
		}
	}

}


export class Login extends Events {
	constructor( parent ) {
		super();
		this.form = new LoginForm( parent, this );
	}
}
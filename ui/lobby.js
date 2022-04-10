
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"
import * as protocol from "./gameProtocol.js"


export class Lobby extends Popup {

	gameList = document.createElement( "div" );
	userList = document.createElement( "div" );

	user_rows = [];
	game_rows = [];

	constructor( parent, initial, userName ) {
		super( "Lobby", parent, { suffix:'-lobby' } );
		this.gameList.className = "lobby-game-list";
		this.appendChild( this.gameList );
		this.userList.className = "lobby-user-list";
		this.appendChild( this.userList );

		this.appendChild( document.createElement( "div" ) ); // generic div sep		
		//popups
		protocol.on( "game", (msg)=>{
			if( msg.fail ) {
				popups.Alert( "Failed to create game; name already exists...\nUse Join Instead?" );
			}
			else
				this.addGame( {name:msg.game} );
		} );		
		protocol.on( "user", (msg)=>{
			this.addUser( msg.user );
		} );		
		protocol.on( "part", (msg)=>{
			this.dropUser( msg.user );
		} );		
		protocol.on( "delete", (msg)=>{
			this.dropGame( msg.game );
		} );		
		popups.makeButton( this, "Create Game", ()=>{
			const query = popups.simpleForm( "Enter New Name", "Enter unique name", `${userName}'s Game`, (value)=>{

					protocol.createGame( value );
					// ok.
					query.remove();
				}
				, ()=>{
					// cancel;
					query.remove();
				} );
			query.show();

		} );

		initial.lobby.forEach( user=>this.addUser(user ) );
		initial.rooms.forEach( game=>this.addGame( game ) );
		if( !initial.rooms.length )
			this.addGame( {name: "--- No Games---- "} );
		this.center();
		
	}
	reload( msg ) {
		while( this.game_rows.length ) this.dropGame( this.game_rows[0].game.name )
		while( this.user_rows.length ) this.dropUser( this.user_rows[0].user.name )
		msg.lobby.forEach( user=>this.addUser(user ) );
		msg.rooms.forEach( game=>this.addGame( game ) );

		if( !msg.rooms.length )
			this.addGame( {name: "--- No Games---- "} );
		this.show();
		this.center();
	}	

	addUser( user ) {
		if( !user ) return;
		const row = document.createElement( "div" );
		this.user_rows.push( {row:row, user:user});
		row.style.display = "table-row";
		const name = document.createElement( "span" );
		name.textContent = user.name;
		name.style.display = "table-cell";
		row.appendChild( name );

		this.userList.appendChild( row );
	}
	dropUser( user ) {
		const userId = this.user_rows.findIndex( ur=>ur.user.name === user );
		if( userId >= 0) {
			const realUser = this.user_rows.splice( userId, 1 );
			realUser[0].row.remove();
		}
	}

	addGame( game ) {
		if( !game ) return;
		const row = document.createElement( "div" );
		this.game_rows.push( {row:row, game:game});
		row.style.display = "table-row";
		const name = document.createElement( "span" );
		name.textContent = game.name;
		name.style.display = "table-cell";
		row.appendChild( name );
		if( game.name[0] !== '-' )
			popups.makeButton( row, "Join", ()=>{
				protocol.joinGame( game.name );
			} );

		this.gameList.appendChild( row );

	}
	dropGame( game ) {
		const gameId = this.game_rows.findIndex( ug=>ug.game.name === game );
		if( gameId >= 0) {
			const realGame = this.game_rows.splice( gameId, 1 );
			realGame[0].row.remove();
		}
	}
}

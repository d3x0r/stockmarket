
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
				this.addGame( msg.game );
		} );		
		protocol.on( "user", (msg)=>{
			this.addUser( msg.user );
		} );		
		protocol.on( "part", (msg)=>{
			this.dropUser( msg.user );
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
	addUser( user ) {

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
		const userId = this.user_rows.findIndex( ur=>ur.user.name === user.name );
		if( userId >= 0) {
			const ur = this.user_rows[userId];
			const realUser = this.user_rows.splice( userId, 1 );
			realUser[0].row.remove();
		}
	}

	addGame( game ) {

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
	}
}



function oldSelectList() {
	const selector = new popups.create( "Select World", app );
	const rows = [];

	selector.addWorld = addWorld;
	selector.delWorld = delWorld;

	function delWorld( world ) {
		for( let row of rows ) {
			if( row.world.name === world.name ) {
				console.log( "Delete world?" );
				row.row.remove();
				break;
			}
		}
	}

	function addWorld( world ) {
		const row = document.createElement( "div" );
		rows.push( {row:row, world:world});
		row.style.display = "table-row";
		const name = document.createElement( "span" );
		name.textContent = world.name;
		name.style.display = "table-cell";
		row.appendChild( name );

		const delWorld = popups.makeButton( row, "X", ((world)=>()=>{
			row.remove();
				openGameSocket( );
			//selector.deleteItem( row );
			l.ws.send( JSOX.stringify( {op:'deleteWorld', world:world, user:localStorage.getItem( "userId" ) || "AllowMe" } ) );
			//selector.hide();
		})(world) );
		delWorld.style.display = "table-cell";
		delWorld.style.float = "right";


		const open = popups.makeButton( row, "Open", ((world)=>()=>{
			l.ws.send( JSOX.stringify( {op:'world', world:world } ) );
			selector.hide();
		})(world) );
		open.style.display = "table-cell";
		open.style.float = "right";

		selector.appendChild( row );

	}
	for( let world of worldList ) {
		addWorld( world );
	}

	{
		const row = document.createElement( "div" );
		const name = document.createElement( "span" );
		name.textContent = "New World";
		name.style.display = "table-cell";
		row.style.display = "table-row";
		row.appendChild( name );
		const open = popups.makeButton( row, "New", ()=>{
			selector.hide();
			const question = popups.simpleForm( "Enter new world name", "Name:", "My World", (val)=>{
				l.ws.send( JSOX.stringify( {op:'create', sub:"world", name:val } ) );
				question.remove();
				//selector.remove();
			}, ()=>{
			} );
			question.show();
		} );
		open.style.display = "table-cell";
		open.style.float = "right";
		selector.appendChild( row );
	}

	selector.show();
	return selector;

}

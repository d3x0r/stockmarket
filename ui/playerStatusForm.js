
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"
import * as protocol from "./gameProtocol.js"


// used to show the current player's information and general game status.
export class PlayerStatusForm extends Popup {

	rows = []; // stock status rows
	playerRows = []; // player status rows.
	tableSet = document.createElement( "div" );
	table = document.createElement( "div" );
	table2 = document.createElement( "div" );
	
	playerStatus = null;

	playerCash = null;
	playerValue = null;

	playerStatus_ = "...";

	playerCash_ = "$123";
	playerValue_ = "$456";
	lastRoll_ = "DICE";

	player = null;
	stocks = null;
	otherPlayerStatus = [document.createElement( "div" )];
	otherPlayersFrame = document.createElement( 'div' );

	constructor( parent, player, stocks ) {
        	super( "Player Status...", parent, {suffix:"-status", noCaption:true} );
		this.player = player;
		this.stocks = stocks;

		const playerFrame = document.createElement( 'div' );
		playerFrame.className = "status-player-frame";

		this.playerStatus = popups.makeTextField( playerFrame, this, "playerStatus_", "Status?" );
		this.playerCash = popups.makeTextField( playerFrame, this, "playerCash_", "Cash" );
		this.playerValue = popups.makeTextField( playerFrame, this, "playerValue_", "Total Value" );
		this.lastRoll = popups.makeTextField( playerFrame, this, "lastRoll_", "Last Roll" );

		//this.playerValue = popups.makeTextField( playerFrame, this, "playerValue_", "Total Value" );

		this.appendChild( playerFrame );

		this.otherPlayersFrame.className = "status-other-player-frame";
		
		for( let other of protocol.gameState.game.users ) {
			if( other === player ) continue;
			this.addPlayerRow( other );
		}

		playerFrame.appendChild(this.otherPlayersFrame);
		this.table.className = "stock-table-status";
		//this.table.style.display ="inline-block";
		this.table2.className = "stock-table-status";
		this.tableSet.className = "stock-table-set";
		//this.table2.style.display ="inline-block";

		for( let stock of player.stocks ) { if( this.rows.length >= 4 ) this.addRow( stock, this.table2 ); else this.addRow( stock, this.table ); }
		//this.hide();
		this.tableSet.appendChild( this.table );
		this.tableSet.appendChild( this.table2 );
		this.appendChild( this.tableSet );


		// position roughly...
		this.divFrame.style.left="18.75%";
		this.divFrame.style.top="25%";

		protocol.on( "buying", (msg)=>{
			const playerRow = this.playerRows.find( row=>row.player.name===msg.name );
			if( playerRow ) {
				playerRow.refresh( "Buying" );
			}
		});
		protocol.on( "selling", (msg)=>{
			const playerRow = this.playerRows.find( row=>row.player.name===msg.name );
			if( playerRow ) {
				playerRow.refresh( "Selling" );
			}
		});

		protocol.on( "choosing", (msg)=>{
			const playerRow = this.playerRows.find( row=>row.player.name===msg.name );
			if( playerRow ) {
				playerRow.refresh( "Moving" );
			}
		});
		protocol.on( "roll", (msg)=>{
			console.log( "got roll:", msg );
			this.lastRoll_ = `${msg.count} with ${msg.d1} and ${msg.d2}`;
			this.lastRoll.refresh();
		} );
		protocol.on( "player", (msg)=>{
			console.log( "got roll:", msg );
			this.lastRoll_ = "new roll";
		} );

		protocol.on( "space", (msg)=>{
			const playerRow = this.playerRows.find( row=>row.player.name===msg.name );
			if( playerRow ) {
				playerRow.refresh( "Moving" );
			}
		});

		protocol.on( "market", (msg)=>this.refresh() );
		protocol.on( "stock", (msg)=>this.refresh() );
		protocol.on( "give", (msg)=>this.refresh() );
		this.refresh();
        }


	removePlayer( name ) {
		const rowid = this.playerRows.findIndex( row=>row.player.name === name );
		if( rowid >= 0 ) {
			const row = this.playerRows[rowid];
			this.playerRows.splice( rowid, 1 );
			row.row.remove();
		}
	}

	addPlayerRow( player ) {
		const table = this.otherPlayersFrame;
		const row = {
			status_ : "doing...",
			row : document.createElement( "div" ),
			name : document.createElement( "span" ),
			status : document.createElement( "span" ),
			player,
			refresh( state ) {
				
				row.status.className = "player-status-status"+ state;
				row.status.textContent = state;
				row.status_ = state;
			}
		};
                row.row.className = 'player-status-row';


                row.name.className = 'player-status-name';
                row.name.textContent = player.name;

                row.status.className = 'player-status-status';
                row.status.textContent = row.status_;

		row.row.appendChild( row.name );
		row.row.appendChild( row.status );

		table.appendChild( row.row );

		this.playerRows.push( row );
	}

	addRow( userStock, table ) {
		const stock = this.stocks.find( stock=>stock.id===userStock.id );
		const row = {
			row : document.createElement( "div" ),
			label : document.createElement( "span" ),
			price : document.createElement( "span" ),
			value : document.createElement( "span" ),
			stock,
			userStock,
		};
		

                //row = document.createElement( "div" );
                row.row.className = 'player-stock-status-row-stock-'+stock.symbol;


                row.label.className = 'player-stock-status-cell-label-' + stock.symbol;
                row.label.textContent = stock.name;

                row.value.className = 'player-stock-status-cell-value-' + stock.symbol;
		row.value.textContent = stock.symbol;

                row.price.className = 'player-stock-status-cell-price-' + stock.symbol;
		row.price.textContent = "$??";

                row.row.appendChild( row.label );
                row.row.appendChild( row.price );
                row.row.appendChild( row.value );

                table.appendChild( row.row );
		this.rows.push( row );
	
	}

	show( player ) {
	        // update current fields from player status.. update any local referecnes to this player object.
		

		//super.show();
	}
	refresh( ) {

		
		for( let row of this.rows ) {
			row.price.textContent = '$' + row.stock.value;
			row.value.textContent = '$' + (row.stock.value * row.userStock.shares );
		}	
	}

}


import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"
import * as protocol from "./gameProtocol.js"

// used when a player is required to sell stocks to pay a debt

export class DebtForm extends Popup {

	rows = [];
	table = document.createElement( "div" );
	table2 = document.createElement( "div" );

	constructor( parent  ) {
        	super( null, parent, {suffix:"-stock", noCaption:true} );

		this.table.className = "stock-table";
		this.table.style.display ="inline-block";
		this.table2.className = "stock-table";
		this.table2.style.display ="inline-block";
		//for( let stock of stocks ) { if( this.rows.length >= 4 ) this.addRow( stock, this.table2 ); else this.addRow( stock, this.table ); }
		//this.hide();
		this.appendChild( this.table );
		this.appendChild( this.table2 );

		this.divFrame.style.left="18.75%";
		this.divFrame.style.top="65%";

        }

	addRow( stock, table ) {
		const row = {
			row : document.createElement( "div" ),
			label : document.createElement( "span" ),
			symbol : document.createElement( "span" ),
			price : document.createElement( "span" ),
			stock,
		};
		
                //row = document.createElement( "div" );
                row.row.className = 'stock-row-stock-'+stock.symbol;


                row.label.className = 'stock-label-' + stock.symbol;
                row.label.textContent = stock.name;

                row.symbol.className = 'stock-symbol-' + stock.symbol;
		row.symbol.textContent = stock.symbol;

                row.price.className = 'stock-price-' + stock.symbol;
		row.price.textContent = "$??";


                row.row.appendChild( row.label );
                row.row.appendChild( row.symbol );
                row.row.appendChild( row.price );

                table.appendChild( row.row );
		this.rows.push( row );
	
	}

	refresh( ) {
		for( let row of this.rows ) {
			row.price.textContent = '$' + row.stock.value;
		}	
	}

}

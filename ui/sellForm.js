
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"
import * as protocol from "./gameProtocol.js"

export class SellForm extends Popup {
	forcedSale = document.createElement( "div" );
	forcedSaleAmount = document.createElement( "div" );
	stockName = document.createElement( "span" );
	sellsFor = document.createElement( "span" );
	shares = document.createElement( "input" );
	cost = document.createElement( "span" );
	owned = document.createElement ("span" );

	// buttons to control share/cash - style class parts change
	shareMode = null;
	cashMode = null;

	shareCount = 0;
	cash = 0;
	target = 0; // required to sell this much.
	stock = null;

	tableSet = document.createElement( "div" );
	table = document.createElement( "div" );
	stocks = null;

	rows = []; // holders for the stock selector table?
	curRow = null;
	saleConfirmNotice= null;
	#lastSale = null;
	constructor( parent, stocks ) {
        	super( "Sell Stocks", parent, {suffix:"-sell"} );

			this.stocks = stocks;

			this.table.className = "sell-stock-table-status";
			//this.table.style.display ="inline-block";
			//this.table2.className = "stock-table-status";
			this.tableSet.className = "sell-stock-table-set";
			//this.table2.style.display ="inline-block";

			this.addRow( null, this.table ); // create header row.
			for( let stock of protocol.gameState.thisPlayer.stocks ) { this.addRow( stock, this.table ); }

			//this.hide();
			this.tableSet.appendChild( this.table );
			//this.tableSet.appendChild( this.table2 );
			this.appendChild( this.tableSet );
	

		let row,label;

                row = this.forcedSale;
                row.className = 'stock-sell-row-stock-forced';
		row.style.display = "none";
                label = document.createElement( "span" );
                label.className = 'stock-sell-stock-forced';
                label.textContent = "Required to sell:";
                row.appendChild( label );
                row.appendChild( this.forcedSaleAmount );
		this.forcedSaleAmount.textContent = "$0";
                this.forcedSaleAmount.className = 'stock-sell-stock-forced-value';
                this.appendChild( row );

                
                row = document.createElement( "div" );
                row.className = 'stock-sell-row-stock';
                label = document.createElement( "span" );
                label.className = 'stock-sell-label-stock';
                label.textContent = "Selling:";
                row.appendChild( label );
                row.appendChild( this.stockName );
		this.stockName.textContent = "Stock Name Goes Here";
                this.stockName.className = 'stock-sell-value-stock';
                this.appendChild( row );

                row = document.createElement( "div" );
                row.className = 'stock-sell-row-cost';
                label = document.createElement( "span" );
                label.className = 'stock-sell-label-cost';
                label.textContent = "For:";
                row.appendChild( label );
                row.appendChild( this.sellsFor );
                this.sellsFor.className = 'stock-sell-value-cost';
		this.sellsFor.textContent = "$$$$";
                this.appendChild( row );


                row = document.createElement( "div" );
                row.className = 'stock-sell-row-amount';
                label = document.createElement( "span" );
                label.className = 'stock-sell-label-amount';
                label.textContent = "Selected Shares:";
                row.appendChild( label );
                row.appendChild( this.shares );
		this.shares.size=5;
                this.shares.className = 'stock-sell-value-amount';
                this.appendChild( row );


                row = document.createElement( "div" );
                row.className = 'stock-sell-row-spend';

                label = document.createElement( "span" );
                label.className = 'stock-sell-label-spend';
                label.textContent = "Total Value:";
                row.appendChild( label );
                row.appendChild( this.cost );
                this.cost.className = 'stock-sell-value-spend';
		this.cost.textContent = "$0";
                this.appendChild( row );

        	
                row = document.createElement( "div" );
                row.className = 'stock-sell-row-spend';

                label = document.createElement( "span" );
                label.className = 'stock-sell-label-spend';
                label.textContent = "You already have:";
                row.appendChild( label );
                row.appendChild( this.owned );
                this.owned.className = 'stock-sell-value-owned';
		this.owned.textContent = "0";
                this.appendChild( row );

        	
                row = document.createElement( "div" );

	        this.shareMode = popups.makeButton( row, "Buy Shares", ()=>this.setShares( ) ) 
		this.shareMode.className = "stock-sell-button-enable-shares";
		this.shareMode.buttonInner.className = "stock-sell-inner-button-enable-share";

		this.cashMode = popups.makeButton( row, "Use Cash", ()=>this.setCash( ) ) 
		this.cashMode.className = "stock-sell-button-disable-cash";
		this.cashMode.buttonInner.className = "stock-sell-inner-button-disable-cash";
                row.appendChild( document.createElement( "br" ) );


       		row.className = "stock-sell-container-buttons";
		[1,5,10,50,100,500].forEach( val=>{
	                const button = popups.makeButton( row, ''+val,((val)=>( ()=>this.press( val ) ))(val) );
                        button.className = "stock-sell-button-add";
                        button.buttonInner.className = "stock-sell-inner-button-add";
			button.buttonInner.style.width = "";
			button.style.width = '';
                } );
                        
                row.appendChild( document.createElement( "br" ) );

		[-1,-5,-10,-50,-100,-500].forEach( val=>                {
	                const button = popups.makeButton( row, ''+val,((val)=>( ()=>this.press( val ) ))(val) ) 
                        button.className = "stock-sell-button-sub";
                        button.buttonInner.className = "stock-sell-inner-button-sub";
			button.buttonInner.style.width = "";
			button.style.width = '';
                });

                row.appendChild( document.createElement( "br" ) );

                this.appendChild( row )

                row = document.createElement( "div" );
                row.className = "stock-sell-container-buttons";
	        const cancel = popups.makeButton( row, "Cancel", ()=>this.on( "cancel" ) ) 
		cancel.className = "stock-sell-button-cancel";
		cancel.buttonInner.className = "stock-sell-inner-button-cancel";
		cancel.buttonInner.style.width = "";
		cancel.style.width = '';
	        const buy = popups.makeButton( row, "Sell", ()=>this.makeSale( ) ) 
		buy.className = "stock-sell-button-accept";
		buy.buttonInner.className = "stock-sell-inner-button-accept";
		buy.buttonInner.style.width = "";
		buy.style.width = '';
                row.appendChild( document.createElement( "br" ) );

                this.appendChild( row )

		this.on("cancel",()=>{
			this.hide();
			protocol.sendNoSale();
		} );
		protocol.on("pay",()=>{
			if( protocol.gameState.thisPlayer.cash < 0 ) 
				this.show( protocol.gameState.thisPlayer, null, -protocol.gameState.thisPlayer.cash );
		} );
		this.center();
		this.hide();
        }

	show( player, stock, forced ) {

		this.stock = stock;
		
		this.target = forced;
		if( forced && !stock ) {
			this.forcedSale.style.display = "";
			this.forcedSaleAmount.textContent = popups.utils.to$( this.target*100 );
		} else {
			if( !stock && !forced ) {
				this.forcedSale.style.display = "none";
			}
		}

		console.log( "Is player and stock enough?", player, stock );
		if( stock ) {
			for( let pstock of player.stocks ) {
				if( pstock.id === stock.id ) {
					this.owned.textContent = pstock.shares;
					this.stockName.textContent = stock.name;
					this.sellsFor.textContent = popups.utils.to$((this.target?stock.minValue:stock.value)*100);
					break;
				}
			}
		}else {
			this.curRow = null;
			this.shareCount	= 0;
			this.shares.value = this.shareCount;
			for( let row of this.rows ) {
				row.button.buttonInner.className = "button-inner-stock-sell-select-disabled";
				row.selected = false;
				row.wantShares = 0;
				row.refresh();
			}			
			this.cost.textContent = popups.utils.to$(0);
			// all stocks.
		}
		for( let row of this.rows ) row.refresh();
		super.show();
		if( !stock ) {
			protocol.sendSelling();
			this.center();
		}

	}

	makeSale() {
		const  getStockName = (id)=> {
			const stock = this.stocks.find( stock=>stock.id===id);
			return stock.name;
		}

		let sale = this.#lastSale = this.rows.map( (row)=>({
			shares:row.wantShares, stock:row.stock.id
		})).filter( item=>item.shares );
		let msg = "Are you sure you want to Sell:<br>";
		sale.forEach( item=>msg = msg+item.shares+(item.shares===1?" share":" shares")+" of " +getStockName( item.stock ) + "<BR>")
		msg += "for: " + this.cost.textContent;
		const okay = ()=>{
				protocol.sendSale( this.target, this.#lastSale );
				this.hide();
			}
		if( !this.saleConfirmNotice ) 
			this.saleConfirmNotice = popups.simpleNotice( "Confirm", null, okay, ()=>{
				
			});
		this.saleConfirmNotice.textOutput.innerHTML = msg;
		this.saleConfirmNotice.show();
		this.saleConfirmNotice.center();
	}

	set cash( val ) {
		this.cash = val;
	}

	set stock( val ) {
		this.stockName.textContent = val.name;
		const value = ( this.target ) ? val.minValue:val.value;
		this.sellsFor.textContent = popups.utils.to$(value);
		this.shareCount = 0;		
		this.center();
	}

	setCash() {
	}
	setShares() {
	}

	setShareCount( n ) {
		if( this.curRow ) {
			//if( n > this.curRow.userStock.shares ) n = this.curRow.userStock.shares;

			this.shares.value = this.shareCount;
			this.curRow.wantShares = this.shareCount;

			let tot = 0;
			for( let row of this.rows ) {
				if( row.wantShares ) {
					tot += row.wantShares * (this.target?row.stock.minValue:row.stock.value);
				}
			}

			//const cost = this.shareCount * this.stock.value;
			this.cost.textContent = popups.utils.to$(tot*100);

			this.curRow.refresh();
		}
		else {

			this.cost.textContent = "Select stock to sell."

		}
	}
	press( n ) {
		console.log( "Want to add N shares(dollars?", n );
		if( this.stock ) {			
			this.shareCount += n;
			if( this.shareCount > this.curRow.userStock.shares )
				this.shareCount = this.curRow.userStock.shares;
			if( this.shareCount < 0 ) this.shareCount = 0;
	
			this.setShareCount( this.shareCount );

		} else {
			this.cost.textContent = "Select stock to sell."
		}
	}

	addRow( userStock, table ) {
		const stock = userStock && this.stocks.find( stock=>stock.id===userStock.id );
		const form = this;
		const row = {
			row : document.createElement( "div" ),
			label : document.createElement( "span" ),
			price : document.createElement( "span" ),
			value : document.createElement( "span" ),
			shares : document.createElement( "span" ),
			sellValue : document.createElement( "span" ),
			sellShares : document.createElement( "span" ),
			button : null,
			wantShares : 0,
			stock,
			userStock,
			selected : false,
			refresh() {
				let val= 0;
				if( form.target ) 
					row.value.textContent = popups.utils.to$((val=row.stock.minValue)*100);
				else
					row.value.textContent = popups.utils.to$((val=row.stock.value)*100);
				row.shares.textContent = row.userStock.shares;
				row.sellShares.textContent = row.wantShares;
				row.sellValue.textContent = row.wantShares * val;
				if( row.userStock.shares ) row.row.style.display = "";
				else row.row.style.display = "none";
			}
		};

		if( !userStock ) {

			//row = document.createElement( "div" );
			row.row.className = 'stock-sell-status-row-stock-'+(stock?stock.symbol:"header");

			row.label.className = 'stock-sell-status-cell-label-' +( stock?stock.symbol:"header");
			row.label.textContent = "Stock Name";

			row.value.className = 'stock-sell-status-cell-value-' + (stock?stock.symbol:"header");
			row.value.textContent = "Sells For";

			row.shares.className = 'stock-sell-status-cell-shares-' +( stock?stock.symbol:"header");
			row.shares.textContent = "You Have";

			row.sellValue.className = 'stock-sell-status-cell-sell-value-' + (stock?stock.symbol:"header");
			row.sellValue.textContent = "Total";

			row.sellShares.className = 'stock-sell-status-cell-sell-shares-' +( stock?stock.symbol:"header");
			row.sellShares.textContent = "selling";

			row.price.className = 'stock-sell-status-cell-price-' + (stock?stock.symbol:"header");
			row.price.textContent = "$??";
			row.row.appendChild( document.createElement('div'));
			row.row.appendChild( row.label );
			//row.row.appendChild( row.price );
			row.row.appendChild( row.shares );
			row.row.appendChild( row.value );
	
			row.row.appendChild( row.sellShares );
			row.row.appendChild( row.sellValue );
	
			table.appendChild( row.row );
	
			return;
		}

		//row = document.createElement( "div" );
		row.row.className = 'stock-sell-status-row-stock-'+stock.symbol;

		row.label.className = 'stock-sell-status-cell-label-' + stock.symbol;
		row.label.textContent = stock.name;

		row.value.className = 'stock-sell-status-cell-value-' + stock.symbol;
		row.value.textContent = stock.symbol;

		row.shares.className = 'stock-sell-status-cell-shares-' + stock.symbol;
		row.shares.textContent = 0;

		row.sellValue.className = 'stock-sell-status-cell-sell-value-' + stock.symbol;
		row.sellValue.textContent = stock.symbol;

		row.sellShares.className = 'stock-sell-status-cell-sell-shares-' + stock.symbol;
		row.sellShares.textContent = 0;

		row.price.className = 'stock-sell-status-cell-price-' + stock.symbol;
		row.price.textContent = "$??";

		const button = row.button = popups.makeButton( row.row, "Select",()=>{
			row.selected = !row.selected;
			if( row.selected ) {
				for( let oldrow of this.rows ) { if( oldrow != row && oldrow.selected ){
					oldrow.selected = false;
					oldrow.button.buttonInner.className = "button-inner-stock-sell-select-disabled";
				} }
				row.button.buttonInner.className = "button-inner-stock-sell-select-enabled";
				this.curRow = row;
				this.shareCount = row.wantShares;
				this.shares.value = this.shareCount;

				this.show( protocol.gameState.thisPlayer, row.stock, form.target );



			} else {
				row.button.buttonInner.className = "button-inner-stock-sell-select-disabled";
			}
		});
		button.className = "button-stock-sell-select";
		button.buttonInner.className = "button-inner-stock-sell-select-disabled";
		button.buttonInner.style.width = "";
		button.style.width = '';
		

		row.row.appendChild( row.label );
		//row.row.appendChild( row.price );
		row.row.appendChild( row.shares );
		row.row.appendChild( row.value );

		row.row.appendChild( row.sellShares );
		row.row.appendChild( row.sellValue );

		table.appendChild( row.row );
		this.rows.push( row );
	
	}

}

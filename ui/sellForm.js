
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"
import * as protocol from "./gameProtocol.js"

export class SellForm extends Popup {
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
        
	constructor( parent ) {
        	super( "Sell Stocks", parent, {suffix:"-sell"} );

		let row,label;
                
                row = document.createElement( "div" );
                row.className = 'stock-sell-row-stock';
                label = document.createElement( "span" );
                label.className = 'stock-sell-label-stock';
                label.textContent = "Buy";
                row.appendChild( label );
                row.appendChild( this.stockName );
		this.stockName.textContent = "Stock Name Goes Here";
                this.stockName.className = 'stock-sell-value-stock';
                this.appendChild( row );

                row = document.createElement( "div" );
                row.className = 'stock-sell-row-cost';
                label = document.createElement( "span" );
                label.className = 'stock-sell-label-cost';
                label.textContent = "For";
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
                label.textContent = "Total Cost:";
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
	        const buy = popups.makeButton( row, "Buy", ()=>this.buy( ) ) 
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
		this.center();
		this.hide();
        }

	show( player, stock, forced ) {
		this.stock = stock;
		this.target = forced;

		console.log( "Is player and stock enough?", player, stock );
		for( let pstock of player.stocks ) {
			if( pstock.id === stock.id ) {
				this.owned.textContent = pstock.shares;
				this.stockName.textContent = stock.name;
				this.sellsFor.textContent = stock.value;
				break;
			}
		}
		super.show();
		this.center();

	}

	buy() {
		protocol.sendBuy( this.stock, this.shareCount );
	}

	set cash( val ) {
		this.cash = val;
	}

	set stock( val ) {
		this.stockName.textContent = val.name;
		this.sellsFor.textContent = popups.utils.to$(val.value);
		this.shareCount = 0;		
		this.center();
	}

	setCash() {
	}
	setShares() {
	}
	press( n ) {
		console.log( "Want to add N shares(dollars?", n );
		this.shareCount += n;
		if( this.shareCount < 0 ) this.shareCount = 0;

		this.shares.value = this.shareCount;
		const cost = this.shareCount * this.stock.value;
		this.cost.textContent = cost;
	}
}

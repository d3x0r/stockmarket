
import {Popup,popups} from "/node_modules/@d3x0r/popups/popups.mjs"
import * as protocol from "./gameProtocol.js"

export class BuyForm extends Popup {
	stockName = document.createElement( "span" );
	sellsFor = document.createElement( "span" );
	shares = document.createElement( "input" );
	cost = document.createElement( "span" );
	owned = document.createElement ("span" );

	// buttons to control share/cash - style class parts change
	shareMode = null;
	cashMode = null;
	useCash = false;
	change = 0;
	shareCount = 0;
	cash = 0;
	stock = null;
	subs = null;
	adds = null;
	limit = Infinity;
        
	constructor( parent ) {
        	super( "Buy Stocks", parent, {suffix:"-buy"} );

		let row,label;
                protocol.on( "market", ()=>{
					if( this.stock ) {
						if( this.useCash ) {
							const cash = this.shareCount * this.stock.value;
							if( cash > this.cash ) this.cash = cash;
							this.change = this.cash - cash;

						}else
							this.cash = this.shareCount * this.stock.value;
						this.sellsFor.textContent = '$'+this.stock.value;
						this.refresh();
					}
				})
                row = document.createElement( "div" );
                row.className = 'stock-buy-row-stock';
                label = document.createElement( "span" );
                label.className = 'stock-buy-label-stock';
                label.textContent = "Buy";
                row.appendChild( label );
                row.appendChild( this.stockName );
		this.stockName.textContent = "Stock Name Goes Here";
                this.stockName.className = 'stock-buy-value-stock';
                this.appendChild( row );

                row = document.createElement( "div" );
                row.className = 'stock-buy-row-cost';
                label = document.createElement( "span" );
                label.className = 'stock-buy-label-cost';
                label.textContent = "For:";
                row.appendChild( label );
                row.appendChild( this.sellsFor );
                this.sellsFor.className = 'stock-buy-value-cost';
		this.sellsFor.textContent = "$$$$";
                this.appendChild( row );


                row = document.createElement( "div" );
                row.className = 'stock-buy-row-amount';
                label = document.createElement( "span" );
                label.className = 'stock-buy-label-amount';
                label.textContent = "Selected Shares:";
                row.appendChild( label );
                row.appendChild( this.shares );
		this.shares.size=5;
                this.shares.className = 'stock-buy-value-amount';
                this.appendChild( row );


                row = document.createElement( "div" );
                row.className = 'stock-buy-row-spend';

                label = document.createElement( "span" );
                label.className = 'stock-buy-label-spend';
                label.textContent = "Total Cost:";
                row.appendChild( label );
                row.appendChild( this.cost );
                this.cost.className = 'stock-buy-value-spend';
		this.cost.textContent = "$0";
                this.appendChild( row );

        	
                row = document.createElement( "div" );
                row.className = 'stock-buy-row-spend';

                label = document.createElement( "span" );
                label.className = 'stock-buy-label-spend';
                label.textContent = "You already have:";
                row.appendChild( label );
                row.appendChild( this.owned );
                this.owned.className = 'stock-buy-value-owned';
		this.owned.textContent = "0";
                this.appendChild( row );

        	
                row = document.createElement( "div" );

	        this.shareMode = popups.makeButton( row, "Buy Shares", ()=>this.setShares( ) ) 
		this.shareMode.className = "stock-buy-button-enable-shares";
		this.shareMode.buttonInner.className = "stock-buy-inner-button-enable-share";
	        this.cashMode = popups.makeButton( row, "Use Cash", ()=>this.setCash( ) ) 
		this.cashMode.className = "stock-buy-button-disable-cash";
		this.cashMode.buttonInner.className = "stock-buy-inner-button-disable-cash";
                row.appendChild( document.createElement( "br" ) );


       		row.className = "stock-buy-container-buttons";
		this.adds = [1,5,10,50,100,500].map( val=>{
	                const button = popups.makeButton( row, ''+val,((val)=>( ()=>this.press( val ) ))(val) );
                        button.className = "stock-buy-button-add";
                        button.buttonInner.className = "stock-buy-inner-button-add";
			button.buttonInner.style.width = "";
			button.style.width = '';
			return button;
                } );
                        
                row.appendChild( document.createElement( "br" ) );

		this.subs = [-1,-5,-10,-50,-100,-500].map( val=>                {
	                const button = popups.makeButton( row, ''+val,((val)=>( ()=>this.press( val ) ))(val) ) 
                        button.className = "stock-buy-button-sub";
                        button.buttonInner.className = "stock-buy-inner-button-sub";
			button.buttonInner.style.width = "";
			button.style.width = '';
			return button;
                });

                row.appendChild( document.createElement( "br" ) );

                this.appendChild( row )

                row = document.createElement( "div" );
                row.className = "stock-buy-container-buttons";
	        const cancel = popups.makeButton( row, "Cancel", ()=>this.on( "cancel" ) ) 
		cancel.className = "stock-buy-button-cancel";
		cancel.buttonInner.className = "stock-buy-inner-button-cancel";
		cancel.buttonInner.style.width = "";
		cancel.style.width = '';
	        const buy = popups.makeButton( row, "Buy", ()=>this.buy( ) ) 
		buy.className = "stock-buy-button-accept";
		buy.buttonInner.className = "stock-buy-inner-button-accept";
		buy.buttonInner.style.width = "";
		buy.style.width = '';
                row.appendChild( document.createElement( "br" ) );

                this.appendChild( row )

		this.on("cancel",()=>{
			this.hide();
			protocol.sendNoSale();
		} );

		this.hide();
        }

	show( player, stock, limit ) {
		this.limit = limit;
		if( limit === 1 ) {
			this.hideButtons();
		}else {
			this.showButtons();

		}
		this.stock = stock;
		this.change = 0;
		this.cash = this.shareCount * this.stock.value;

		for( let pstock of player.stocks ) {
			if( pstock.id === stock.id ) {
				this.owned.textContent = pstock.shares;
				this.stockName.textContent = stock.name;
				this.sellsFor.textContent = '$'+stock.value;
				break;
			}
		}
		this.refresh();
		super.show();
		this.center();
	}

	hideButtons() {
		for( let i = 1; i < this.adds.length; i++ ){
			this.adds[i].hide();
			this.subs[i].hide();
		}
		this.shareCount = 1;

		this.refresh();
	}

	showButtons() {
		for( let i = 1; i < this.adds.length; i++ ){
			this.adds[i].show();
			this.subs[i].show();
		}
		this.shareCount = 0;

		this.refresh();
	}

	buy() {
		
		protocol.sendBuy( this.stock, this.shareCount );
		this.hide();
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
		this.useCash = true;
		this.shareMode.className = "stock-buy-button-disable-shares";
		this.shareMode.buttonInner.className = "stock-buy-inner-button-disable-share";
		this.cashMode.className = "stock-buy-button-enable-cash";
		this.cashMode.buttonInner.className = "stock-buy-inner-button-enable-cash";
	}
	setShares() {
		this.useCash = false;
		this.shareMode.className = "stock-buy-button-enable-shares";
		this.shareMode.buttonInner.className = "stock-buy-inner-button-enable-share";
		this.cashMode.className = "stock-buy-button-disable-cash";
		this.cashMode.buttonInner.className = "stock-buy-inner-button-disable-cash";
	}
	refresh() {

		this.shares.value = this.shareCount;

		if( this.change )
			this.cost.textContent = '$'+this.cash + " change: $" + this.change;
		else
			this.cost.textContent = '$'+this.cash;

	}
	press( n ) {
		console.log( "Want to add N shares(dollars?", n );
		this.change = 0;
		if( this.useCash ) {
			this.cash += n;
			this.shareCount = Math.floor( this.cash / this.stock.value );
			if( this.shareCount > this.limit ) this.shareCount = this.limit;
			this.change = this.cash - (this.stock.value * this.shareCount);					
		} else {
			this.shareCount += n;
			if( this.shareCount > this.limit ) this.shareCount = this.limit;
			if( this.shareCount < 0 ) this.shareCount = 0;

			this.cash = this.shareCount * this.stock.value;
			// change is 0.
		}
		this.refresh();
	}
}

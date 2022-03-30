


export class Stock {
	name = null;
	split = null;
        id = 0;

	#game = null;
	constructor( game, stock ) {
		this.#game = game;

        	this.id = stock.ID;
                this.name = stock.stock;
                this.color = stock.color;
                this.symbol = stock.symbol;
                this.minimum = stock.minimum;
        	this.inversed = stock.inversed;
        	this.baseline = stock.baseline;
        	this.dividend = stock.dividend;
		const parts = stock.staging.split(' ' );
		const fracs = [parts[0].split('/'),parts[1].split('/' )];
	
        	this.staging = {
			one:{num:Number(fracs[0][0]),den:Number(fracs[0][1]||1)},
			two:{num:Number(fracs[1][0]),den:Number(fracs[1][1]||1)}};
        }

	get value() {
		const line = this.#game.marketLine;
		const market = this.#game.market;
		for( let stock of market.stocks ) {
			if( stock.id === this.id ) {
				return stock.lines[line];
			}
		}
		return 0;
	}
}






export class Stock {
	name = null;
        id = 0;
	constructor( stock ) {
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
			one:{num:fracs[0][0],den:fracs[0][1]||1},
			two:{num:fracs[1][0],den:fracs[1][1]||1}};
        }
}



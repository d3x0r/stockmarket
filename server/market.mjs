
import stocks from "./stocks.jsox"


export class Market {
	stocks = [];
	// precomputes market lines from stock information
	constructor(stockList) {
		const stages = stocks.stages;

		for( let s = 0; s < stockList.length; s++ ) {
			const stock = stockList[s];
			const marketLines = Array.from( {length:stages*2+1} );
			//const values = stockList.map( s=>s.minimum );
			this.stocks.push( { id:stock.id, minimum:stock.minimum, lines:marketLines } );
			for( let line = 0; line <= stages; line++ ) {
				let staging = stock.staging[0];
				let val;
				if( line > stocks.secondStagingStarts ) {

				        const effectivestage = line - stocks.secondStagingStarts;
					const val1 = stocks.secondStagingStarts * stock.staging.one.num / stock.staging.one.den ;
					const val2 = effectivestage * stock.staging.two.num / stock.staging.two.den ;
						
					marketLines[stages+(stock.inversed?-1:1)*line] = stock.baseline + ((val1+val2)|0);
					marketLines[stages-(stock.inversed?-1:1)*line] = stock.baseline - ((val1+val2)|0);
				}
				else {
					const val1 = line * stock.staging.one.num / stock.staging.one.den ;
				
					marketLines[stages-(stock.inversed?-1:1)*line] = stock.baseline - ((val1)|0);
					if( line )
						marketLines[stages+(stock.inversed?-1:1)*line] = stock.baseline+(val1)|0;
				}
				
			}
			
		}
		//console.log( "market:", this );
	}



}

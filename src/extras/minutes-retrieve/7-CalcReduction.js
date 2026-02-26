const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

const minutesAfterResolved = require('./minutesAfterResolved.json');
const minutesBeforeResolved = require('./minutesBeforeResolved.json');

const minutesReduction = {};

for (let i = 0; i < minutesAfterResolved.length; ++i) {
	const before = minutesBeforeResolved.find(item => item.id === minutesAfterResolved[i].id);
	if (before !== null && before !== undefined) {
		const difference = before.minutes - minutesAfterResolved[i].minutes;
		if(difference > 0) minutesReduction[before.id] = difference;
	}	
}

console.log(JSON.stringify(minutesReduction, null, 2));

console.log(Object.keys(minutesReduction).reduce((a, b) => {return minutesReduction[a] + minutesReduction[b];}, 0));
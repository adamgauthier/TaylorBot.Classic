const fs = require('fs');

if (fs.existsSync('minutes.json'))
	throw new Error('process done');

const minutes = {};
	
const data = require(`${__dirname}/data.json`);

const startTime = new Date();

for(let timestamp = 1473566429; timestamp <= 1482880174; timestamp += 60) {
	((time) => {
		console.log(new Date(time*1000).toUTCString());
		const timeRows = data.filter(r => r.date > time-600 && r.date < time);		
		const uniqueIds = [];

		timeRows.forEach((r) => {
			if (uniqueIds.indexOf(r.author) == -1) {
				uniqueIds.push(r.author);		
			} 
		});
		
		uniqueIds.forEach(id => {			
			if (minutes[id] == undefined) minutes[id] = 0;
			else minutes[id]++;
		});
		
	})(timestamp);
}


fs.writeFileSync('minutes.json', JSON.stringify(minutes, null, 2));
console.log(`Done! Procedure took ${(new Date() - startTime)/1000} seconds`);
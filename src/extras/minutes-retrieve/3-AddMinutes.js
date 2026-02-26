const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

const fs = require('fs');
const minutes = require('./minutes.json');

const totalMinutes = {};

const now = new Date();

Object.keys(minutes).forEach(key => {
    const value = minutes[key];
		db.get('SELECT minutes FROM userByServer WHERE `serverId` = ? AND `id` = ?', ['115332333745340416', key], (err, row) => {
			if (err) console.log(err);
			else {
				if (Object.keys(totalMinutes).includes(key)) throw new Error(`ALREADY CONTAINS ${key}`);
				
				if (!row) {
					console.log(`${key} was not in db.`);
					totalMinutes[key] = value;
				}  
				else {
					totalMinutes[key] = row.minutes + value;
				}
			}
			
			console.log(new Date() - now);
		});
});

setTimeout(() => {
	fs.writeFileSync('totalminutes.json', JSON.stringify(totalMinutes, null, 2));
}, 5000);
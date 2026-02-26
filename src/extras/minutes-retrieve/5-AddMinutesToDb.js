const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

const totalMinutes = require('./totalminutes.json');

Object.keys(totalMinutes).forEach(key => {
    const value = totalMinutes[key];
		
		db.run('UPDATE userByServer SET `minutes` = ? WHERE `id` = ? AND `serverId` = ?', [value, key, '115332333745340416'], err => {
			if (err) console.log(err);
			else {
				console.log(`Set ${value} to ${key}`);
			}
		});
		
});
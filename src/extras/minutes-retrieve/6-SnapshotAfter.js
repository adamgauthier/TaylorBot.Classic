const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');
const fs = require('fs');

db.all('SELECT id, minutes FROM userByServer WHERE `serverId` = ?', ['115332333745340416'], (err, rows) => {
	fs.writeFileSync('minutesAfterResolved.json', JSON.stringify(rows, null, 2));
});

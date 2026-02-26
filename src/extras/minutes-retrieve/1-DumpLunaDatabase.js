const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : 'test',
	supportBigNumbers : true
});

const fs = require('fs');


connection.connect();
	
connection.query(`SELECT author, UNIX_TIMESTAMP(date) AS date FROM messages`, (err, rows, fields) => {
	if (err) throw err;
	fs.writeFileSync('data.json', JSON.stringify(rows, null, 2));
	console.log(`done`);
});

connection.end();
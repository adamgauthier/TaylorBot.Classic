const fs = require('fs');
const data = require('./data.json');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const userData = [];

db.all('SELECT id, firstJoinedAt FROM userByServer WHERE serverId = ?',
['115332333745340416'], (err, rows) => {
    if (err) console.error(err);
    else {
        data.forEach(e => {
            const id = e[0];
            const username = e[1];
            const messages = e[2];

            rows.forEach(r => {
                if (r.id === id) {
                    if (r.firstJoinedAt > 0) {
                        userData.push({id, username, messages, 'joinedAt': r.firstJoinedAt});
                    }
                }
            });
        });
        fs.writeFileSync('data2.json', JSON.stringify(userData, null, 2));
    }
});

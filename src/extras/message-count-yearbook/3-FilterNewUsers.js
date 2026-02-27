const data = require('./data2.json');

const moment = require('moment');
const fs = require('fs');

const start = moment('2016-11-22');
const end = moment('2017-11-22');

const mostActiveUsers = [];

data.forEach(user => {
    const joined = moment(user.joinedAt, 'x');

    if (joined.isBetween(start, end)) {
        mostActiveUsers.push(user);
    }
});

fs.writeFileSync('data3.json', JSON.stringify(mostActiveUsers, null, 2));

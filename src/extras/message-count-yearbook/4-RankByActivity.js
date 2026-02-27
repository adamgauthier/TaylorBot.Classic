const data = require('./data3.json');

const moment = require('moment');
const fs = require('fs');

const end = moment('2017-11-22');

const ratioUsers = [];

data.forEach(user => {
    const joined = moment(user.joinedAt, 'x');

    const diffDays = end.diff(joined, 'days');
    if (diffDays > 30) {
        const diff = end.diff(joined);

        const messagesPerDay = user.messages / diff * 1000 * 60 * 60 * 24;
        ratioUsers.push(Object.assign({ messagesPerDay }, user));
    }
});

fs.writeFileSync('data4.json', JSON.stringify(ratioUsers.sort((a, b) => b.messagesPerDay - a.messagesPerDay), null, 2));

const moment = require('moment');

const users = require('./data4.json');

const top20users = [];

for (let i = 0; i < 19; ++i) {
    const user = users[i];
    top20users.push(user);
}

top20users.sort((a, b) => a.joinedAt - b.joinedAt);

for (const user of top20users) {
    const joinedAt = moment(`${user.joinedAt}`, 'x');

    console.log(joinedAt.format("MMMM Do YYYY") + " - " + user.username);
}

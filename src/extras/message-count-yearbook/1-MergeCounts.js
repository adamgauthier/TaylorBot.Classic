const csv = require('csv');
const fs = require('fs');

const oldfile = fs.readFileSync('old.csv');
const newfile = fs.readFileSync('new.csv');


csv.parse(oldfile, (err, oldData) => {
    csv.parse(newfile, (err, newData) => {
        for (const oldLine of oldData) {
            const oldId = oldLine[0];
            const oldUsername = oldLine[1];
            const oldMessageCount = parseInt(oldLine[2]);
            oldLine[2] = oldMessageCount;

            for (const newLine of newData) {
                const newId = newLine[0];
                const newUsername = newLine[1];
                const newMessageCount = parseInt(newLine[2]);

                if (oldId === newId) {
                    oldLine[2] = oldMessageCount + newMessageCount;
                }
            }
        }

        for (const newLine of newData) {
            const newId = newLine[0];
            const newUsername = newLine[1];
            const newMessageCount = parseInt(newLine[2]);

            let found = false;

            for (const oldLine of oldData) {
                const oldId = oldLine[0];
                const oldUsername = oldLine[1];
                const oldMessageCount = parseInt(oldLine[2]);

                if (newId === oldId) {
                    found = true;
                }
            }

            if (!found) {
                oldData.push(newLine);
            }
        }

        fs.writeFileSync('data.json', JSON.stringify(oldData.sort((a, b) => b[2] - a[2]), null, 2));
    });
});

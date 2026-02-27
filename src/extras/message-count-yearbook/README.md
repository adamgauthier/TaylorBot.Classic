# message-count-yearbook

A set of one-off Node.js scripts used in **November–December 2017** to identify the **most active new members** of the r/TaylorSwift Discord server for the **Year 2 server anniversary yearbook**.

## Context

The r/TaylorSwift Discord server was created on **November 22, 2015**. For the 1st anniversary (2016), a yearbook was put together by Mym from survey results. For the **2nd anniversary (November 22, 2017)**, I wanted to add a "most active new members" section highlighting users who joined during Year 2 and were the most engaged.

TaylorBot tracked cumulative message counts in its SQLite database, but these were all-time totals with no way to isolate a specific year. To get accurate per-user message counts for the Year 2 period, the data had to come from an external source.

## The Data

[**@EnchantedLuna**](https://github.com/EnchantedLuna/) ran FearlessBot, a separate bot that logged server message events in a MySQL database.

Luna provided two CSV files with per-user message counts from FearlessBot **between November 22, 2016 and November 22, 2017**. The data was split across two files because the MySQL query was partitioned by row ID (at ~4 million rows). Each CSV had the format `userId,username,messageCount`.

## Pipeline

The scripts were written on **November 25–27, 2017** and process the data sequentially:

- [`1-MergeCounts.js`](1-MergeCounts.js): Parse and merge the two FearlessBot CSV files. For users appearing in both files, add their message counts together. Output a single combined list sorted by total messages.
- [`2-EnrichJoinDates.js`](2-EnrichJoinDates.js): For each user, look up their `firstJoinedAt` timestamp from TaylorBot's SQLite database. Only includes users with a recorded join date.
- [`3-FilterNewUsers.js`](3-FilterNewUsers.js): Filter to users who joined the server between November 22, 2016 and November 22, 2017 (Year 2).
- [`4-RankByActivity.js`](4-RankByActivity.js): For users active for more than 30 days, calculate `messagesPerDay = totalMessages / daysSinceJoining` and rank by this ratio.
- [`5-FormatResults.js`](5-FormatResults.js): Take the top 19 users, sort by join date, and print formatted output for the yearbook. Added on **December 21** when the yearbook was being finalized.

### Inputs (not included)

- Two CSV files from FearlessBot's MySQL database (`old.csv` and `new.csv`, named after the two query partitions, not time periods)
- TaylorBot's SQLite database with the `userByServer` table containing `firstJoinedAt` timestamps

### Output

A ranked list of the most active new members for the Year 2 yearbook, measured by average messages per day since joining.

## Legacy

This was the **first time activity statistics were included in the server yearbook**. The tradition continues today: the modern [yearbook system](https://github.com/adamgauthier/TaylorBot/tree/main/src/taylorbot-postgres/misc/yearbook) (2018–present) queries PostgreSQL database dumps, tracks both messages and minutes, and generates personalized recap images.

## Running

These scripts are provided for historical purposes. A [`package.json`](package.json) is included with period-accurate dependencies. They were originally run with Node 8 (LTS at the time), which you can reproduce with Docker:

```sh
docker run --rm -v "$(pwd):/app" -w /app node:8-slim npm install
```

### Sample data

Step 1 expects `old.csv` and `new.csv` in the working directory. Create sample CSVs:

```sh
docker run --rm -v "$(pwd):/app" -w /app node:8-slim node -e "
  require('fs').writeFileSync('old.csv', '119572982178906114,TaylorBot,500\n152785612250808320,UserA,300\n');
  require('fs').writeFileSync('new.csv', '119572982178906114,TaylorBot,200\n119341483219353602,UserB,400\n');
"
```

Step 2 expects a `database.db` with the [TaylorBot Classic schema](../../database.db.schema.sql) — specifically the `userByServer` table with `firstJoinedAt`. Create a sample database:

```sh
docker run --rm -v "$(pwd):/app" -w /app keinos/sqlite3 sqlite3 database.db \
  "CREATE TABLE userByServer (id TEXT NOT NULL, serverId TEXT NOT NULL, messages INTEGER NOT NULL DEFAULT 0, firstJoinedAt INTEGER DEFAULT 0, PRIMARY KEY(id, serverId));" \
  "INSERT INTO userByServer VALUES ('119572982178906114', '115332333745340416', 700, 1485000000000);" \
  "INSERT INTO userByServer VALUES ('152785612250808320', '115332333745340416', 300, 1488000000000);" \
  "INSERT INTO userByServer VALUES ('119341483219353602', '115332333745340416', 400, 1490000000000);"
```

### Running the pipeline

```sh
docker run --rm -v "$(pwd):/app" -w /app node:8-slim node 1-MergeCounts.js
docker run --rm -v "$(pwd):/app" -w /app node:8-slim node 2-EnrichJoinDates.js
docker run --rm -v "$(pwd):/app" -w /app node:8-slim node 3-FilterNewUsers.js
docker run --rm -v "$(pwd):/app" -w /app node:8-slim node 4-RankByActivity.js
docker run --rm -v "$(pwd):/app" -w /app node:8-slim node 5-FormatResults.js
```

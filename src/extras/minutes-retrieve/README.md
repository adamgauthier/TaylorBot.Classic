# minutes-retrieve

A set of one-off Node.js scripts used to **recalculate and correct inflated minute counts** for all users in the r/TaylorSwift Discord server. These scripts were written and executed over **December 27–31, 2016**.

## Context

TaylorBot had a feature to track "active minutes" for each user. Starting in [v0.4 (December 24, 2015)](../../../docs/release-notes.md), the previous "minutes online" system (based on Discord status) was replaced with "minutes active" (requiring a message sent in the last 10 minutes). The old values were preserved in an `oldminutes` column.

Every 60 seconds, an interval ran a SQL query that incremented the `minutes` column for every user who had sent a message in the last 10 minutes:

```sql
UPDATE userByServer SET minutes = minutes + 1 WHERE lastSpoke > [now - 10 minutes];
```

## The Bug

The minute-counting interval was managed through two lifecycle events. On `ready` (fired when the bot connects or reconnects to Discord), `startIntervals()` created the 60-second interval. On `disconnected` (fired when the bot loses connection), `stopIntervals()` cleared it. This ensured only one interval was active at a time.

On **September 11, 2016**, TaylorBot was migrated from discord.js v8 to v9+. During this migration, a subtle bug was introduced:

1. **Wrong event name:** discord.js v8 used a `"disconnected"` event, but v9+ renamed it to `"disconnect"`. The handler was not updated, so `stopIntervals()` **never fired** on disconnect.

2. **Missing cleanup on reconnect:** The `ready` event called `startIntervals()` without first calling `stopIntervals()`. Since intervals were never cleaned up on disconnect, each reconnect **stacked a new interval** on top of existing ones.

The result: after N reconnects, users accumulated N minutes per real minute. Over **3+ months** (September 11 – December 21), this silently inflated everyone's minutes.

## The Investigation

On **December 20, 2016**, Eric, a very active community member, had minutes that seem to be climbing too fast. Debug logging was added to track his minute count before and after each interval tick, which revealed the duplication. By **December 21**, the root cause was identified and fixed: `stopIntervals()` was added before `startIntervals()` in the `ready` handler, and the event name was corrected.

## The Recovery

The bug was fixed, but 3+ months of inflated data needed correction. The approach was to **replay the minutes algorithm** using an independent, authoritative source of message history.

[**@EnchantedLuna**](https://github.com/EnchantedLuna/) ran FearlessBot, a separate bot that recorded server message events in a MySQL database. A pre-filtered dump covering the affected period (September 11 to December 27, 2016) was provided as the source of truth with ~1.03M messages from 252 unique authors.

### Pipeline

The scripts took 3 inputs (not included in this archive as they contain personal data):
- FearlessBot's MySQL dump for the affected period (September 11 to December 27, 2016)
- TaylorBot's SQLite database dump from September 11, 2016 (the day of the v0.10 migration, before the bug), to get baseline minute counts
- TaylorBot's SQLite database dump from December 31, 2016, the latest production database used to apply the corrections in downtime.

The scripts were run sequentially:
- [`1-DumpLunaDatabase.js`](1-DumpLunaDatabase.js): Export message history (author ID + timestamp) from Luna's MySQL database to JSON.
- [`2-CalculateMinutes.js`](2-CalculateMinutes.js): Replay the minutes algorithm minute-by-minute from September 11 to December 27, 2016, counting users who sent a message in the preceding 10-minute window.
- [`3-AddMinutes.js`](3-AddMinutes.js): Merge recalculated minutes with existing values from the September 11 database backup.
- [`4-SnapshotBefore.js`](4-SnapshotBefore.js): Snapshot all minute counts from the production database before correction.
- [`5-AddMinutesToDb.js`](5-AddMinutesToDb.js): Write corrected minute totals to the production database.
- [`6-SnapshotAfter.js`](6-SnapshotAfter.js): Snapshot all minute counts from the production database after correction.
- [`7-CalcReduction.js`](7-CalcReduction.js): Compare before/after snapshots to verify the correction.

The hardcoded timestamps in `2-CalculateMinutes.js` (`1473566429` → `1482880174`) correspond to **September 11, 2016 → December 27, 2016**, from the moment the bug was introduced to the last message available in Luna's data.

### Impact

| Metric | Value |
|--------|-------|
| Users in the server | 815 |
| Users with recalculated minutes | 252 |
| Total minutes before correction | 4,956,448 |
| Total minutes after correction | 3,009,299 |
| Total minutes removed | 1,947,149 (39%) |
| Average inflation | 1.65× |
| Worst individual case | 3.2× inflated |

## Running

It's unlikely that anyone would want to run these scripts now, but a [`package.json`](package.json) is provided with period-accurate dependencies. They were originally run with Node 6 or 7 (current at the time), you can reproduce the environment with Docker:

```sh
docker run --rm -v "$(pwd):/app" -w /app node:7-slim npm install
```

### Step 1: MySQL dump

Step 1 reads from a MySQL database. You can start a MySQL instance with sample data:

```sh
docker run -d --name minutes-mysql -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=test mysql:5.7
# Wait ~15 seconds for MySQL to initialize, then seed it:
docker exec minutes-mysql mysql -u root test -e \
  "CREATE TABLE messages (author BIGINT, date DATETIME); \
   INSERT INTO messages VALUES (119572982178906114, '2016-10-01 12:00:00'), (119572982178906114, '2016-10-01 12:05:00');"
```

Then run step 1 using `--network container:minutes-mysql` so `localhost` resolves to the MySQL container:

```sh
docker run --rm --network container:minutes-mysql -v "$(pwd):/app" -w /app node:7-slim node 1-DumpLunaDatabase.js
```

This writes `data.json`. When done, clean up with `docker stop minutes-mysql && docker rm minutes-mysql`.

### Steps 2–7: SQLite pipeline

Steps 3–7 expect a `database.db` file in the working directory matching the [TaylorBot Classic schema](../../database.db.schema.sql) — specifically the `userByServer` table. You can create a sample database with:

```sh
docker run --rm -v "$(pwd):/app" -w /app keinos/sqlite3 sqlite3 database.db \
  "CREATE TABLE userByServer (id TEXT NOT NULL, serverId TEXT NOT NULL, minutes INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(id, serverId));" \
  "INSERT INTO userByServer VALUES ('119572982178906114', '115332333745340416', 500);"
```

```sh
docker run --rm -v "$(pwd):/app" -w /app node:7-slim node 2-CalculateMinutes.js
docker run --rm -v "$(pwd):/app" -w /app node:7-slim node 3-AddMinutes.js
docker run --rm -v "$(pwd):/app" -w /app node:7-slim node 4-SnapshotBefore.js
docker run --rm -v "$(pwd):/app" -w /app node:7-slim node 5-AddMinutesToDb.js
docker run --rm -v "$(pwd):/app" -w /app node:7-slim node 6-SnapshotAfter.js
docker run --rm -v "$(pwd):/app" -w /app node:7-slim node 7-CalcReduction.js
```

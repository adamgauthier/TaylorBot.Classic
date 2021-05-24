CREATE TABLE "user" (
    `id`    TEXT,
    `lastCommand`    INTEGER DEFAULT 0,
    `lastSeen`    INTEGER NOT NULL DEFAULT 0,
    `ignoreUntil`    INTEGER DEFAULT 0,
    `oldminutes`    INTEGER DEFAULT 0,
    `heist`    INTEGER DEFAULT 0,
    `cleverbot`    TEXT,
    `quizup`    TEXT,
    `steam`    TEXT,
    `lastfm`    TEXT,
    `snapchat`    TEXT,
    `tumblr`    TEXT,
    `age`    INTEGER,
    `favsong`    TEXT,
    `location`    TEXT,
    `bae`    TEXT,
    `gender`    TEXT,
    `timezone`    INTEGER,
    `remindme`    INTEGER,
    `remindmetext`    TEXT,
    `tempunit`    TEXT,
    `answered`    INTEGER DEFAULT 1,
    `instagram`    TEXT,
    PRIMARY KEY(`id`),
    FOREIGN KEY(`timezone`) REFERENCES `timezone`(`id`)
);

CREATE TABLE `usernames` (
    `userId`    TEXT NOT NULL,
    `username`    TEXT NOT NULL,
    `since`    INTEGER NOT NULL
);

CREATE TABLE `server` (
    `id`    TEXT NOT NULL,
    `prefix`    TEXT NOT NULL DEFAULT '!',
    PRIMARY KEY(id)
);

CREATE TABLE "modRole" (
    `id`    TEXT NOT NULL,
    `modOf`    TEXT,
    PRIMARY KEY(id)
);

CREATE TABLE "channel" (
    `id`    TEXT NOT NULL,
    `serverId`    TEXT,
    `messages`    INTEGER DEFAULT 0,
    PRIMARY KEY(id)
);

CREATE TABLE "gameChannel" (
    `id`    TEXT NOT NULL,
    `gameOf`    TEXT,
    PRIMARY KEY(id)
);

CREATE TABLE `logChannel` (
    `id`    TEXT NOT NULL,
    `logOf`    TEXT,
    PRIMARY KEY(id)
);

CREATE TABLE `spamChannel` (
    `id`    TEXT NOT NULL,
    `spamOf`    TEXT,
    PRIMARY KEY(id)
);

CREATE TABLE "userByServer" (
    `id`    TEXT NOT NULL,
    `serverId`    TEXT NOT NULL,
    `lastSpoke`    INTEGER NOT NULL DEFAULT 0,
    `messages`    INTEGER NOT NULL DEFAULT 0,
    `messagesMilestone`    INTEGER NOT NULL DEFAULT 0,
    `minutes`    INTEGER NOT NULL DEFAULT 0,
    `minutesMilestone`    INTEGER NOT NULL DEFAULT 0,
    `wordscount`    INTEGER NOT NULL DEFAULT 0,
    `wordsMilestone`    INTEGER NOT NULL DEFAULT 0,
    `taypoints`    INTEGER NOT NULL DEFAULT 0,
    `rpswins`    INTEGER NOT NULL DEFAULT 0,
    `heistprofits`    INTEGER NOT NULL DEFAULT 0,
    `heistruined`    INTEGER NOT NULL DEFAULT 0,
    `heistwins`    INTEGER NOT NULL DEFAULT 0,
    `totalrolls`    INTEGER NOT NULL DEFAULT 0,
    `rolls1989`    INTEGER NOT NULL DEFAULT 0,
    `firstJoinedAt`    INTEGER DEFAULT 0,
    PRIMARY KEY(id,serverId)
);

CREATE TABLE "timezone" (
    `id`    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    `abb`    TEXT NOT NULL,
    `name`    TEXT NOT NULL DEFAULT 'PLACEHOLDER',
    `msOffset`    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE `instagramChecker` (
    `instagramUsername`    TEXT NOT NULL,
    `serverId`    TEXT NOT NULL,
    `lastLink`    TEXT,
    PRIMARY KEY(instagramUsername,serverId)
);

CREATE TABLE "tumblrChecker" (
    `tumblrId`    TEXT NOT NULL,
    `serverId`    TEXT NOT NULL,
    `lastLink`    TEXT,
    PRIMARY KEY(tumblrId,serverId)
);

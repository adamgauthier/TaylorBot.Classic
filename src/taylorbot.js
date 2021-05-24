"use strict";

var config = require("./config.json");
var strings = require("./strings.json");
var Poll = require('./Poll.js');

var URL = require('url');
var fs = require('fs');
var exec = require('child_process').exec;

var Discord = require("discord.js");
var imgur = require('imgur-node-api');
var request = require('request');
var YouTube = require('youtube-node');
var Cleverbot = require("cleverbot-node");
var cleverbot = new Cleverbot();
var weather = require('weather-js');
var didYouMean = require('didyoumean');
var php = require('phpjs');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');
var wolfram = require('wolfram').createClient(config.wolframAPIKey);
var Color = require('color2');
var DeltaE = require('delta-e');
var wikipedia = require("wikijs");
var bignum = require('bignum');
var now = require("performance-now");
var moment = require("moment");

var bot = new Discord.Client({ "fetchAllMembers": true });
var youTube = new YouTube();
imgur.setClientID(config.imgurClientID);
youTube.setKey(config.googleAPIKey);

var onlineInterval;
var checkerInterval;

var Title = Object.freeze({ "EVERYONE": 0, "MODERATOR": 1, "OWNER": 2 });
var ChannelType = Object.freeze({ "ANY": 0, "GAME": 1, "SPAMMING": 2, "LOG": 3, "NONE": 4 });

const attributes = {
    "messages": { "text": "Number of messages" },
    "minutes": { "text": "Number of minutes active" },
    "oldminutes": { "text": "Number of old minutes online", "small": "old minutes", "global": true },
    "rpswins": { "text": "Rock Paper Scissors Wins Count", "small": "wins" },
    "taypoints": { "alt": ["points"], "text": "Number of taypoints" },
    "rolls1989": { "alt": ["1989roll", "1989rolls"], "text": "Number of 1989 rolls", "small": "1989 rolls" },
    "totalrolls": { "alt": ["rolls"], "text": "Number of total rolls", "small": "rolls" },
    "heistprofits": { "alt": ["hprofits"], "text": "Number of Taypoints earned through heists", "small": "taypoints gained" },
    "heistwins": { "alt": ["hwins"], "text": "Number of successful heists conducted", "small": "successful heists" },
    "heistruined": { "alt": ["heistsruined", "hruined"], "text": "Number of heists ruined", "small": "heists ruined" },
    "quizup": { "text": "Quizup username", "canSet": true, "canList": true, "global": true },
    "instagram": {
        "validator": (instagramToValidate, cb) => {
            cb({ "valid": /^([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}(?:[A-Za-z0-9_]))?)$/.test(instagramToValidate), "value": instagramToValidate });
        }, "alt": ["insta"], "text": "Instagram username", "canSet": true, "canList": true, "global": true
    },
    "lastfm": {
        "validator": function (lastfmToValidate, cb) {
            var url = "http://www.last.fm/user/" + lastfmToValidate;
            request(url, function (err, res, body) {
                if (!err && res && res.statusCode === 200)
                    cb({ "valid": true, "value": "<" + url + ">" });
                else cb({ "valid": false });
            });
        }, "text": "Last.fm username", "canSet": true, "canList": true, "global": true
    },
    "snapchat": {
        "text": "Snapchat username",
        "canSet": true,
        "canList": true,
        "global": true,
        "validator": (snapchatToValidate, cb) => {
            cb({ "valid": /^[a-z][a-z0-9\-_\.]{1,13}[a-z0-9]$/.test(snapchatToValidate.toLowerCase()), "value": snapchatToValidate });
        }
    },
    "tumblr": {
        "validator": function (tumblrToValidate, cb) {
            var url = "http://" + tumblrToValidate + ".tumblr.com/";
            request(url, function (err, res, body) {
                if (!err && res && res.statusCode === 200)
                    cb({ "valid": true, "value": "<" + url + ">" });
                else cb({ "valid": false });
            });
        }, "text": "Tumblr username", "canSet": true, "canList": true, "global": true
    },
    "age": {
        "validator": function (age, cb) {
            var ageInt = parseInt(age);
            cb({ "valid": isValidNumberBetween(ageInt, 13, 114), "value": ageInt });
        }, "small": "years old", "canSet": true, "global": true
    },
    "favsong": {
        "validator": function (songToValidate, cb) {
            cb({ "valid": true, "value": songToValidate });
        }, "alt": ["favorite", "favourite", "fav", "fave"], "text": "Favorite song", "canSet": true, "global": true
    },
    "location": { "alt": ["country"], "canSet": true, "global": true },
    "bae": { "alt": ["b\u00E6"], "canSet": true, "global": true },
    "gender": {
        "validator": function (genderToValidate, cb) {
            var gender = genderToValidate.toLowerCase();
            if (gender === "m" || gender === "male") cb({ "valid": true, "value": "Male" });
            else if (gender === "f" || gender === "female") cb({ "valid": true, "value": "Female" });
            else cb({ "valid": false });
        }, "alt": ["sex"], "canSet": true, "global": true
    },
    "timezone": {
        "getter": function (userId, serverId, cb) {
            db.get("SELECT timezone.`msOffset` FROM user LEFT JOIN timezone ON user.`timezone` = timezone.`id` WHERE user.`id` = ?;", userId, function (err, row) {
                if (err)
                    console.log("SQL Error when trying to get timezone of user " + userId + ":\n" + err);
                else if (!row)
                    console.log("This shouldn't happen, but no rows were found while trying to get timezone of " + userId);
                else
                    cb(row.msOffset);
            });
        },
        "get": function (userWanted, uselessArg, cb) {
            db.get("SELECT timezone.`name`, timezone.`msOffset` FROM user JOIN timezone ON user.`timezone` = timezone.`id` WHERE user.`id` = ?;", userWanted.id, function (err, row) {
                if (!err)
                    cb(null, [{ "id": userWanted.id, "isBot": userWanted.bot, "timezone": row ? row.name + " (" + moment(getCurrentTime() + row.msOffset).format('LT') + ")" : undefined }]);
                else {
                    console.log("SQL Error when trying to get timezone of user " + userWanted.username + " (" + userWanted.id + "):\n" + err);
                    cb(new Error("Database Error"));
                }
            });
        },
        "validator": function (timezoneToValidate, cb) {
            if (timezoneToValidate === "HISTORICC") { cb({ "valid": false, "errorMessage": "That timezone is valid as fuck." }); return; }
            didYouMean.threshold = 0.4;
            db.all("SELECT * FROM timezone;", function (err, rows) {
                if (!err) {
                    var match = rows.find(function (e) { return e.abb === didYouMean(timezoneToValidate, rows, 'abb'); });
                    if (!match) {
                        match = rows.find(function (e) { return e.name === didYouMean(timezoneToValidate, rows, 'name'); });
                        if (!match) {
                            var parsedMoment = moment(timezoneToValidate, "H:mm");
                            if (parsedMoment.isValid()) {
                                var offset = parsedMoment.diff(moment());

                                var closest = Number.MAX_VALUE;
                                for (var i = 0; i < rows.length; i++) {
                                    if (rows[i].msOffset >= offset && rows[i].msOffset < closest) {
                                        closest = rows[i].msOffset;
                                        match = rows[i];
                                    }
                                }
                            }
                            if (!match) {
                                cb({ "valid": false, "errorMessage": "Timezone or time \"" + timezoneToValidate + "\" was not recognized." });
                                return;
                            }
                        }
                    }
                    cb({ "valid": true, "value": match.id, "textToShow": match.name });
                }
                else
                    cb({ "valid": false, "errorMessage": "Database Error" });
            });
        }, "alt": ["time"], "canSet": true, "global": true
    },
    "tempunit": {
        "validator": function (unitToValidate, cb) {
            var unit = unitToValidate.toLowerCase();
            if (unit === "c" || unit === "celsius") cb({ "valid": true, "value": "C" });
            else if (unit === "f" || unit === "fahrenheit") cb({ "valid": true, "value": "F" });
            else if (unit === "k" || unit === "kelvin") cb({ "valid": true, "value": "K" });
            else return cb({ "valid": false });
        }, "text": "Temperature unit preference", "alt": ["unit"], "canSet": true, "global": true
    },
    "wordscount": { "text": "Words count", "alt": ["twords"], "small": "words" }
};

const choices = [
    { "text": "rock", "emoji": "\uD83D\uDDFF" },
    { "text": "paper", "emoji": "\uD83D\uDCC4" },
    { "text": "scissors", "emoji": "\u2702" }
];

var timeToEnterHeist = 60000;
var heistInProgress = false;
var msCooldownOnCommands = 10000;
var fullDateFormattingString = "MMMM Do, YYYY \\at H:mm:ss.SSS";
var epochDateFormattingString = "MMMM Do, YYYY \\at H:mm:ss";

const banks = [
    { "name": "Taylor Swift Municipal Bank", "multiplier": 1.5 },
    { "name": "Fearless City Bank", "multiplier": 1.7 },
    { "name": "Speak Now State Bank", "multiplier": 2 },
    { "name": "Red National Bank", "multiplier": 2.25 },
    { "name": "1989 Federal Reserve", "multiplier": 2.75 }
];

var deadReasons = ["listened to Ronan too much and broke down crying", "noticed that Taylor liked their tumblr post", "got lost in wonderland", "hit the brakes too soon and had to get to the hospital",
    "got memed on", "lost their chill", "decided to not rob banks, on a wednesday, in a cafe", "would rather love than fight", "were using puush", "were the *lucky* one",
    "ended up dreaming instead of sleeping", "were busy making smirk pyramids"];
var bustedReasons = ["started singing \"You Belong With Me\" really loud", "distracted the group by showing them a new acoustic video", "started an argument on dark vs light theme",
    "got invited to Loft '89", "turned out to be a Katycat", "was too busy spamming \uD83D\uDE0F in chat",
    "got banned by marvintran76", "decided it was a good time to post a selfie", "kept hitting on the teller even though they have a girl at home", "heard a song playing and yelled, \"OMG, I LOVE THIS SONG\"",
    "started a USA chant and all the Americans sang along", "had ghosts from past coming back to haunt them", "had a cop already waiting for them. It was 13's fault",
    "didn't know places to hide", "was a dick, much like blade", "felt it was a perfect night to dress up like hipsters, not to rob a bank", "left their scarf at their sister's house and the team had to go back to get it"];

var polls = {};
var prefixesInit = false;
var serversInfo = {};
var linkReddit;
var lastLinkYoutube = '';

var commands = {
    "get ": {
        "help": "",
        "process": function (msg, author, channel, prefix, cmdAtt, params, args, callback) {
            var userWanted = getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                var attributeObj = attributes[cmdAtt];
                var getAttributeForGet = attributeObj.hasOwnProperty("get") ? attributeObj.get : getRankedUsers;
                var firstAtt = attributeObj.hasOwnProperty("get") ? userWanted : cmdAtt;
                var secondAtt = attributeObj.hasOwnProperty("get") ? undefined : channel.guild;

                var text = getTextAttribute(cmdAtt).toLowerCase();
                getAttributeForGet(firstAtt, secondAtt, function (err, rows) {
                    if (err) callback(err);
                    else {
                        var row = rows.find(function (e) { return e.id === userWanted.id; });
                        if (row && row[cmdAtt]) {
                            var response = cleanFormatting(userWanted.username) + "'s " + text + " is ";
                            response += (typeof row[cmdAtt] === "number" ? "`" + row[cmdAtt] + "`" : row[cmdAtt]) + ".";
                            if (typeof row[cmdAtt] === "number" && !row.isBot) {
                                rows = rows.filter(function (e) { return !e.isBot; });
                                var position = getIndexWithAttr(rows, 'id', row.id);
                                response += " (" + getNumberSuffix(position + 1) + " user in the server)";
                            }
                            replyMsg(msg, response, { "callback": callback });
                        }
                        else replyMsg(msg, cleanFormatting(userWanted.username) + " doesn't have a " + text + " yet. \uD83D\uDE26", { "callback": callback });
                    }
                });
            }
        }
    },
    "set ": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            if (!keyword) { keyword = params[0]; params = params.slice(1, params.length); }
            var attribute = getAttributeFromText(keyword);
            params = params.join(" ");
            var attributeObj = attributes[attribute];
            if (attributeObj) {
                if (attributeObj.canSet) {
                    var validationFunc = attributeObj.hasOwnProperty("validator") ? attributeObj.validator : defaultValidator;
                    validationFunc(params, function (validation) {
                        if (validation.valid) {
                            setAttribute(author.id, channel.guild.id, attribute, validation.value, function (success) {
                                if (success) replyMsg(msg, "Your " + getTextAttribute(attribute).toLowerCase() + " has been set to " + (validation.textToShow || validation.value) + ". \uD83D\uDE04", { "callback": callback });
                            });
                        }
                        else callback(new Error(validation.errorMessage || (params + " is not a valid " + getTextAttribute(attribute).toLowerCase() + ".")));
                    });
                }
                else replyMsg(msg, "Looks like you can't set that. \uD83D\uDE0F", { "callback": callback });
            }
            else callback(null);
        }
    },
    "clear ": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var attribute = getAttributeFromText(keyword) || getAttributeFromText(params.join(" "));
            if (!attribute) { callback(null); return; }
            if (attributes[attribute].canSet) {
                setAttribute(author.id, channel.guild.id, attribute, null, function (success) {
                    if (success) replyMsg(msg, "Your " + getTextAttribute(attribute).toLowerCase() + " has successfully been cleared. \uD83D\uDE04", { "callback": callback });
                    else callback(new Error("Your " + getTextAttribute(attribute).toLowerCase() + " has not been cleared, not sure what happened there."));
                });
            }
            else replyMsg(msg, "Looks like you can't clear that. \uD83D\uDE0F", { "callback": callback });
        }
    },
    "list ": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var attribute = getAttributeFromText(keyword) || getAttributeFromText(params.join(" "));
            if (!attribute) { callback(null); return; }
            if (attributes[attribute].canList) {
                getRankedUsers(attribute, channel.guild, function (err, rows) {
                    if (err) callback(err);
                    else {
                        var response = "**Discord username : " + getTextAttribute(attribute) + "**\n";
                        for (var i = 0, nbResults = rows.length; i < nbResults; i++) {
                            response += cleanFormatting(idToUsername(rows[i].id, channel.guild)) + " : " + rows[i][attribute] + "\n";
                        }
                        sendMsg(msg.channel, response, { "callback": callback });
                    }
                });
            }
            else replyMsg(msg, "Looks like you can't list that. \uD83D\uDE0F", { "callback": callback });
        }
    },
    "rank ": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            if (!keyword && params.length === 0) {
                callback(null);
            }
            else {
                if (!keyword) { keyword = params[0]; params = params.slice(1, params.length); }
                var numAttribute = getAttributeFromText(keyword) || getAttributeFromText(params.join(" "));
                if (numAttribute) {
                    var units = attributes[numAttribute].small ? attributes[numAttribute].small : numAttribute.toLowerCase();
                    var ranks = getValidNumberFromCommand(params, 1);
                    if (!ranks) ranks = 5;

                    getRankedUsers(numAttribute, channel.guild, function (err, rows) {
                        if (err) callback(err);
                        else {
                            if (typeof rows[0][numAttribute] === 'number') {
                                rows = rows.filter(function (e) { return !e.isBot; });
                                if (ranks > rows.length) ranks = rows.length;
                                var response = "**" + getTextAttribute(numAttribute) + " Ranking:**\n";
                                for (var i = 0; i < ranks; ++i) {
                                    response += (i + 1) + ":	" + cleanFormatting(idToUsername(rows[i].id, channel.guild)) + " - `" + rows[i][numAttribute] + "` " + units + "\n";
                                }
                                sendMsg(msg.channel, response, { "callback": callback });
                            }
                            else replyMsg(msg, "Looks like I can't rank that. \uD83D\uDE26", { "callback": callback });
                        }
                    });
                }
                else callback(null);
            }
        }
    },
    "gdisable": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var cmd = getCommandFromText(params.join(" "));
            if (cmd) {
                commands[cmd].disabled = true;
                replyMsg(msg, "The '" + cmd + "' command has been disabled.", { "callback": callback });
            }
            else callback(null);
        }
    },
    "genable": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var cmd = getCommandFromText(params.join(" "));
            if (cmd) {
                commands[cmd].disabled = false;
                replyMsg(msg, "The '" + cmd + "' command has been enabled.", { "callback": callback });
            }
            else callback(null);
        }
    },
    "dupes": {
        "alt": ["duplicates", "finddupes"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var dupes = [];
            var servers = channel.type !== 'text' ? getSharedServers(author.id) : bot.guilds.filter(g => g.id === channel.guild.id);
            servers.forEach(g => {
                g.members.forEach(m => {
                    var matches = g.members.findAll('username', m.user.username);
                    if (matches.length > 1)
                        dupes.push("`" + m.id + "` : " + m.user.username + "#" + m.user.discriminator);
                });
            });
            var textToSend = dupes.length > 0 ? "**Duplicate usernames:**\n" + dupes.join("\n") : "```No duplicate usernames found.```";
            sendMsg(msg.channel, textToSend, { "callback": callback });
        }
    },
    "weather": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ");
            getAttribute(author.id, channel.guild.id, "tempunit", function (units) {
                if (!units) units = getRandomTrueFalse() ? 'F' : 'C';
                var userWanted = getUserFromCommand(params, msg, author, channel, callback, { 'threshold': 0.4, 'dontAnswer': true });
                if (userWanted) {
                    userWanted = userWanted.user;
                    getAttribute(userWanted.id, channel.guild.id, "location", function (loc) {
                        if (loc) getWeather(msg, loc, units, callback);
                        else replyMsg(msg, cleanFormatting(userWanted.username) + " hasn't set their location yet.", { "callback": callback });
                    });
                }
                else getWeather(msg, params, units, callback);
            });
        }
    },
    "info": {
        "alt": ["asl"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var userWanted = args.hasOwnProperty('random') ? channel.guild.members.random() : getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                db.get("SELECT user.`age`, user.`gender`, user.`location`, timezone.`msOffset` AS timezone FROM user LEFT JOIN timezone ON user.`timezone` = timezone.`id` WHERE user.`id` = ?", userWanted.id, function (err, row) {
                    if (err) {
                        console.log("SQL Error in info command:\n" + err);
                        callback(new Error("Couldn't get the information from the database."));
                        return;
                    }
                    var arrayInfo = [];
                    arrayInfo.push({ "title": "Username", "content": userWanted.username + "#" + userWanted.discriminator });
                    arrayInfo.push({ "title": "Age", "content": (row.age ? row.age : "Not Set") });
                    arrayInfo.push({ "title": "Gender", "content": (row.gender ? row.gender : "Not Set") });
                    arrayInfo.push({ "title": "Location", "content": (row.location ? row.location : "Not Set") });
                    arrayInfo.push({ "title": "Time", "content": (row.timezone !== null ? moment(getCurrentTime() + row.timezone).format('LT') : "Not Set") });
                    sendMsg(msg.channel, formatSpaces(arrayInfo), { "callback": callback, "format": { "before": "```ruby\n", "after": "```" } });
                });
            }
        }
    },
    "setinfo": {
        "alt": ["setasl"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ").split(",");
            if (params.length === 3) {
                var text = "\n";
                params[0] = params[0].trim();
                attributes.age.validator(params[0], function (validation) {
                    if (validation.valid) {
                        setGlobalAtt(author.id, "age", validation.value);
                        text += "Your age has been set to " + validation.value + ".";
                    }
                    else text += params[0] + " is not a valid age.";

                    text += "\n";
                    params[1] = params[1].trim();
                    attributes.gender.validator(params[1], function (genderValidation) {
                        if (genderValidation.valid) {
                            setGlobalAtt(author.id, "gender", genderValidation.value);
                            text += "Your gender has been set to " + genderValidation.value + ".";
                        }
                        else text += params[1] + " is not a valid gender.";

                        var loc = params[2].trim();
                        setGlobalAtt(author.id, "location", loc);
                        text += "\nYour location has been set to " + loc + ".";

                        replyMsg(msg, text, { "callback": callback });
                    });
                });
            }
            else callback(new Error("That command doesnt look right. Example: " + prefix + "setinfo [age],[gender],[location]."));
        }
    },
    "poll": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var poll = polls[channel.id];
            if (poll && poll.active) {
                if (params.length === 0) {
                    isMod(channel.guild, author, function (isMod) {
                        replyMsg(msg, poll.closePoll(author.id, isMod), { "callback": callback });
                        if (poll.active === false) polls[channel.id] = undefined;
                    });
                }
                else {
                    params = params.join(" ");
                    if (params === "show" || params === "results") sendMsg(msg.channel, poll.showPoll(), { "callback": callback });
                    else replyMsg(msg, "There is an active poll in this channel already.", { "callback": callback });
                }
            }
            else {
                params = params.join(" ");
                if (!params) replyMsg(msg, "There is no active poll in this channel.", { "callback": callback });
                else {
                    var options = params.split(",");
                    polls[channel.id] = new Poll(author, msg.channel);
                    poll = polls[channel.id];
                    if (poll.setOptions(options)) {
                        sendMsg(msg.channel, poll.startPoll(), { "callback": callback });
                    }
                    else callback(new Error("A poll must have multiple choices to start."));
                }
            }
        }
    },
    "setprefix": {
        "help": "",
        "access": Title.MODERATOR,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var prefix = params.join(" ");
            serversInfo[channel.guild.id].prefix = prefix;
            db.run("UPDATE server SET `prefix` = ? WHERE `id` = ?;", [prefix, channel.guild.id], function (err) {
                if (err) {
                    callback(new Error("Something went wrong when trying to set TaylorBot's prefix for this server."));
                    console.log("SQL Error when trying to change prefix for server " + channel.guild.name + ".\n" + err);
                }
                else {
                    replyMsg(msg, "TaylorBot's prefix has been changed to \"" + prefix + "\" for this server. \uD83D\uDE04", { "callback": callback });
                    console.log("Changed prefix of server " + channel.guild.name + " to " + prefix + ".");
                }
            });
        }
    },
    "roll": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var number = getValidNumberFromCommand(params, 1);
            if (number === undefined) number = 10;
            var roll = getRandomInt(0, number),
                text = "You rolled `" + roll + "/" + number + "`. \uD83C\uDFB2",
                points = 0;
            switch (roll) {
                case 13: points = 1; break;
                case 15: points = 2; break;
                case 22: points = 3; break;
                case 1989: points = 5000; addToServerNum(author.id, channel.guild.id, 'rolls1989', 1); break;
            }
            if (points > 0) {
                addTaypoints(author.id, channel.guild.id, points);
                text += " Wow! You gained `" + points + "` taypoint" + (points > 1 ? "s" : "") + "! \uD83D\uDE04";
            }
            replyMsg(msg, text, { "callback": callback });
            addToServerNum(author.id, channel.guild.id, "totalRolls", 1);
        }
    },
    "genderstats": {
        "alt": ["statsgender"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var maleCount = 0, femaleCount = 0, notSetCount = 0;
            db.each("SELECT user.`id` AS id, `gender` FROM user INNER JOIN userByServer ON user.`id` = userByServer.`id` WHERE `serverId` = ?;", channel.guild.id, function (err, row) {
                if (!err) {
                    var user = idToUser(row.id, channel.guild);
                    if (user && !user.bot) {
                        if (row.gender === "Male") maleCount++;
                        else if (row.gender === "Female") femaleCount++;
                        else notSetCount++;
                    }
                }
            }, function () {
                var response = "Gender Stats:\n";
                var arrayInfo = [];
                arrayInfo.push({ "title": "Male", "content": maleCount + " (" + (maleCount / (maleCount + femaleCount) * 100).toFixed(2) + "%)" });
                arrayInfo.push({ "title": "Female", "content": femaleCount + " (" + (femaleCount / (maleCount + femaleCount) * 100).toFixed(2) + "%)" });
                response += formatSpaces(arrayInfo) + "\n" + notSetCount + "/" + (maleCount + femaleCount + notSetCount) + " users have not set their gender yet.";
                sendMsg(msg.channel, response, { "format": { "before": "```ruby\n", "after": "```" }, "callback": callback });
            });
        }
    },
    "agestats": {
        "alt": ["statsage"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var total = 0, ageSetCount = 0, notSetCount = 0, highest = 0, lowest = Infinity;
            db.each("SELECT user.`id`, `age` FROM user INNER JOIN userByServer ON user.id = userByServer.id WHERE `serverId` = ?;", channel.guild.id, function (err, row) {
                if (!err) {
                    var user = idToUser(row.id, channel.guild);
                    if (user && !user.bot) {
                        if (row.age) {
                            total += row.age;
                            if (row.age > highest) highest = row.age;
                            if (row.age < lowest) lowest = row.age;
                            ageSetCount++;
                        }
                        else notSetCount++;
                    }
                }
            }, function () {
                var response = "Age Stats:\n";
                var arrayInfo = [];
                arrayInfo.push({ "title": "Average", "content": (total / ageSetCount).toFixed(2) });
                arrayInfo.push({ "title": "Lowest", "content": lowest });
                arrayInfo.push({ "title": "Highest", "content": highest });
                response += formatSpaces(arrayInfo) + "\n" + notSetCount + "/" + (ageSetCount + notSetCount) + " users have not set their age yet.";
                sendMsg(msg.channel, response, { "format": { "before": "```ruby\n", "after": "```" }, "callback": callback });
            });
        }
    },
    "avatar": {
        "alt": ["icon"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var userWanted = getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                if (userWanted.avatarURL) replyMsg(msg, userWanted.username + "'s avatar is " + userWanted.avatarURL, { "callback": callback });
                else replyMsg(msg, "No avatar detected for " + userWanted.username + ".", { "callback": callback });
            }
        }
    },
    "stats": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var userWanted = getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                db.get("SELECT `messages`, `minutes`, `taypoints`, timezone.`msOffset` AS timezone, `lastSpoke`, `lastSeen` FROM userByServer INNER JOIN user ON userByServer.`id` = user.`id` LEFT JOIN timezone ON timezone.`id` = user.`timezone` WHERE user.`id` = ? AND userByServer.`serverId` = ?",
                    [userWanted.id, channel.guild.id], function (err, row) {
                        if (err) {
                            console.log("SQL Error on stats command:\n" + err);
                            callback(new Error("Couldn't get the information from the database."));
                            return;
                        }
                        var arrayInfo = [];
                        arrayInfo.push({ "title": "Username", "content": userWanted.username + "#" + userWanted.discriminator });
                        arrayInfo.push({ "title": "Messages", "content": row.messages ? row.messages : "None" });
                        arrayInfo.push({ "title": "Minutes", "content": row.minutes ? row.minutes : "None" });
                        arrayInfo.push({ "title": "Taypoints", "content": row.taypoints ? row.taypoints + " \u0166" : "None" });
                        arrayInfo.push({ "title": "Last Spoke", "content": row.lastSpoke ? moment(row.lastSpoke + row.timezone).format(fullDateFormattingString) + " (" + moment(row.lastSpoke).fromNow() + ")" : "Never" });
                        if (row.lastSeen !== row.lastSpoke) {
                            arrayInfo.push({ "title": "Last Seen", "content": row.lastSeen ? moment(row.lastSeen + row.timezone).format(fullDateFormattingString) + " (" + moment(row.lastSeen).fromNow() + ")" : "Never" });
                        }
                        sendMsg(msg.channel, formatSpaces(arrayInfo), { "format": { "before": "```ruby\n", "after": "```" }, "callback": callback });
                    });
            }
        }
    },
    "rps": {
        "alt": ["playrps"],
        "help": "",
        "restricted": ChannelType.GAME,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params[0] ? params[0] : getRandomElement(choices).text;
            didYouMean.threshold = null;
            var choicehuman = choices.find(function (e) { return e.text === didYouMean(params, choices, 'text'); }) || getRandomElement(choices);
            var choicebot = getRandomElement(choices);
            var winner = compare(choicebot.text, choicehuman.text);
            var message = "";
            if (winner === choicehuman.text) {
                var pointsWon = 1;
                message += "You won! \uD83D\uDE26 You gained `" + pointsWon + "` taypoint" + (pointsWon > 1 ? "s" : "") + "!";
                addToServerNum(author.id, channel.guild.id, "rpswins", 1);
                addTaypoints(author.id, channel.guild.id, pointsWon);
            }
            else message += winner === choicebot.text ? "You lost! \uD83D\uDE04" : "It's a tie! \uD83D\uDE10";
            replyMsg(msg, "It's my " + choicebot.emoji + " against your " + choicehuman.emoji + "! " + message, { "callback": callback });
        }
    },
    "serverinfo": {
        "alt": ["created", "servericon", "sinfo"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var guild = channel.guild;
            var arrayInfo = [];
            var response = "```ruby\n";
            arrayInfo.push({ "title": "Name", "content": guild.name });
            arrayInfo.push({ "title": "ID", "content": guild.id });
            var ownerUser = guild.owner.user;
            arrayInfo.push({ "title": "Owner", "content": ownerUser.username + "#" + ownerUser.discriminator + " (" + ownerUser.id + ")" });
            getAttribute(author.id, channel.guild.id, "timezone", function (timezone) {
                var created = idToTime(guild.id);
                arrayInfo.push({ "title": "Created", "content": moment(created + timezone).format(fullDateFormattingString) + ". (" + moment(created).fromNow() + ")" });
                var onlineCount = 0;
                guild.members.forEach(m => { if (m.user.status === 'online') onlineCount++; });
                var membersText = guild.members.size + " (" + onlineCount + " online)";
                guild.fetchBans().then(bans => {
                    membersText += " (+" + bans.size + " banned)";
                    afterBans();
                }).catch(afterBans);

                function afterBans() {
                    arrayInfo.push({ "title": "Members", "content": membersText });
                    arrayInfo.push({ "title": "Channels", "content": guild.members.findAll('type', 'text').length + " Text / " + guild.members.findAll('type', 'voice').length + " Voice" });
                    arrayInfo.push({ "title": "Roles", "content": guild.roles.size });
                    arrayInfo.push({ "title": "Region", "content": guild.region });
                    response += formatSpaces(arrayInfo) + "```" + (guild.iconURL ? guild.iconURL : "");
                    sendMsg(msg.channel, response, { "callback": callback });
                }
            });
        }
    },
    "uptime": {
        "alt": ["bot", "code", "botinfo"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var arrayInfo = [];
            var creator = idToUser(config.ownerUserId);
            arrayInfo.push({ "title": "Creator", "content": creator.username + "#" + creator.discriminator + " (" + creator.id + ")" });
            arrayInfo.push({ "title": "Servers", "content": bot.guilds.size });
            arrayInfo.push({ "title": "Channels", "content": bot.channels.size });
            arrayInfo.push({ "title": "PM Convos", "content": bot.channels.findAll('type', 'dm').length });
            arrayInfo.push({ "title": "Users", "content": bot.users.size });
            var msgCount = 0;
            bot.channels.filter(c => c.type !== 'voice').forEach(c => msgCount += c.messages.size);
            arrayInfo.push({ "title": "Messages", "content": msgCount });
            getAttribute(author.id, channel.guild.id, "timezone", function (timezone) {
                arrayInfo.push({ "title": "Up Since", "content": moment(bot.readyTime + timezone).format(fullDateFormattingString) + ". (" + moment(bot.readyTime).fromNow() + ")" });
                var lines = 0;
                ['taylorbot.js', './classes/Poll.js'].forEach(path => {
                    lines += fs.readFileSync(path, 'utf8').match(/\n/g).length + 1;
                });
                arrayInfo.push({ "title": "Code", "content": lines + " lines of shitty javascript code." });
                arrayInfo.push({ "title": "Library", "content": "discord.js" });
                sendMsg(msg.channel, formatSpaces(arrayInfo), { "format": { "before": "```ruby\n", "after": "```" }, "callback": callback });
            });
        }
    },
    "userinfo": {
        "help": "",
        "alt": ["uinfo", "whois"],
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var gUserWanted = args.hasOwnProperty('random') ? channel.guild.members.random() : getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (gUserWanted) {
                var userWanted = gUserWanted.user;
                getAttribute(author.id, channel.guild.id, "timezone", function (timezone) {
                    var arrayInfo = [];
                    var response = "```ruby\n";
                    arrayInfo.push({ "title": "Username", "content": userWanted.username + "#" + userWanted.discriminator + (userWanted.bot ? " [BOT]" : "") });
                    arrayInfo.push({ "title": "ID", "content": userWanted.id });
                    var createdMs = idToTime(userWanted.id);
                    arrayInfo.push({ "title": "Created", "content": moment(createdMs + timezone).format(fullDateFormattingString) + " (" + moment(createdMs).fromNow() + ")" });
                    var joinedMs = gUserWanted.joinedAt.getTime();
                    arrayInfo.push({ "title": "Joined", "content": moment(joinedMs + timezone).format(fullDateFormattingString) + " (" + moment(joinedMs).fromNow() + ")" });
                    arrayInfo.push({ "title": "Status", "content": userWanted.status });
                    arrayInfo.push({ "title": "Shared", "content": getSharedServers(userWanted.id).size });
                    if (userWanted.game) arrayInfo.push({ "title": "Playing", "content": userWanted.game.name });
                    if (gUserWanted.voiceChannel) arrayInfo.push({ "title": "In channel", "content": gUserWanted.voiceChannel.name });
                    response += formatSpaces(arrayInfo) + "```" + (userWanted.avatarURL ? userWanted.avatarURL : 'https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png');
                    sendMsg(msg.channel, response, { "callback": callback });
                });
            }
        }
    },
    "usernames": {
        "help": "",
        "alt": ["names"],
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var userWanted = getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                db.all("SELECT * FROM usernames WHERE userId = ? ORDER BY since DESC LIMIT 10;", userWanted.id, function (err, rows) {
                    var text = userWanted.username;
                    text += "'s username history:\n";
                    for (var i = 0, len = rows.length; i < len; ++i) {
                        text += "\n" + moment(rows[i].since).format('MMM D') + " - " + (i === 0 ? "" : moment(rows[i - 1].since).format('MMM D')) + " : " + rows[i].username;
                    }
                    sendMsg(msg.channel, text, { "format": { "before": "```ruby\n", "after": "```" }, "callback": callback });
                });
            }
        }
    },
    "help": {
        "alt": ["commands"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            replyMsg(msg, "Bot Help can be found here: https://www.reddit.com/r/TaylorSwift/wiki/discord#wiki_taylorbot", { "callback": callback });
        }
    },
    "sub": {
        "alt": ["subreddit"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ");
            if (!params) params = "taylorswift";
            getSubredditAbout(params, function (error, data) {
                if (error) {
                    callback(new Error(error));
                    return;
                }
                var answer = "**" + data.url + "'s info:**";
                answer += "\n__Online users:__ " + data.accounts_active + "\n__Total subscribers:__ " + data.subscribers + "\n__Created:__ "
                    + moment(data.created, 'X').format(epochDateFormattingString) + "\nLink posts are ";
                if (data.submission_type === "self") answer += "not ";
                answer += "allowed on this subreddit.\nThis subreddit is " + data.subreddit_type + ".\n__Link:__ <https://www.reddit.com" + data.url + ">";
                sendMsg(msg.channel, answer, { "callback": callback });
            });
        }
    },
    "wiki": {
        "alt": ["wikipedia"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ");
            if (!params) params = "taylor swift";
            wikipedia.search(params, 1).then(function (data) {
                var results = data.results;
                if (results.length === 0) {
                    console.log("No Wikipedia article found for " + params);
                    replyMsg(msg, "No Wikipedia article found on this subject.", { "callback": callback });
                    return;
                }
                wikipedia.page(results[0]).then(function (page) {
                    page.summary().then(function (summary) {
                        if (summary.indexOf(" may refer to:") > -1 ||
                            summary.indexOf(" may stand for:") > -1 ||
                            summary.indexOf(" may refer directly to:") > -1) {
                            console.log("%s has multiple articles on wikipedia.", params);
                            replyMsg(msg, "There are multiple wikipedia articles on that, can you be more specific?", { "callback": callback });
                            return;
                        }
                        page.images().then(function (images) {
                            var text = "**" + page.title + "**\n";
                            if (args.hasOwnProperty('long'))
                                text += summary.replace(/^\s+|\s+$/g, '');
                            else
                                text += summary.split("\n")[0];
                            images = images.filter(function (url) { return !/(.svg|.ogg)$/g.test(url); });
                            text += "\n**Wiki:** <" + page.fullurl + ">";
                            if (images.length > 0) text += "\n**Photo:** " + images[0];
                            sendMsg(msg.channel, text, { "callback": callback });
                        });
                    });
                });
            }, function (err) {
                console.log("Error while searching for %s on wikipedia:\n" + err, params);
                callback(new Error("Something went wrong with that search."));
            });
        }
    },
    "youtube": {
        "alt": ["yt", "ytn", "ytt", "youtubet"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ");
            if (params) {
                if (keyword !== 'yt' && keyword !== 'youtube' && keyword !== 'ytn') params = "Taylor Swift " + params;
                youTube.search(params, 4, function (err, result) {
                    if (err) {
                        console.log("Error when searching %s on youtube:\n" + err, params);
                        callback(new Error("Something went wrong when atempting to search on youtube."));
                        return;
                    }
                    else {
                        if (result.items.length === 0) {
                            replyMsg(msg, "Search found no youtube videos.", { "callback": callback });
                            return;
                        }
                        var itemIndex = 0;
                        while (result.items[itemIndex].id.channelId !== undefined) {
                            if (itemIndex > 4) {
                                callback(new Error("Search returned unusual results. This should not happen."));
                                return;
                            }
                            itemIndex++;
                        }
                        replyMsg(msg, "https://youtu.be/" + result.items[itemIndex].id.videoId, { "callback": callback });
                    }
                });
            }
            else callback(new Error("You need to specify a keyword for your search."));
        }
    },
    "imgur": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            if (!params[0]) { callback(new Error("You need to specify a url.")); return; }

            isValidImageURL(params[0], function (isImageURL) {
                if (isImageURL) {
                    if (params[0].indexOf("http://i.imgur.com/") === 0) replyMsg(msg, params[0]);
                    else {
                        imgur.upload(params[0], function (err, res) {
                            if (err) {
                                callback(new Error("Something went wrong when trying to upload that image to imgur"));
                                console.log("Error when trying to upload on imgur : " + err);
                                return;
                            }
                            try {
                                var text = res.data.link;
                                replyMsg(msg, text, { "callback": callback });
                            } catch (e) {
                                console.log("Error when trying to process data from imgur : " + e);
                                callback(new Error("Something went wrong when trying to process data from imgur."));
                            }
                        });
                    }
                }
                else callback(new Error("The link you provided was not recognized as an image."));
            });
        }
    },
    "image": {
        "alt": ["imagen", "imaget"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = keyword[keyword.length - 1] === 't' ? "taylor swift " + params.join(" ") : params.join(" ");
            if (params) {
                var url = "https://www.googleapis.com/customsearch/v1?key=" + config.googleAPIKey + "&cx=" + config.customsearchID + "&q=" + params.replace(/&/g, '') + "&num=1&alt=json&safe=high&searchType=image&start=" + getRandomInt(1, 10);
                if (args.hasOwnProperty('gif')) url += "&fileType=gif";
                if (args.hasOwnProperty('recent')) url += "&dateRestrict=w1";
                request(url, function (err, res, body) {
                    if (!err) {
                        if (res.statusCode === 200) {
                            var result = JSON.parse(body);
                            if (result && result.items && result.items[0]) {
                                replyMsg(msg, result.items[0].link, { "callback": callback });
                                return;
                            }
                        }
                        else if (res.statusCode === 403) {
                            callback(new Error("Looks like our daily google searches limit (100) is reached."));
                            return;
                        }
                    }
                    replyMsg(msg, "No results found for \"" + params + "\"", { "callback": callback });
                    console.log("Error when searching on google for images : " + err);
                });
            }
            else callback(new Error("You need to specify a keyword for your search."));
        }
    },
    "wolfram": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            wolfram.query(params.join(" "), function (err, result) {
                if (err) {
                    callback(new Error("Something went wrong when trying to reach wolfram."));
                    console.log("Error when querying on wolfram:\n" + err);
                    return;
                }
                if (!result || result.length === 0)
                    replyMsg(msg, "Search returned no result for this query on wolfram.", { "callback": callback });
                else {
                    var messagesToSend = [];
                    for (var n = 0; n < result.length && messagesToSend.length < 2; n++) {
                        if ("image" in result[n].subpods[0] && result[n].title.indexOf("IP") === -1)
                            messagesToSend.push(result[n].title + ": " + result[n].subpods[0].image);
                    }
                    if (messagesToSend.length > 1) {
                        var text = messagesToSend.join("\n");
                        replyMsg(msg, text, { "callback": callback });
                    }
                    else callback(new Error("Uh this shouldn't happen."));
                }
            });
        }
    },
    "urban": {
        "alt": ["urbandictionnary"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var resultNumber = 0;
            params = params.join(" ");
            if (args.hasOwnProperty('result')) {
                var number = parseInt(args.result);
                if (isValidNumberBetween(number, 2)) resultNumber = number - 1;
            }
            if (!params) params = "taylor";
            request('http://api.urbandictionary.com/v0/define?term=' + params, function (err, response, body) {
                if (!err && response.statusCode === 200) {
                    var result = JSON.parse(body);
                    if (result.list[0]) {
                        if (resultNumber >= result.list.length - 1) resultNumber = result.list.length - 1;
                        var item = result.list[resultNumber];
                        var answer = "__Term:__ " + item.word + " \uD83D\uDC4D`" + item.thumbs_up + "`\uD83D\uDC4E`" +
                            item.thumbs_down + "`\n__Definition:__ " + item.definition;
                        var example = item.example;
                        if (example) answer += "\n__Example:__ " + example;
                        sendMsg(msg.channel, answer.replace(/\[|\]/g, "**"), { "callback": callback });
                    }
                    else replyMsg(msg, "Hum, looks I can't find that word on urbandictionary.", { "callback": callback });
                }
                else callback(new Error("Something went wrong when trying to find \"" + params + "\" on urbandictionary."));
            });
        }
    },
    "movie": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ");
            if (!params) params = "taylor swift style";
            imdbSearch(params, true, function (movie) {
                var answer = "";
                if (movie) {
                    answer += "**" + movie.title + " (" + movie.year + ")**";
                    if (movie.releaseDate) {
                        var released = moment(movie.releaseDate, 'YYYYMMDD');
                        answer += "\n__Released:__ " + released.format('MMM Do, YYYY') + " (" + released.fromNow() + ")";
                    }
                    if (movie.runtime) answer += "\n__Runtime:__ " + movie.runtime;
                    if (movie.genres.length > 0) answer += "\n__Genres:__ " + movie.genres.join(", ");
                    if (movie.languages.length > 0) answer += "\n__Languages:__ " + movie.languages.join(", ");
                    if (movie.simplePlot) answer += "\n__Plot:__ " + movie.simplePlot;
                    if (movie.rating) answer += "\n__Rating:__ " + movie.rating;
                    if (movie.metascore) answer += "\n__Metascore:__ " + movie.metascore;
                    if (movie.quotes.length > 0) {
                        var quote = getRandomElement(movie.quotes);
                        answer += "\n__Quote:__ " + quote.quote[0];
                        if (quote.remark) answer += " " + quote.remark;
                    }
                    if (movie.urlPoster) answer += "\n" + movie.urlPoster;
                }
                else answer += author.toString() + " I can't find the movie \"" + params + "\" on imdb.";
                sendMsg(msg.channel, answer, { "callback": callback });
            });
        }
    },
    "actor": {
        "alt": ["actress"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ");
            if (!params) params = "taylor swift";
            imdbSearch(params, false, function (actor) {
                var answer = "";
                if (actor) {
                    answer += "**" + actor.name + "**";
                    if (actor.height) answer += "\n__Height:__ " + actor.height;
                    if (actor.birthName) answer += "\n__Born as:__ " + actor.birthName;
                    if (actor.dateOfBirth) answer += "\n__Date of Birth:__ " + actor.dateOfBirth;
                    if (actor.placeOfBirth) answer += "\n__Place of Birth:__ " + actor.placeOfBirth;
                    if (actor.died) answer += "\n__Died:__ " + actor.died;
                    if (actor.spouse.length > 0) {
                        var spouses = actor.spouse;
                        answer += "\n__Spouse";
                        if (spouses.length > 1) answer += "s";
                        answer += ":__ ";
                        for (var i = 0, len = spouses.length; i < len; ++i) {
                            answer += spouses[i].nameId.name + " (" + (spouses[i].dateTo === "present" ? "since" : "from") + " " + moment(spouses[i].dateFrom, 'DD MMMM YYYY').format('MMMM YYYY');
                            if (spouses[i].dateTo !== "present") answer += " to " + moment(spouses[i].dateTo, 'DD MMMM YYYY').format('MMMM YYYY');
                            answer += ")";
                            if (i !== len - 1) answer += ", ";
                        }
                    }
                    if (actor.bio) {
                        answer += "\n__Bio:__ ";
                        var shortBio = actor.bio.substring(0, 500);
                        var lastIndex = shortBio.lastIndexOf(". ");
                        answer += lastIndex === -1 ? shortBio + "..." : shortBio.substring(0, lastIndex + 1);
                    }
                    if (actor.personalQuotes.length > 0) answer += "\n__Random quote:__ " + getRandomElement(actor.personalQuotes);
                    if (actor.urlPhoto) answer += "\n" + actor.urlPhoto;
                }
                else answer += author.toString() + " I can't find the actor \"" + params + "\" on imdb.";
                sendMsg(msg.channel, answer, { "callback": callback });
            });
        }
    },
    "joined": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var userWanted = getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                var serv = channel.guild;
                db.get("SELECT uo.`firstJoinedAt`, (SELECT  COUNT(*) FROM userByServer ui WHERE  ui.`serverId` = ? AND ui.`firstJoinedAt` != 0 AND (ui.firstJoinedAt) <= (uo.firstJoinedAt)) AS rank FROM userByServer uo WHERE `id` = ? AND `serverId` = ?;",
                    [serv.id, userWanted.id, serv.id], function (err, row) {
                        if (err) {
                            console.log("SQL Error on joined command:\n" + err);
                            callback(new Error("Couldn't get the information from the database."));
                            return;
                        }
                        getAttribute(author.id, serv.id, "timezone", function (timezone) {
                            var time = row['firstJoinedAt'] + timezone;
                            replyMsg(msg, userWanted.username + " joined the server on `" + moment(time).format(fullDateFormattingString) + "`. (" + getNumberSuffix(row['rank']) + " user to have joined)", { "callback": callback });
                        });
                    });
            }
        }
    },
    "gift": {
        "alt": ["give"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            if (msg.mentions.users.size < 1) replyMsg(msg, "You must mention the user(s) you want to gift taypoints to.", { "callback": callback });
            else if (msg.mentions.users.exists('id', author.id)) replyMsg(msg, "You can't gift taypoints to yourself, is this Donran?", { "callback": callback });
            else {
                getTaypointsToSpendFromCommand(msg, params, function (points, totalPoints) {
                    var text = "Gifted `" + points + "/" + totalPoints + "` taypoint";
                    if (points > 1) text += "s";
                    text += ": ";
                    var len = msg.mentions.users.size,
                        pointsForEach = Math.floor(points / len),
                        extraPointsForFirst = points % len,
                        i = 0;

                    msg.mentions.users.forEach(user => {
                        var pointsToGive = pointsForEach;
                        if (i === 0) pointsToGive += extraPointsForFirst;
                        addTaypoints(user.id, channel.guild.id, pointsToGive);
                        text += "`" + pointsToGive + "` point" + (pointsToGive > 1 ? "s" : "") + " to " + cleanFormatting(user.username);
                        if (i === msg.mentions.users.size - 2) text += " and ";
                        else if (i !== msg.mentions.users.size - 1) text += ", ";
                        ++i;
                    });

                    addTaypoints(author.id, channel.guild.id, points * -1);
                    text += ".";
                    replyMsg(msg, text, { "callback": callback });
                }, callback);
            }
        }
    },
    "gamble": {
        "alt": ["supergamble", "sgamble"],
        "help": "",
        "restricted": ChannelType.GAME,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            if (author.id === config.mysaeUserId) { callback(new Error("You can't gamble, because you are Mysae. This is costing bot performance and I hope you feel bad. \uD83D\uDE12")); return; }
            getTaypointsToSpendFromCommand(msg, params, function (points, totalPoints) {
                var threshold = keyword[0] === 's' ? 90 : 50,
                    multiplier = keyword[0] === 's' ? 9 : 1,
                    maxRoll = 100;
                var roll = getRandomInt(1, maxRoll);
                var text = "Gambled `" + points + "/" + totalPoints + "` taypoint";
                if (points > 1) text += "s";
                text += ", rolled `" + roll + "/" + maxRoll + "`. ";
                var pointsWon;
                if (roll > threshold) {
                    pointsWon = points * multiplier;
                    text += "Won `" + pointsWon + "` taypoint";
                    if (pointsWon > 1) text += "s";
                    text += "! \uD83D\uDE04";
                }
                else {
                    text += "Lost `" + points + "` taypoint";
                    if (points > 1) text += "s";
                    text += "! \uD83D\uDE15";
                    pointsWon = points * -1;
                }
                addTaypoints(author.id, channel.guild.id, pointsWon, function (success) {
                    if (success) {
                        getByServerAtt(author.id, channel.guild.id, "taypoints", function (points) {
                            text += " You now have `" + points + "`.";
                            replyMsg(msg, text, { "callback": callback });
                        });
                    }
                    else callback(new Error("Something went wrong when trying to give you " + pointsWon + " taypoints."));
                });
            }, callback);
        }
    },
    "heist": {
        "alt": ["bankheist"],
        "help": "",
        "restricted": ChannelType.GAME,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            getAttribute(author.id, channel.guild.id, "heist", function (playing) {
                if (!playing) {
                    getTaypointsToSpendFromCommand(msg, params, function (points) {
                        setAttribute(author.id, channel.guild.id, "heist", points);
                        addTaypoints(author.id, channel.guild.id, points * -1);
                        if (!heistInProgress) {
                            heistInProgress = true;
                            var text = author.toString() + " started a bank heist, if you want to enter, you have " + (timeToEnterHeist / 1000) + " seconds to do so by typing " + prefix + "heist <taypoints>.";
                            sendMsg(msg.channel, text, { "callback": callback });
                            setTimeout(function () {
                                getHeistingUsers(function (usersHeist) {
                                    if (usersHeist.length > 1) ResolveHeist(usersHeist, channel);
                                    else if (usersHeist.length > 0) {
                                        sendMsg(msg.channel, "The duration was extended by 2 additional minutes for more people to join the heist.");
                                        setTimeout(function () {
                                            getHeistingUsers(function (usersHeist) {
                                                ResolveHeist(usersHeist, channel);
                                            });
                                        }, 120000);
                                    }
                                });
                            }, timeToEnterHeist);
                        }
                        else callback(null);
                    }, callback);
                }
                else callback(null);
            });
        }
    },
    "remindme": {
        "alt": ["reminder"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ").split(";");
            if (params.length === 2) {
                db.get("SELECT `remindme`, `remindmetext`, `timezone` FROM user WHERE `id` = ?", author.id, function (err, row) {
                    if (!err) {
                        if (!row.remindme && !row.remindmetext) {
                            var time = php.strtotime(params[0]) * 1000;
                            if (time > getCurrentTime()) {
                                setGlobalAtt(author.id, "remindme", time, function (success) {
                                    if (success) {
                                        setGlobalAtt(author.id, "remindmetext", params[1].trim(), function (success) {
                                            if (success)
                                                replyMsg(msg, "I will remind you on `" + moment(time + row.timezone).format(fullDateFormattingString) + "` about `" + params[1] + "`.", { "callback": callback });
                                            else
                                                callback(new Error("Something went wrong when trying to set your reminder."));
                                        });
                                    }
                                    else
                                        callback(new Error("Something went wrong when trying to set your reminder."));
                                });
                            }
                            else replyMsg(msg, "You can't be reminded in the past.", { "callback": callback });
                        }
                        else
                            replyMsg(msg, "I already need to remind you on `" + moment(row.remindme + row.timezone).format(fullDateFormattingString) + "` about `" + row.remindmetext + "`. If you want to remove that, use " + prefix + "cremindme.", { "callback": callback });
                    }
                    else callback(new Error("Something went wrong when accessing to the database."));
                });
            }
            else callback(new Error("You need to use the command like this : `" + prefix + "remindme 1 hour ; Tayfan is bae`"));
        }
    },
    "cremindme": {
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            db.run("UPDATE user SET remindme = NULL, remindmetext = NULL WHERE `id` = ?;", author.id, function () {
                replyMsg(msg, "I won't remind you on that anymore.", { "callback": callback });
            });
        }
    },
    "obsolete": {
        "alt": ["left"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var text = "**Users that have left, been kicked or banned from this server:**\n";
            db.each("SELECT userByServer.`id` AS id, usernames.`username` AS username FROM userByServer INNER JOIN usernames ON userByServer.`id` = usernames.`userId` WHERE `serverId` = ? GROUP BY usernames.`userId`;",
                channel.guild.id, function (err, row) {
                    if (!err && !idToUser(row.id, channel.guild))
                        text += "`" + row.id + "` : " + cleanFormatting(row.username) + "\n";
                }, function (retrieved) {
                    sendMsg(msg.channel, text, { "callback": callback });
                });
        }
    },
    "clever": {
        "alt": ["cleverbot", "cbot"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            Cleverbot.prepare(function () {
                cleverbot.write(params.join(" "), function (response) {
                    if (response.sessionid === "\n<head><title>404 Not Found</title></head>")
                        callback(new Error("Cleverbot seems to be unreachable."));
                    else
                        replyMsg(msg, response.message, { "callback": callback });
                });
            });
        }
    },
    "hardmentions": {
        "help": "",
        "alt": ["hardnames", "hardusernames"],
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var response = "**Users with names hard to mention:**";
            var members = channel.guild.members;
            members.forEach(m => {
                for (const charCode of m.user.username) {
                    if (charCode < 32 || charCode > 126) {
                        response += "\n`" + m.id + "` : " + cleanFormatting(name);
                        break;
                    }
                }
            });
            sendMsg(msg.channel, response, { "callback": callback });
        }
    },
    "channelinfo": {
        "alt": ["cinfo", "chnlinfo"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var channels = channel.guild.channels;
            var channelWanted = args.hasOwnProperty('random') ? channels.random() : getChannelFromCommand(params.join(" "), msg, channel);
            if (channelWanted) {
                getAttribute(author.id, channel.guild.id, "timezone", function (timezone) {
                    var arrayInfo = [];
                    if (!channelWanted.isPrivate) arrayInfo.push({ "title": "Name", "content": channelWanted.name });
                    arrayInfo.push({ "title": "ID", "content": channelWanted.id });
                    var created = moment(idToTime(channelWanted.id) + timezone);
                    arrayInfo.push({ "title": "Created", "content": created.format(fullDateFormattingString) + " (" + created.fromNow() + ")" });
                    if (channelWanted.isPrivate) arrayInfo.push({ "title": "Messages", "content": channelWanted.messages.size });
                    else {
                        arrayInfo.push({ "title": "Type", "content": channelWanted.type });
                        arrayInfo.push({ "title": "Position", "content": channelWanted.position });
                        if (channelWanted.type === 'text') {
                            arrayInfo.push({ "title": "Topic", "content": channelWanted.topic });
                            arrayInfo.push({ "title": "Messages", "content": channelWanted.messages.size });
                        }
                        else if (channelWanted.type === 'voice') arrayInfo.push({ "title": "In Channel", "content": channelWanted.members.size });
                        if (channelWanted.hasOwnProperty("guild")) arrayInfo.push({ "title": "Server", "content": channelWanted.guild.name + " (" + channelWanted.guild.id + ")" });
                    }
                    sendMsg(msg.channel, formatSpaces(arrayInfo), { "format": { "before": "```ruby\n", "after": "```" }, "callback": callback });
                });
            }
            else callback(null);
        }
    },
    "roleinfo": {
        "alt": ["rinfo"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var roleWanted = args.hasOwnProperty('random') ? channel.guild.roles.random() : getRoleFromCommand(params.join(" "), msg);
            if (roleWanted) {
                getAttribute(author.id, channel.guild.id, "timezone", function (timezone) {
                    var arrayInfo = [];
                    arrayInfo.push({ "title": "Name", "content": roleWanted.name });
                    arrayInfo.push({ "title": "ID", "content": roleWanted.id });
                    var created = moment(idToTime(roleWanted.id) + timezone);
                    arrayInfo.push({ "title": "Created", "content": created.format(fullDateFormattingString) + " (" + created.fromNow() + ")" });
                    arrayInfo.push({ "title": "Color", "content": roleWanted.hexColor });
                    arrayInfo.push({ "title": "Position", "content": roleWanted.position });
                    arrayInfo.push({ "title": "Users", "content": channel.guild.members.filter(m => m.roles.exists('id', roleWanted.id)).size });
                    var allPerms = roleWanted.serialize();
                    var permsCount = [0, 0];
                    for (var k in allPerms) {
                        if (allPerms.hasOwnProperty(k)) {
                            if (allPerms[k] === true) ++permsCount[0];
                            else ++permsCount[1];
                        }
                    }
                    arrayInfo.push({ "title": "Permissions", "content": permsCount[0] + "/" + (permsCount[0] + permsCount[1]) });
                    arrayInfo.push({ "title": "Managed", "content": roleWanted.managed });
                    arrayInfo.push({ "title": "Hoist", "content": roleWanted.hoist });
                    sendMsg(msg.channel, formatSpaces(arrayInfo), { "format": { "before": "```ruby\n", "after": "```" }, "callback": callback });
                });
            }
            else callback(null);
        }
    },
    "rolecolor": {
        "alt": ["rolecolour", "rcolor", "rcolour"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ");
            if (!params) { callback(new Error("You have to specify a color.")); return; }
            var threshold = 30;
            if (args.hasOwnProperty('min')) {
                var number = parseInt(args.min);
                if (isValidNumberBetween(number, 0)) threshold = 100 - number;
            }
            try {
                var paramColor = new Color(params.toLowerCase());
            } catch (e) {
                callback(new Error(params + " not recognized as a color."));
                return;
            }
            var roles = channel.guild.roles;
            var matches = [];
            channel.guild.roles.forEach(role => {
                if (role.color > 0) {
                    var roleColor = new Color(role.hexColor);
                    var dif = getColorDifference(roleColor, paramColor);
                    if (dif < threshold)
                        matches.push({ "role": role, "dif": dif });
                }
            });

            var len2 = matches.length;
            var answer = "**" + len2 + " role" + (len2 > 1 ? "s" : "");
            answer += " with color similar to " + params + " [" + paramColor.hexString() + "] have been found on this server";
            if (len2 < 1) answer += ".**";
            else {
                answer += ":**\n";
                matches.sort((a, b) => { return a.dif - b.dif; });
                matches.forEach(match => {
                    answer += "\n**" + match.role.name + "** [" + match.role.hexColor + "] `" + match.role.id + "` (" + Math.round(100 - match.dif) + "% similar)";
                });
            }
            sendMsg(msg.channel, answer, { "callback": callback });
        }
    },
    "knowyourmeme": {
        "help": "",
        "alt": ["kym"],
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            params = params.join(" ");
            var uri = params ? URL.parse('http://knowyourmeme.com/search?q=' + params) : URL.parse('http://knowyourmeme.com/memes/random');
            if (params) { replyMsg(msg, URL.format(uri), { "callback": callback }); return; }
            var options = { 'uri': uri, 'headers': { 'User-Agent': 'chrome' } };
            request(options, function (err, response, body) {
                if (!err && response) {
                    if (response.statusCode === 200)
                        replyMsg(msg, response.request.uri.href, { "callback": callback });
                    else callback(new Error("<http://knowyourmeme.com/> responded with unexpected results. Http response code : " + response.statusCode + "."));
                }
                else callback(new Error("<http://knowyourmeme.com/> could not be reached."));
            });
        }
    },
    "serversettings": {
        "alt": ["serversetting", "serverconfig", "sconfig", "ssettings", "prefix", "prefixes"],
        "access": Title.MODERATOR,
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var response = "__**Server settings for:**__ " + cleanFormatting(channel.guild.name) + "\n\n";
            response += "**Prefix: **" + cleanFormatting(serversInfo[channel.guild.id].prefix) + "\n\n";
            getSpecialChannels('game', channel.guild, function (gameChannelsText) {
                response += gameChannelsText + "\n\n";
                getSpecialChannels('spam', channel.guild, function (spamChannelsText) {
                    response += spamChannelsText + "\n\n";
                    getSpecialChannels('log', channel.guild, function (logChannelsText) {
                        response += logChannelsText + "\n\n";
                        getSpecialRoles('mod', channel.guild, function (modRolesText) {
                            response += modRolesText;
                            sendMsg(msg.channel, response, { "callback": callback });
                        });
                    });
                });
            });
        }
    },
    "setmodrole": {
        "alt": ["setmodroles"],
        "access": Title.MODERATOR,
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var roleWanted = getRoleFromCommand(params.join(" "), msg, 0.4);
            if (roleWanted) {
                db.run('INSERT INTO modRole (`id`, `modOf`) VALUES (?, ?);', roleWanted.id, channel.guild.id, function (err) {
                    if (err) {
                        callback(new Error("There was an error when trying to set " + roleWanted.name + " as a mod role for this server. This most likely means it already is."));
                        console.log(err);
                    }
                    else {
                        replyMsg(msg, roleWanted.name + " was successfully set as a mod role for this server.", { "callback": callback });
                    }
                });
            }
            else callback(null);
        }
    },
    "modroles": {
        "alt": ["modrole", "moderatorroles", "moderatorrole"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            getSpecialRoles('mod', channel.guild, function (text) {
                sendMsg(msg.channel, text, { "callback": callback });
            });
        }
    },
    "setgamechannel": {
        "alt": ["setgamechannels"],
        "access": Title.MODERATOR,
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var channelWanted = getChannelFromCommand(params.join(" "), msg, channel, { "type": "text", "threshold": 0.4 });
            if (channelWanted) {
                setSpecialChannel('game', channelWanted, function (response) {
                    replyMsg(msg, response, { "callback": callback });
                });
            }
            else callback(null);
        }
    },
    "gamechannels": {
        "alt": ["gamechannel"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            getSpecialChannels('game', channel.guild, function (text) {
                sendMsg(msg.channel, text, { "callback": callback });
            });
        }
    },
    "setlogchannel": {
        "alt": ["setlogchannels"],
        "access": Title.MODERATOR,
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var channelWanted = getChannelFromCommand(params.join(" "), msg, channel, { "type": "text", "threshold": 0.4 });
            if (channelWanted) {
                setSpecialChannel('log', channelWanted, function (response) {
                    replyMsg(msg, response, { "callback": callback });
                });
            }
            else callback(null);
        }
    },
    "logchannels": {
        "alt": ["logchannel"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            getSpecialChannels('log', channel.guild, function (text) {
                sendMsg(msg.channel, text, { "callback": callback });
            });
        }
    },
    "setspamchannel": {
        "alt": ["setspamchannels", "setspammingchannel", "setspammingchannels"],
        "access": Title.MODERATOR,
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var channelWanted = getChannelFromCommand(params.join(" "), msg, channel, { "type": "text", "threshold": 0.4 });
            if (channelWanted) {
                setSpecialChannel('spam', channelWanted, function (response) {
                    replyMsg(msg, response, { "callback": callback });
                });
            }
            else callback(null);
        }
    },
    "spamchannels": {
        "alt": ["spamchannel", "spammingchannel", "spammingchannels"],
        "help": "",
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            getSpecialChannels('spam', channel.guild, function (text) {
                sendMsg(msg.channel, text, { "callback": callback });
            });
        }
    },
    "invite": {
        "alt": ["join"],
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            sendMsg(msg.author, "Hey, you can invite me to your server by going to : <https://discordapp.com/oauth2/authorize?client_id=" + config.discordClientId + "&scope=bot&permissions=536083519> \uD83D\uDE04", { "callback": callback });
        }
    },
    "reward": {
        "help": "",
        "access": Title.MODERATOR,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var points = getValidNumberFromCommand(params, 1, 5000);
            if (points !== undefined) {
                if (msg.mentions.users.size > 0) {
                    if (!msg.mentions.users.exists('id', author.id)) {
                        var text = "Rewarded " + points + " taypoint" + (points > 1 ? "s" : "") + " to ";
                        var i = 0;
                        msg.mentions.users.forEach(user => {
                            addTaypoints(user.id, channel.guild.id, points);
                            text += user.username;
                            if (i === msg.mentions.users.size - 2) text += " and ";
                            else if (i !== msg.mentions.users.size - 1) text += ", ";
                            ++i;
                        });
                        text += ".";
                        replyMsg(msg, text, { "callback": callback });
                    }
                    else replyMsg(msg, "You can't reward yourself.", { "callback": callback });
                }
                else callback(new Error("You must mention the user(s) you want to reward with taypoints."));
            }
            else callback(new Error("Invalid number of taypoints to reward."));
        }
    },
    "rewardall": {
        "help": "",
        "access": Title.MODERATOR,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var points = getValidNumberFromCommand(params, 1, 500);
            if (points !== undefined) {
                getActiveUsers(channel.guild.id, function (ids) {
                    for (var i = 0; i < ids.length; ++i) {
                        addTaypoints(ids[i], channel.guild.id, points);
                    }
                });
                replyMsg(msg, "Rewarded `" + points + "` taypoint" + (points > 1 ? "s" : "") + " to all active users.", { "callback": callback });
            }
            else callback(new Error("Invalid number of taypoints to reward."));
        }
    },
    "say": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            sendMsg(channel, params.join(" "), { "callback": callback });
            msg.delete();
        }
    },
    "remove": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var points = getValidNumberFromCommand(params, 1);
            if (points !== undefined) {
                if (msg.mentions.users.size > 0) {
                    var text = "Removed " + points + " taypoint" + (points > 1 ? "s" : "") + " from ";
                    var i = 0;
                    msg.mentions.users.forEach(user => {
                        addToServerNum(user.id, channel.guild.id, 'taypoints', points * -1);
                        text += user.username;
                        if (i === msg.mentions.users.size - 2) text += " and ";
                        else if (i !== msg.mentions.users.size - 1) text += ", ";
                        ++i;
                    });
                    text += ".";
                    replyMsg(msg, text, { "callback": callback });
                } else callback(null);
            } else callback(null);
        }
    },
    "resetavatar": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            client.user.setAvatar(fs.readFileSync('avatar.png'))
                .then(user => console.log(`Avatar was reset.`))
                .catch(e => console.log(`Error occured when resetting avatar:\n${e}`));
            callback(null);
        }
    },
    "eval": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var start = now();
            try {
                var evaluation = eval(params.join(" "));
            } catch (e) {
                console.log(e.stack);
                sendMsg(msg.channel, e.toString(), { "format": { "before": "```js\n", "after": "```" }, "callback": callback });
                return;
            }
            if (evaluation === "") evaluation = "\"\"";
            sendMsg(msg.channel, `\`Evaluation took ${now() - start} ms\`\n${evaluation}`, { "callback": callback });
        }
    },
    "globalignore": {
        "alt": ["gignore"],
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var userWanted = getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                var msToIgnore = 86400000;
                var ignoreUntil = moment(getCurrentTime() + msToIgnore);
                setGlobalAtt(userWanted.id, 'ignoreUntil', ignoreUntil.valueOf(), function (success) {
                    if (success)
                        replyMsg(msg, "I will ignore " + displayFullUser(userWanted) + " until `" + ignoreUntil.format(fullDateFormattingString) + "`. \uD83D\uDE04", { "callback": callback });
                    else
                        callback(new Error("Something went wrong when trying to global ignore " + displayFullUser(userWanted) + "."));
                });
            }
        }
    },
    "globalunignore": {
        "alt": ["gunignore"],
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var userWanted = getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                setGlobalAtt(userWanted.id, 'ignoreUntil', getCurrentTime(), function (success) {
                    if (success)
                        replyMsg(msg, `I won't ignore ${displayFullUser(userWanted)} anymore. \uD83D\uDE04`, { "callback": callback });
                    else
                        callback(new Error("Something went wrong when trying to global unignore " + displayFullUser(userWanted) + "."));
                });
            }
        }
    },
    "restart": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            callback(null);
            console.log("Atempting to update project and restart.");
            exec("cd ~/TaylorBot", function (err, stdout, stderr) {
                if (!err) {
                    console.log("Pulling from git.");
                    exec('git pull origin master', function (err, stdout, stderr) {
                        if (err) {
                            console.log(`Error when pulling from git:\n${stderr}`);
                            callback(Error("Error when pulling from git."));
                        }
                        else {
                            console.log(`${stdout}\nKilling process.`);
                            bot.destroy().then(() => {
                                process.exit(0);
                            }).catch(console.log);
                        }
                    });
                }
                else callback(new Error("Something went wrong when trying to cd."))
            });
        }
    },
    "stop": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            setGlobalAtt(author.id, "answered", 1, function () {
                console.log("Atempting to stop taylorbot.");
                exec("sudo pm2 stop taylorbot", function (err, stdout, stderr) {
                    if (!err) {
                        console.log("Process stopped.");
                    }
                    else callback(new Error("Something went wrong when trying to stop taylorbot."))
                });
            });
        }
    },
    "resetanswered": {
        "help": "",
        "access": Title.OWNER,
        "process": function (msg, author, channel, prefix, keyword, params, args, callback) {
            var userWanted = getUserFromCommand(params.join(" "), msg, author, channel, callback);
            if (userWanted) {
                userWanted = userWanted.user;
                setGlobalAtt(userWanted.id, "answered", 1, function (success) {
                    if (success)
                        replyMsg(msg, "I won't ignore " + userWanted.username + " (`" + userWanted.id + "`) anymore. \uD83D\uDE04", { "callback": callback });
                });
            }
        }
    }
};


bot.on('ready', () => {
    console.log('Ready!');
    stopIntervals();
    startIntervals();
    init();
});


bot.on("disconnect", function () {
    console.log("Disconnected from Discord!");

    bot.destroy().then(() => {
        process.exit(0);
    }).catch(console.log);
});

bot.on("message", function (msg) {
    if (!prefixesInit) return;
    if (!msg.channel.hasOwnProperty('guild')) return;

    var prefix = serversInfo[msg.guild.id].prefix,
        messageText = msg.content.trim();

    var messagesToAdd = 1, wordsToAdd = messageText.replace(/\s\s+|\r?\n|\r/g, ' ').split(" ").length, rewardForMessageMilestone = 1, rewardForWordsMilestone = 1, nbMessagesForReward = 25, nbWordsForReward = 120;
    db.run("UPDATE userByServer SET `messages` = `messages`+?, `wordscount` = `wordscount`+? WHERE `id` = ? AND `serverId`=? AND (SELECT `id` FROM spamChannel WHERE `id` = ?) IS NULL;",
        [messagesToAdd, wordsToAdd, msg.author.id, msg.guild.id, msg.channel.id], function (err) {
            if (err) console.log("SQL Error when trying to add message to all " + msg.author.username + " (" + msg.author.id + ")" + ":\n" + err);
            else {
                db.run("UPDATE userByServer SET `messagesMilestone` = (`messages`-(`messages`%?)), `taypoints`=`taypoints`+? WHERE `messages` >= `messagesMilestone`+? AND `serverId` = ?;",
                    [nbMessagesForReward, rewardForMessageMilestone, nbMessagesForReward, msg.guild.id], function (err) {
                        if (err) console.log(err);
                    });
                db.run("UPDATE userByServer SET `wordsMilestone` = (`wordscount`-(`wordscount`%?)), `taypoints`=`taypoints`+? WHERE `wordscount` >= `wordsMilestone`+? AND `serverId` = ?;",
                    [nbMessagesForReward, rewardForWordsMilestone, nbWordsForReward, msg.guild.id], function (err) {
                        if (err) console.log(err);
                    });
            }
        });

    addToNumChannel(msg.channel, 'messages', 1);

    var time = getCurrentTime();
    setByServerAtt(msg.author.id, msg.guild.id, 'lastSpoke', time);
    setGlobalAtt(msg.author.id, 'lastSeen', time);

    if (msg.author.bot) return;

    if (messageText.startsWith(prefix)) {
        var command = messageText.substring(prefix.length).split(" ");
        var keyword = command[0].toLowerCase();
        var params = command.slice(1, command.length);

        var arrayArgs = getArgs(params);
        var args = arrayArgs[0];
        if (Object.keys(args).length > 0) params = arrayArgs[1];

        var author = msg.author;
        var channel = msg.channel;

        if (author.id === config.ownerUserId) {
            if (args.hasOwnProperty('in')) {
                var inArg = getChannelFromText(args.in, undefined, null, 'text');
                if (inArg) channel = inArg;
            }
            if (args.hasOwnProperty('as')) {
                var as = getUserFromText(args.as, channel.guild);
                if (as) author = as;
            }
        }

        var cmdName = getCommandFromText(keyword);
        if (cmdName && !commands[cmdName].disabled) {
            executeCommand(cmdName, msg, author, channel, prefix, keyword, params, args);
        }
        else {
            var cmdAtt = getAttributeFromText(keyword);
            if (cmdAtt) executeCommand("get ", msg, author, channel, prefix, cmdAtt, params, args);
            else if (keyword.startsWith("rank")) executeCommand("rank ", msg, author, channel, prefix, keyword.substring(4), params, args);
            else if (keyword.startsWith("set")) executeCommand("set ", msg, author, channel, prefix, keyword.substring(3), params, args);
            else if (keyword.startsWith("clear")) executeCommand("clear ", msg, author, channel, prefix, keyword.substring(5), params, args);
            else if (keyword.startsWith("list")) executeCommand("list ", msg, author, channel, prefix, keyword.substring(4), params, args);
            else if (strings.albums[keyword]) sendMsg(msg.channel, strings.albums[keyword]);
        }
    }
    else {
        var poll = polls[msg.channel.id];
        if (poll && poll.active) {
            var num = parseInt(messageText);
            if (isValidNumberBetween(num, 1) && !msg.author.bot) poll.vote(num, msg.author.id);
        }
        if (msg.mentions.users.exists('id', bot.user.id)) {
            var text = messageText.replace(bot.user.toString(), "").replace(/\s\s+|\r?\n|\r/g, ' ');
            text = cleanMentions(text, msg.mentions.users).trim();
            executeCommand("clever", msg, author, msg.channel, prefix, keyword, text.split(" "), args);
        }
    }
});

bot.on('userUpdate', (oldUser, newUser) => {
    if (oldUser.presence.status !== newUser.presence.status) {
        setGlobalAtt(newUser.id, "lastSeen", getCurrentTime());
    }

    if (oldUser.username !== newUser.username) {
        console.log(oldUser.username + " just changed his name to " + newUser.username + ".");
        addNewUsername(newUser, getCurrentTime());
    }
});

bot.on('guildMemberAdd', (guildMember) => {
    addNewUser(guildMember.user, guildMember.guild);
    db.each("SELECT `id` FROM logChannel WHERE `logOf` = ?", guildMember.guild.id, (err, row) => {
        if (err) console.log(err);
        else sendMsg(idToChannel(row.id, guildMember.guild, 'text'), displayFullUser(guildMember.user) + " just joined the server!");
    });
});

bot.on('guildMemberRemove', (guildMember) => {
    db.each("SELECT `id` FROM logChannel WHERE `logOf` = ?", guildMember.guild.id, (err, row) => {
        if (err) console.log(err);
        else sendMsg(idToChannel(row.id, guildMember.guild, 'text'), displayFullUser(guildMember.user) + " left/was kicked from the server!");
    });
});

bot.on('guildBanAdd', (guild, user) => {
    db.each("SELECT `id` FROM logChannel WHERE `logOf` = ?", guild.id, function (err, row) {
        if (err) console.log(err);
        else sendMsg(idToChannel(row.id, guild, 'text'), displayFullUser(user) + " was banned from the server!");
    });
});

bot.on('guildBanRemove', (guild, user) => {
    db.each("SELECT `id` FROM logChannel WHERE `logOf` = ?", guild.id, function (err, row) {
        if (err) console.log(err);
        else sendMsg(idToChannel(row.id, guild, 'text'), displayFullUser(user) + " was unbanned from the server!");
    });
});

bot.on('messageDelete', (msg) => {
    if (!msg || !msg.channel || msg.channel.type === 'dm' || msg.channel.type === 'group') return;
    console.log("Detected deleted message from " + msg.author.username + ": \"" + msg.content + "\" in #" + msg.channel.name + ".");
    var wordsToRemove = msg.content.trim().replace(/\s\s+|\r?\n|\r/g, ' ').split(" ").length;
    wordsToRemove = wordsToRemove > 20 ? Math.round(wordsToRemove * -1.25) : wordsToRemove * -1;
    var messagesToRemove = 1;
    db.run("UPDATE userByServer SET `messages` = `messages`-?, `wordscount` = `wordscount`-? WHERE `id` = ? AND (SELECT `id` FROM spamChannel WHERE `id` = ?) IS NULL AND `serverId`=?;",
        [messagesToRemove, wordsToRemove, msg.author.id, msg.channel.id, msg.guild.id], function (err) {
            if (err) console.log("SQL Error when trying to delete message and words of " + msg.author.username + " (" + msg.author.id + ")" + ":\n" + err);
        });
});

bot.on('channelCreate', (channel) => {
    if (channel.type === 'text')
        addNewChannel(channel);
});

bot.on('guildCreate', (guild) => {
    serversInfo[guild.id] = { "prefix": "!" };
    db.run("INSERT INTO server (`id`) VALUES (?);", guild.id, function (err) {
        if (err) console.log("SQL Error when trying to add server " + guild.name + " to the database.\n" + err);
        else console.log("Added server " + guild.name + " to the database.");
    });
    guild.channels.forEach(c => {
        if (c.type === 'text')
            addNewChannel(c);
    });
    guild.members.forEach(m => {
        addNewUser(m.user, guild);
    });
});

function executeCommand(commandName, msg, author, channel, prefix, keyword, params, args) {
    console.log(`${msg.author.username} (${msg.author.id}) is attempting to execute '${commandName}' command with${keyword ? " keyword " + keyword : "out keyword"} and ${params.length > 0 ? "params: " + params : "no params."}`);
    var command = commands[commandName];
    db.get('SELECT `answered`, `lastCommand`, `ignoreUntil` FROM user WHERE `id` = ?', msg.author.id, function (err, row) {
        if (err) console.log("SQL Error when trying to get lastCommand and ignoreUntil of user " + msg.author.username + " (" + msg.author.id + "):\n" + err);
        else {
            var timeNow = getCurrentTime();
            if ((row.answered !== 0 || (timeNow - row.lastCommand) > msCooldownOnCommands) && timeNow > row.ignoreUntil) {
                canAccess(author, channel.guild, command.access, function (canAccess) {
                    if (canAccess) {
                        canUseCommand(channel, channel.guild, command.restricted, function (canUse) {
                            if (canUse) {
                                console.log(`${msg.author.username} (${msg.author.id}) is executing '${commandName}' command with${keyword ? " keyword " + keyword : "out keyword"} and ${params.length > 0 ? "params: " + params : "no params."}`);
                                setGlobalAtt(msg.author.id, 'lastCommand', getCurrentTime());
                                setGlobalAtt(msg.author.id, 'answered', 0);
                                command.process(msg, author, channel, prefix, keyword, params, args, function (err) {
                                    console.log(`${msg.author.username} (${msg.author.id}) has been answered.`);
                                    if (err) replyMsg(msg, "Oh no, there was an error with your command: " + err.message + " \uD83D\uDE26");
                                    setGlobalAtt(msg.author.id, 'answered', 1);
                                });
                            }
                        });
                    }
                    else {
                        console.log(`${author.username} (${author.id}) was prevented from using '${commandName}' command.`);
                        replyMsg(msg, "Hmm, looks like I can't let you do that. \uD83D\uDE15");
                    }
                });
            }
        }
    })
}

function canAccess(user, server, minTitle, callback) {
    if (minTitle === undefined || minTitle === Title.EVERYONE) callback(true);
    else {
        getUserTitle(user, server, function (userTitle) {
            if (userTitle >= minTitle) callback(true);
            else callback(false);
        });
    }
}

function getUserTitle(user, server, callback) {
    if (user.id === config.ownerUserId) {
        callback(Title.OWNER); return;
    }
    else if (server.owner.id === user.id) {
        callback(Title.MODERATOR); return;
    }
    var userTitle = Title.EVERYONE;
    db.each('SELECT `id` FROM modRole WHERE `modOf` = ?;', server.id, function (err, row) {
        if (!err && server.members.get(user.id).roles.get(row.id)) {
            userTitle = Title.MODERATOR;
        }
    }, function (err, retrieved) {
        callback(userTitle);
    });
}

function canUseCommand(channel, server, channelType, callback) {
    if (channelType === undefined || channelType === ChannelType.ANY) callback(true);
    else if (channelType === ChannelType.NONE) callback(false);
    else {
        db.get('SELECT channel.id, `gameOf`, `spamOf`, `logOf` FROM channel LEFT JOIN gameChannel ON channel.id = gameChannel.id LEFT JOIN spamChannel ON channel.id = spamChannel.id LEFT JOIN logChannel ON channel.id = logChannel.id WHERE channel.id = ?;', channel.id, function (err, row) {
            if (!err) {
                switch (channelType) {
                    case ChannelType.GAME:
                        callback(server.id === row.gameOf);
                        break;
                    case ChannelType.SPAMMING:
                        callback(server.id === row.spamOf);
                        break;
                    case ChannelType.LOG:
                        callback(server.id === row.logOf);
                        break;
                }
            }
            else console.log(err);
        });
    }
}

function getAttribute(userId, serverId, attributeToGet, callback) {
    var attribute = getAttributeFromText(attributeToGet);
    if (attribute) {
        var attributeObj = attributes[attribute];
        if (attributeObj.hasOwnProperty('getter')) attributeObj.getter(userId, serverId, callback);
        else if (attributeObj.global) getGlobalAtt(userId, attribute, callback);
        else getByServerAtt(userId, serverId, attribute, callback);
    }
}

function getGlobalAtt(userId, attributeToGet, callback) {
    db.get("SELECT `" + attributeToGet + "` FROM user WHERE `id` = ? LIMIT 1;", userId, function (err, row) {
        if (err)
            console.log("SQL Error while trying to get " + attributeToGet + " for " + userId + ":\n" + err);
        else if (row)
            callback(row[attributeToGet]);
        else
            console.log("This shouldn't happen, but no rows were found while trying to get " + attributeToGet + " for " + userId);
    });
}

function getByServerAtt(userId, serverId, attributeToGet, callback) {
    db.get("SELECT `" + attributeToGet + "` FROM userByServer WHERE `id` = ? AND `serverId` = ? LIMIT 1;", [userId, serverId], function (err, row) {
        if (err)
            console.log("SQL Error while trying to get server " + attributeToGet + " for " + userId + " in " + serverId + ":\n" + err);
        else if (row)
            callback(row[attributeToGet]);
        else
            console.log("This shouldn't happen, but no rows were found while trying to get server " + attributeToGet + " for " + userId + " in " + serverId);
    });
}

function setAttribute(userId, serverId, attributeToSet, newValue, callback) {
    var attribute = getAttributeFromText(attributeToSet);
    if (attribute) {
        var attributeObj = attributes[attribute];
        if (attributeObj.global) setGlobalAtt(userId, attribute, newValue, callback);
        else setByServerAtt(userId, serverId, attribute, callback);
    }
}

function setGlobalAtt(userId, attributeToSet, newValue, callback) {
    db.run("UPDATE user SET `" + attributeToSet + "` = ? WHERE `id` = ?;", [newValue, userId], function (err) {
        if (err) {
            console.log("SQL Error while trying to set " + attributeToSet + " for " + userId + ":\n" + err);
            if (callback) callback(false);
        }
        else {
            if (this.changes === 0) {
                console.log("Looks like " + userId + " wasn't in the user table when trying to set his " + attributeToSet + ".");
                var user = idToUser(userId);
                if (user) {
                    console.log("Attempting to add user to database.");
                    db.run("INSERT INTO user (`id`, `" + attributeToSet + "`) VALUES (?, ?);", [userId, newValue], function (err) {
                        if (err) {
                            console.log("SQL Error when trying to add user " + user.username + " (" + user.id + ") to the user table:\n" + err);
                            if (callback) callback(false);
                        }
                        else {
                            console.log("Added user " + user.username + " (" + user.id + ") to the user table.");
                            addNewUser(user);
                            if (callback) callback(true);
                        }
                    });
                }
                else if (callback) callback(false);
            }
            else if (callback) callback(true);
        }
    });
}

function setByServerAtt(userId, serverId, attributeToSet, newValue, callback) {
    db.run("UPDATE userByServer SET `" + attributeToSet + "` = ? WHERE `id` = ? AND `serverId` = ?;", [newValue, userId, serverId], function (err) {
        if (err) {
            console.log("SQL Error while trying to set " + attributeToSet + " for " + userId + ":\n" + err);
            if (callback) callback(false);
        }
        else {
            if (this.changes === 0) {
                console.log("Looks like " + userId + " wasn't in the userByServer table when trying to set his " + attributeToSet + ".");
                const user = idToUser(userId);
                if (user) {
                    if (user.user)
                        user = user.user;
                    const { username, id } = user;
                    console.log("Attempting to add user to database.");
                    db.run("INSERT INTO userByServer (`id`, `serverId`, `" + attributeToSet + "`) VALUES (?, ?, ?);", [userId, serverId, newValue], function (err) {
                        if (err) {
                            console.log("SQL Error when trying to add user " + username + " (" + id + ") to the userByServer table with server " + serverId + ":\n" + err);
                            if (callback) callback(false);
                        }
                        else {
                            console.log("Added user " + username + " (" + id + ") to the userByServer table with server " + serverId + ".");
                            addNewUser(user, idToServer(serverId));
                            if (callback) callback(true);
                        }
                    });
                }
                else if (callback) callback(false);
            }
            else if (callback) callback(true);
        }
    });
}

function addToServerNum(userId, serverId, attributeToChange, valueToAdd, callback) {
    var query = "UPDATE userByServer SET `" + attributeToChange + "` = `" + attributeToChange + "`+? WHERE `id` = ? AND `serverId` = ? AND typeof (`" + attributeToChange + "`) == 'integer';";
    db.run(query, [valueToAdd, userId, serverId], function (err) {
        if (err) {
            console.log("SQL Error while trying to add to " + attributeToChange + " for " + userId + " in server " + serverId + " :\n" + err);
            if (callback) callback(false);
        }
        else {
            if (this.changes === 0) {
                console.log("Looks like " + userId + " wasn't in the userByServer table when trying to add to his " + attributeToChange + ".");
                setByServerAtt(userId, serverId, attributeToChange, valueToAdd, callback);
            }
            else if (callback) callback(true);
        }
    });
}

function addToNumChannel(channel, attributeToAdd, valueToAdd, callback) {
    db.run("UPDATE channel SET `" + attributeToAdd + "` = `" + attributeToAdd + "`+? WHERE `id` = ? AND typeof (`" + attributeToAdd + "`) == 'integer';", [valueToAdd, channel.id], function (err) {
        if (err) {
            console.log("SQL Error while trying to add to channel attribute " + attributeToAdd + " for " + channel.name + " (" + channel.id + "):\n" + err);
            if (callback) callback(false);
        }
        else {
            if (this.changes === 0) {
                console.log("Looks like " + channel.name + " (" + channel.id + " wasn't in the channel table when trying to add to its " + attributeToAdd + ".");
                db.run('INSERT INTO channel (`id`, `serverId`, `' + attributeToAdd + '`) VALUES (?, ?, ?)', [channel.id, channel.guild.id, valueToAdd], function (err) {
                    if (err) {
                        console.log("SQL Error when adding new channel " + channel.name + " (" + channel.id + ") with attribute " + attributeToAdd + " to the channel table:\n" + err);
                        if (callback) callback(false);
                    }
                    else {
                        console.log("New channel " + channel.name + " (" + channel.id + ") with attribute " + attributeToAdd + " with value " + valueToAdd + " was successfully added to the channel table:");
                        if (callback) callback(true);
                    }
                });
            }
            else if (callback) callback(true);
        }
    });
}

function addTaypoints(userId, serverId, taypointsToAdd, callback) {
    taypointsToAdd = Math.round(taypointsToAdd);
    db.run("UPDATE userByServer SET `taypoints` = CASE WHEN (`taypoints` + ?) > 0 THEN (`taypoints` + ?) ELSE 0 END WHERE `id` = ? AND `serverId` = ?;", [taypointsToAdd, taypointsToAdd, userId, serverId], function (err) {
        if (err) {
            console.log("SQL Error while trying to add " + taypointsToAdd + " taypoints for " + userId + "in server " + serverId + ":\n" + err);
            if (callback) callback(false);
        }
        else {
            if (this.changes === 0) {
                console.log("Looks like " + userId + " wasn't in the user table when trying to set his taypoints.");
                var user = idToUser(userId);
                if (user) {
                    console.log("Attempting to add user " + user.username + " (" + user.id + ") to the userByServer table with server " + serverId + ".");
                    db.run("INSERT INTO userByServer (`id`, `serverId`, `taypoints`) VALUES (?, ?, CASE WHEN ? < 0 THEN 0 ELSE ? END);", [userId, serverId, taypointsToAdd, taypointsToAdd], function (err) {
                        if (err) {
                            console.log("SQL Error when trying to add user " + user.name + " (" + user.id + ") to the userByServer table with server " + serverId + ":\n" + err);
                            if (callback) callback(false);
                        }
                        else {
                            console.log("Added user " + user.name + " (" + user.id + ") to the userByServer table with server " + serverId + ". Trying to add to all the others.");
                            addNewUser(user);
                            if (callback) callback(true);
                        }
                    });
                }
                else if (callback) callback(false);
            }
            else if (callback) callback(true);
        }
    });
}

function addNewUser(user, guild) {
    addNewGlobalUser(user);

    if (guild) addNewByServerUser(user, guild);

    addNewUsername(user, getCurrentTime());
}

function addNewGlobalUser(user) {
    db.run("INSERT INTO user (`id`) VALUES (?);", user.id, function (err) {
        if (err)
            console.log("SQL Error when trying to add user " + user.username + " (" + user.id + ") to the database.\n" + err);
        else
            console.log("Added user " + user.username + " (" + user.id + ") to the user table.");
    });
}

function addNewByServerUser(user, guild) {
    db.run("INSERT INTO userByServer (`id`, `serverId`, `firstJoinedAt`) VALUES (?, ?, ?);", [user.id, guild.id, guild.member(user).joinedAt.getTime()], function (err) {
        if (err)
            console.log("SQL Error when trying to add user " + user.username + " (" + user.id + ") for server (" + guild + ") to the userByServer table.\n" + err);
        else
            console.log("Added user " + user.username + " (" + user.id + ") for server (" + guild + ") to the userByServer table.");
    });
}

function addNewUsername(user, since, callback) {
    db.get('SELECT `username` FROM usernames WHERE `userId` = ? GROUP BY `userId`;', user.id, function (err, row) {
        if (!err) {
            if (row && row.username === user.username) console.log("Username " + user.username + " was not added to the usernames table because it was already the latest username.");
            else {
                db.run('INSERT INTO usernames (`userId`, `username`, `since`) VALUES (?, ?, ?);', [user.id, user.username, since], function (err) {
                    if (err) {
                        console.log("SQL Error when trying to add new username of " + user.username + " (" + user.id + "):\n" + err);
                        if (callback) callback(false);
                    }
                    else {
                        console.log("Successfully added new username of " + user.username + " (" + user.id + ").");
                        if (callback) callback(true);
                    }
                });
            }
        }
        else console.log("Error when checking latest username for " + user.username + " (" + user.id + "):\n" + err);
    });
}

function addNewChannel(channel, callback) {
    if (channel.type === 'text') {
        db.run('INSERT INTO channel (`id`, `serverId`) VALUES (?, ?)', [channel.id, channel.guild.id], function (err) {
            if (err) {
                console.log("SQL Error when adding new channel " + channel.name + " (" + channel.id + ") to the channel table:\n" + err);
                if (callback) callback(false);
            }
            else {
                console.log("New channel " + channel.name + " (" + channel.id + ") was successfully added to the channel table:");
                if (callback) callback(true);
            }
        });
    }
    else console.log("Channel " + channel.name + " (" + channel.id + ") was not added to the channel table because it is private or a voice channel.");
}

function getRankedUsers(attributeToRank, server, callback) {
    var attribute = getAttributeFromText(attributeToRank);
    if (attribute) {
        var attributeObj = attributes[attribute];
        if (attributeObj.global) getRankedUsersSQL(attribute, server, callback);
        else getRankedUsersByServer(attribute, server, callback);
    }
}

function getRankedUsersSQL(attributeToRank, server, callback) {
    var query = "SELECT `id`, `" + attributeToRank + "` FROM user WHERE `" + attributeToRank + "` NOT NULL;";
    var allRows = [];
    db.each(query, function (err, row) {
        if (err) {
            console.log("SQL Error when trying to rank by " + attributeToRank + ":\n" + err);
            callback(new Error("Database Error"));
            return;
        }
        else {
            var user = server.members.get(row.id);
            if (user) {
                row.isBot = user.user.bot;
                allRows.push(row);
            }
        }
    }, function () {
        callback(null, allRows.sort(function (a, b) { return b[attributeToRank] - a[attributeToRank]; }));
    });
}

function getRankedUsersByServer(attributeToRank, server, callback) {
    var query = "SELECT `id`, `" + attributeToRank + "` FROM userByServer WHERE `" + attributeToRank + "` NOT NULL AND `serverId` = ?";
    var allRows = [];
    db.each(query, server.id, function (err, row) {
        if (err) {
            console.log("SQL Error when trying to rank by " + attributeToRank + " for server " + server.name + " (" + server.id + "):\n" + err);
            callback(new Error("Database Error"));
            return;
        }
        else {
            var user = server.members.get(row.id);
            if (user) {
                row.isBot = user.user.bot;
                allRows.push(row);
            }
        }
    }, function () {
        callback(null, allRows.sort(function (a, b) { return b[attributeToRank] - a[attributeToRank]; }));
    });
}

function defaultValidator(valueToValidate, cb) {
    if (valueToValidate.indexOf("\n") > -1) cb({ "valid": false });
    else cb({ "valid": true, "value": valueToValidate });
}

function getSharedServers(userId) {
    return bot.guilds.filter(g => {
        return g.members.exists('id', userId);
    });
}

function idToTime(id) {
    return ((bignum(id).div(4194304)).add("1420070400000")).toNumber();
}

function formatSpaces(array) {
    var m = -Infinity, i = 0, n = array.length, answer = "";
    for (; i != n; ++i) {
        if (array[i].title.length > m) m = array[i].title.length;
    }
    for (var k = 0; k < n; ++k) {
        var extraSpaces = m - array[k].title.length;
        for (var j = 0; j < extraSpaces; ++j) { answer += "\u200B "; }
        answer += array[k].title + ": " + array[k].content + (k === n - 1 ? "" : "\n");
    }
    return answer;
}

function cleanFormatting(text) {
    return text.replace(/`|\*|_|~/g, x => { return "\\" + x; });
}

function displayFullUser(user) {
    return cleanFormatting(user.username) + "#" + user.discriminator + " (`" + user.id + "`)";
}

function getArgs(params) {
    var tempParams = params.join(" "),
        regexArgs = /\|([^,|]+)/g,
        argsMatch,
        argsMatches = [],
        args = {};

    while (argsMatch = regexArgs.exec(tempParams)) {
        argsMatches.push({ "full": argsMatch[0], "sub": argsMatch[1] });
    }

    for (var i = 0, mLen = argsMatches.length; i < mLen; ++i) {
        var arg = argsMatches[i].sub.split("=");
        var argName = arg[0].toLowerCase().trim();
        var argValue;
        if (arg.length === 1) argValue = undefined;
        else {
            arg = arg.slice(1, arg.length).join("");
            argValue = arg === "" ? undefined : arg.trim();
        }
        args[argName] = argValue;
        tempParams = tempParams.replace(argsMatches[i].full, '');
    }
    tempParams = tempParams.trim().split(" ");
    return [args, tempParams];
}

function imdbSearch(search, searchForMovie, cb) {
    var typeUrl = searchForMovie ? "quotes=1&title" : "bornDied=1&spouses=1&personalQuotes=1&name";
    var arrayName = searchForMovie ? "movies" : "names";
    request("http://api.myapifilms.com/imdb/idIMDB?" + typeUrl + "=" + search.replace(/&/g, '') + "&format=json&token=" + config.myapifilmsToken + "&language=en-us", function (err, response, body) {
        if (!err) {
            try {
                var result = JSON.parse(body);
                cb(result.data[arrayName][0]);
            } catch (e) {
                console.log("There was an error when trying to process IMDB data for search " + search + ":\n" + e);
                cb(null);
            }
        }
        else {
            console.log("There was an error when trying to request myapifilms's api:\n" + err);
            cb(null);
        }
    });
}

function getSubredditAbout(search, cb) {
    var url = "https://www.reddit.com/r/" + search + "/about/.json";
    request(url, function (err, res, body) {
        if (err) {
            cb(err);
            console.log("There was an error when trying to request reddit's about page for " + search + ":\n" + err);
            return;
        }
        var result = JSON.parse(body);
        if (result.error) {
            if (result.error === 403) cb(new Error("403 : Subreddit access is forbidden"));
            else if (result.error === 404) cb(new Error("404 : Subreddit is either banned or irregular"));
            else cb(new Error("Unknow error : " + result.error));
        }
        else {
            try { var data = result.data; } catch (e) { cb(new Error(res.statusCode + ", This might mean reddit is down.")); return; }
            if (data.children) cb(new Error("Subreddit doesn't exist"));
            else cb(null, data);
        }
    });
}

function getColorDifference(color1, color2) {
    var json1 = color1.toJSON('lab'), json2 = color2.toJSON('lab');
    return DeltaE.getDeltaE00({ L: json1.l, A: json1.a, B: json1.b }, { L: json2.l, A: json2.a, B: json2.b });
}

function cleanMentions(text, mentions) {
    for (var i = 0; i < mentions.length; ++i) {
        text = text.replace(mentions[i].toString(), mentions[i].username);
    }
    return text;
}

function getCommandFromText(text) {
    if (commands[text]) return text;
    for (var key in commands) {
        if ((commands[key].alt && commands[key].alt.indexOf(text) > -1))
            return key;
    }
    return null;
}

function getAttributeFromText(text) {
    if (attributes[text]) return text;
    for (var key in attributes) {
        if ((attributes[key].alt && attributes[key].alt.indexOf(text) > -1) || attributes[key].text === text)
            return key;
    }
    return null;
}

function getTextAttribute(attribute) {
    var att = attributes[attribute];
    if (att && att.text) return att.text;
    return attribute.charAt(0).toUpperCase() + attribute.substring(1);
}

function mod(a, b) {
    var c = a % b;
    return c < 0 ? c + b : c;
}

function compare(choice1, choice2) {
    var x = choices.map(function (d) { return d.text; }).indexOf(choice1);
    var y = choices.map(function (d) { return d.text; }).indexOf(choice2);
    return (x === y) ? "tie" : mod((x - y), choices.length) < choices.length / 2 ? choice1 : choice2;
}

function getNumberSuffix(i) {
    var j = i % 10,
        k = i % 100;
    if (j === 1 && k !== 11) return i + "st";
    if (j === 2 && k !== 12) return i + "nd";
    if (j === 3 && k !== 13) return i + "rd";
    return i + "th";
}

function getWeather(msg, location, units, callback) {
    var unit = units === 'K' ? 'C' : units;
    weather.find({ search: location, degreeType: unit }, function (err, result) {
        if (err) replyMsg(msg, "Location \"" + location + "\" not found.");
        else if (result !== undefined) {
            if (result[0] !== undefined) {
                var current = result[0].current;
                if (units === 'K') {
                    current.temperature = Math.round(parseInt(current.temperature) + 273.15);
                    current.feelslike = Math.round(parseInt(current.feelslike) + 273.15);
                }
                else units = "\u00B0" + units;
                var text = "It's " + current.temperature + units;
                if (current.temperature !== current.feelslike)
                    text += " (feels like " + current.feelslike + units + ")";
                replyMsg(msg, text + " in " + result[0].location.name + " right now. The sky is " + current.skytext.toLowerCase() + ".", { "callback": callback });
            }
        }
    });
}

function idToServer(serverId) {
    return bot.guilds.get(serverId);
}

function idToUser(userId, server) {
    if (typeof server === 'string') server = idToServer(server);
    var members = server ? server.members : bot.users;
    return members.get(userId);
}

function discrimToUser(discrim, server) {
    if (typeof server === 'string') server = idToServer(server);
    return server ? server.members.filter(m => m.user.discriminator === discrim).first() : bot.users.find('discriminator', discrim);
}

function usernameToUser(username, server, threshold) {
    var members = server ? server.members : bot.users;
    didYouMean.threshold = threshold ? threshold : null;
    username = didYouMean(username, members, 'username');
    return members.find('username', username);
}

function idToUsername(id, server) {
    var user = idToUser(id, server);
    if (user && user.hasOwnProperty('user')) user = user.user;
    return user ? user.username : "";
}

function getUserFromCommand(param, msg, author, channel, commandCallback, options) {
    var dontAnswer = options ? options.dontAnswer : false, threshold = options ? options.threshold : undefined;
    if (param) {
        var user = getUserFromText(param, channel ? channel.guild : null, threshold);
        if (user) return user;
        if (!dontAnswer)
            replyMsg(msg, "User \"" + param + "\" was not found on the server.", { "callback": commandCallback });
        return null;
    }
    else return channel.guild.members.get(author.id);
}

function getUserFromText(text, server, threshold) {
    var user = null;

    var mentionMatches = /<@!?([0-9]+)>/g.exec(text);
    if (mentionMatches) {
        user = idToUser(mentionMatches[1], server);
        if (user) return user;
    }
    user = idToUser(text, server);
    if (user) return user;
    var discrimMatches = /#(\d{4})$/g.exec(text);
    if (discrimMatches) {
        user = discrimToUser(discrimMatches[1], server);
        if (user) return user;
    }
    user = usernameToUser(text, server, threshold);
    return user;
}

function getChannelFromCommand(param, msg, channel, options) {
    var type = options ? options.type : undefined, threshold = options ? options.threshold : undefined;

    if (param) {
        var channel = getChannelFromText(param, channel.guild, threshold, type);
        if (channel) return channel;
        replyMsg(msg, (type ? type.charAt(0).toUpperCase() + type.substring(1) + " " : "") + "Channel \"" + param + "\" was not found on the server.");
        return null;
    }
    else return channel;
}

function getChannelFromText(text, server, threshold, type) {
    var channel = null;
    var mentionMatches = /<#([0-9]+)>/g.exec(text);
    if (mentionMatches) {
        channel = idToChannel(mentionMatches[1], server, type);
        if (channel) return channel;
    }
    channel = idToChannel(text, server, type);
    if (channel) return channel;
    channel = nameToChannel(text, server, threshold);
    return channel;
}

function getRoleFromCommand(param, msg, threshold) {
    if (param) {
        var mentionnedRoles = getRolesMentions(msg);
        if (mentionnedRoles.length > 0) return mentionnedRoles[0];
        else {
            var role = idToRole(param, msg.channel.guild);
            if (role) return role;
            role = nameToRole(param, msg.guild, threshold);
            if (role) return role;
            replyMsg(msg, "Role \"" + param + "\" was not found on the server.");
            return null;
        }
    }
    else return msg.guild.members.get(msg.author.id).roles.random();
}

function getRolesMentions(msg) {
    var mentions = [];
    var matches = msg.content.match(/<@&[0-9]+>/g);
    if (matches) {
        for (var i = 0; i < matches.length; ++i) {
            mentions.push(msg.guild.roles.get(matches[i].substring(3, matches[i].length - 1)));
        }
    }
    return mentions;
}

function nameToChannel(name, server, threshold) {
    var channels = server ? server.channels : bot.channels;
    didYouMean.threshold = threshold ? threshold : null;
    name = didYouMean(name, channels, 'name');
    return channels.find('name', name);
}

function idToChannel(id, server, type) {
    var channels = server ? server.channels : bot.channels;
    if (type) channels = channels.filter(c => c.type === type);
    return channels.get(id);
}

function nameToRole(name, server, threshold) {
    var servers = server ? [server] : bot.guilds;
    didYouMean.threshold = threshold ? threshold : null;

    for (var i = 0; i < servers.length; ++i) {
        name = didYouMean(name, servers[i].roles, 'name');
        if (name) return servers[i].roles.find('name', name);
    }
    return null;
}

function idToRole(id, server) {
    if (server) {
        let role = server.roles.get(id);
        if (role) return role;
    }
    for (const g of bot.guilds.values()) {
        var role = g.roles.get(id);
        if (role) return role;
    }
    return null;
}

function getCurrentTime() {
    return new Date().getTime();
}

function getTaypointsToSpendFromCommand(msg, params, callback, msgCallback) {
    if (params.length === 0) {
        replyMsg(msg, "No taypoints number specified.", { "callback": msgCallback });
        return;
    }
    getByServerAtt(msg.author.id, msg.guild.id, 'taypoints', function (taypoints) {
        if (taypoints > 0) {
            for (var i = 0; i < params.length; ++i) {
                var number = parseInt(params[i]);
                if (!isNaN(number) && number >= 1) {
                    if (number <= taypoints) callback(number, taypoints);
                    else replyMsg(msg, "You can't use `" + number + "` point" + (number > 1 ? "s" : "") + ", you only have `" + taypoints + "`.", { "callback": msgCallback });
                    return;
                }
                else {
                    switch (params[i]) {
                        case 'all': callback(taypoints, taypoints); return;
                        case 'half': callback(Math.ceil(taypoints / 2), taypoints); return;
                        case 'third': callback(Math.ceil(taypoints / 3), taypoints); return;
                        case 'random': callback(getRandomInt(1, taypoints), taypoints); return;
                    }
                }
            }
            replyMsg(msg, "Invalid number of taypoints specified.", { "callback": msgCallback });
            return;
        }
        replyMsg(msg, "You don't have any taypoint to spend.", { "callback": msgCallback });
    });
}

function getValidNumberFromCommand(params, min, max) {
    if (params !== undefined && params.length > 0) {
        for (var i = 0; i < params.length; ++i) {
            var number = parseInt(params[i]);
            if (isValidNumberBetween(number, min, max)) return number;
        }
    }
    return undefined;
}

function isValidNumberBetween(number, min, max) {
    if (isNaN(number)) return false;
    if (number < min) return false;
    if (max && number > max) return false;
    return true;
}

// Returns a random number between min (inclusive) and max (exclusive)
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

// Returns a random integer between min (inclusive) and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a random boolean. Default odds are 50%-50% but can be changed with threshold
function getRandomTrueFalse(threshold) {
    var limit = threshold ? threshold : 0.5;
    return getRandomArbitrary(0, 1) >= limit;
}

// Returns a random element from an array
function getRandomElement(array) {
    return array.length === 1 ? array[0] : array[getRandomInt(0, array.length - 1)];
}

function checkReddit() {
    request('https://www.reddit.com/r/taylorswift/new/.json', function (err, res, body) {
        if (!err) {
            try {
                var data = JSON.parse(body);
                var lastArticle = data.data.children[0].data;
                var usern = "/u/" + lastArticle.author;
                var linkThread = "https://www.reddit.com" + lastArticle.permalink;
                var created = lastArticle.created;
            } catch (e) {
                var text = "Error while checking reddit : ";
                text += res ? "Response status code " + res.statusCode : "No response";
                console.log(text + "\n" + e);
                return;
            }
            if (!linkReddit)
                linkReddit = { "link": linkThread, "time": created };
            else if (linkReddit.link !== linkThread && created >= linkReddit.time) {
                var text = "[**Reddit**] New thread by " + usern + " : " + linkThread;
                sendMsg(bot.guilds.get(config.redditCheckerServerId).channels.get(config.redditCheckerChannelId), text);
                console.log(text);
                linkReddit = { "link": linkThread, "time": created };
            }
        }
        else console.log("Error while checking reddit : " + err);
    });
}

function checkInstagrams() {
    db.each('SELECT `serverId`, `instagramUsername`, `lastLink` FROM instagramChecker;', function (err, row) {
        if (err) { console.log("SQL Error when trying to check instagram:\n" + err); return; }

        var server = idToServer(row.serverId);
        if (!server) { console.log("Server ID not resolved when checking instagram for " + row.serverId); return; }

        request({ 'uri': "https://www.instagram.com/" + row.instagramUsername + "/media", 'headers': { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0' } }, function (err, res, body) {
            try {
                if (err || !res)
                    throw err;
                if (res.statusCode !== 200)
                    throw new Error("Response status code was " + res.statusCode);

                var returnJson = JSON.parse(body);
                if (returnJson.status !== "ok")
                    throw new Error("The returned JSON object status property was not ok (" + returnJson.status + ")");
                if (returnJson.items.length === 0)
                    throw new Error("Items list was empty (user is private or has no posts)");

                var item = returnJson.items[0];
                var link = item.link;
                if (link !== row.lastLink) {
                    var text = "";
                    text += "**[Instagram] New post by " + item.user.full_name + ":**";
                    if (item.caption) text += "\n" + item.caption.text;
                    text += "\n__Posted on:__ " + moment(item.created_time, 'X').format(epochDateFormattingString) + " UTC";
                    text += "\n`" + item.likes.count + "` likes \u2665";
                    if (item.can_view_comments) text += ", `" + item.comments.count + "` comments \uD83D\uDCAC";
                    text += "\n__Link to post:__ <" + link + ">";
                    text += "\n__Link to media:__ " + item.images.standard_resolution.url + "";
                    sendMsg(server.defaultChannel, text);
                    db.run('UPDATE instagramChecker SET `lastLink` = ?;', link);
                }
            } catch (e) {
                console.log("Error when processing for instagram checker for instagram user " + row.instagramUsername + " for server " + server.name + " (" + server.id + "):\n" + e);
            }
        });
    });
}

function checkTumblrs() {
    db.each('SELECT `serverId`, `tumblrId`, `lastLink` FROM tumblrChecker;', function (err, row) {
        if (err) console.log("SQL Error when trying to check tumblr:\n" + err);
        else {
            var server = idToServer(row.serverId);
            if (!server) { console.log("Server ID not resolved when checking tumblrId " + row.tumblrId + " for " + row.serverId); return; }

            request({ 'uri': 'http://' + row.tumblrId + '.tumblr.com/api/read/json', 'headers': { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0' } }, function (err, res, body) {
                try {
                    if (err || !res)
                        throw err;
                    if (res.statusCode !== 200)
                        throw new Error("Response status code was " + res.statusCode);

                    var sub = body.substring(body.indexOf('{'), body.lastIndexOf("}") + 1);
                    var data = JSON.parse(sub);
                    var posts = data.posts;
                    if (posts.length === 0)
                        throw new Error("Posts array was empty (user has no posts)");

                    var link = posts[0].url;
                    if (link !== row.lastLink) {
                        var text = "[**Tumblr**] New " + row.tumblrId + " post: " + link;
                        sendMsg(server.defaultChannel, text);
                        db.run('UPDATE tumblrChecker SET `lastLink` = ?;', link);
                    }
                } catch (e) {
                    console.log("Error when processing for tumblr checker for tumblr user " + row.tumblrId + " for server " + server.name + " (" + server.id + "):\n" + e);
                }
            });
        }
    });
}

function checkYoutube() {
    request('https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=' + config.youtubeCheckerPlaylistId + '&key=' + config.googleAPIKey, function (err, res, body) {
        if (!err) {
            try {
                var link = 'https://youtu.be/' + JSON.parse(body).items[0].contentDetails.videoId;
            }
            catch (e) {
                var text = "Error while checking youtube : ";
                text += res ? "Response status code " + res.statusCode : "No response";
                console.log(text + "\n" + e);
                return;
            }
            if (!lastLinkYoutube) lastLinkYoutube = link;
            else if (link !== lastLinkYoutube) {
                var text = "[**Youtube**] New Taylor post: " + link;
                sendMsg(bot.guilds.get(config.youtubeCheckerServerId).channels.get(config.youtubeCheckerChannelId), text);
                console.log(text);
            }
            lastLinkYoutube = link;
        }
        else console.log("Error while checking youtube : " + err);
    });
}

function checkReminders() {
    db.each("SELECT `id`, `remindme`, `remindmetext` FROM user WHERE `remindme` NOT NULL AND `remindmetext` NOT NULL;", function (err, row) {
        if (!err) {
            if (row.remindme - getCurrentTime() < 0) {
                const userToRemind = idToUser(row.id);
                if (userToRemind) {
                    sendMsg(userToRemind, `Reminding you "${row.remindmetext}"`);
                    console.log("Reminded " + row.id + " about " + row.remindmetext);
                }
                db.run("UPDATE user SET remindme = NULL, remindmetext = NULL WHERE id = ?;", row.id);
            }
        }
        else console.log("SQL error while checking remind me of " + row.id + " : " + err);
    });
}

function isValidImageURL(uri, callback) {
    request.head(uri, function (err, res, body) {
        if (res && (res.headers['content-type'] == 'image/jpeg' || res.headers['content-type'] == 'image/png' || res.headers['content-type'] == 'image/gif'))
            callback(true);
        else
            callback(false);
    });
};

function isMod(server, user, callback) {
    getUserTitle(user, server, function (userTitle) {
        callback(userTitle >= Title.MODERATOR);
    });
}

function getActiveUsers(serverId, callback) {
    var ids = [];
    db.each("SELECT `id` FROM userByServer WHERE `lastSpoke` > ? AND `serverId` = ?;", [getCurrentTime() - 600000, serverId], function (err, row) {
        if (!err) {
            var user = idToUser(row.id);
            if (user && user.status === 'online' && !user.bot) {
                ids.push(row.id);
            }
        }
    }, function (err, retrieved) {
        if (err) console.log("SQL Error while trying to get active users for server " + serverId + ":\n" + err);
        else callback(ids);
    });
}

function getNbActiveUsers(serverId, callback) {
    var count = 0;
    db.each("SELECT `id` FROM userByServer WHERE `lastSpoke` > ? AND `serverId` = ?;", [getCurrentTime() - 600000, serverId], function (err, row) {
        if (!err) {
            var user = idToUser(row.id);
            if (user && user.status === 'online' && !user.bot) {
                count++;
            }
        }
    }, function (err, retrieved) {
        if (err)
            console.log("SQL Error while trying to get number of active users.\n" + err);
        else
            callback(count);
    });
}

function getHeistingUsers(callback) {
    var usersHeist = [];
    db.each("SELECT `id`, `heist` FROM user WHERE `heist` > 0;", function (err, row) {
        if (err) {
            console.log("SQL Error while trying to get heisting users.\n" + err);
            return;
        }
        var obj = { "id": row.id, "gamble": row.heist };
        usersHeist.push(obj);
    },
        function (err, changes) {
            callback(usersHeist);
        });
}

function getSpecialChannels(type, server, callback) {
    var table = type + "Channel", column = type + 'Of';
    var text = "**Channels considered as " + type + " channels by TaylorBot on this server:**";
    db.each('SELECT `id` FROM ' + table + ' WHERE `' + column + '` = ?;', server.id, function (err, row) {
        if (!err) {
            var channel = idToChannel(row.id);
            if (channel) text += "\n\t#" + cleanFormatting(channel.name) + " (`" + channel.id + "`)";
        }
    }, function (retrieved) {
        if (text.charAt(text.length - 1) === '*')
            text = "`There is no channel considered as " + type + " channel by TaylorBot on this server.`";
        callback(text);
    });
}

function setSpecialChannel(type, channel, callback) {
    var table = type + "Channel", column = type + "Of";
    db.run('INSERT INTO ' + table + ' (`id`, `' + column + '`) VALUES (?, ?);', [channel.id, channel.guild.id], function (err) {
        if (err) {
            callback("There was an error when trying to set " + channel.name + " as a " + type + " channel for this server. \uD83D\uDE26 This most likely means it is already set as one.");
            console.log("SQL Error when trying to set " + channel.name + " (" + channel.id + ") as a " + type + " channel for server " + channel.guild.name + " (" + channel.guild.id + "):\n" + err);
        }
        else {
            callback(channel.name + " was successfully set as a " + type + " channel for this server. \uD83D\uDE04");
            console.log(channel.name + " (" + channel.id + ") was set as a " + type + " channel for server " + channel.guild.name + " (" + channel.guild.id + ")");
        }
    });
}

function getSpecialRoles(type, server, callback) {
    var table = type + "Role", column = type + 'Of';
    var text = "**Roles considered as " + type + " role by TaylorBot on this server:**";
    db.each('SELECT `id` FROM ' + table + ' WHERE `' + column + '` = ?;', server.id, function (err, row) {
        if (!err) {
            var role = idToRole(row.id, server);
            if (role) text += "\n\t" + cleanFormatting(role.name) + " [" + role.colorAsHex() + "] (`" + role.id + "`)";
        }
    },
        function (retrieved) {
            if (text.charAt(text.length - 1) === '*')
                text = "`There is no role considered as " + type + " role by TaylorBot on this server.`";
            callback(text);
        });
}

function ResolveHeist(usersHeist, channel) {
    var text = "The heist begins! The crew gets their equipment ready and enters the ";

    for (var i = 0; i < usersHeist.length; ++i) {
        setGlobalAtt(usersHeist[i].id, "heist", 0);
    }

    getNbActiveUsers(function (usersCount) {
        var heistingFrac = usersHeist.length / usersCount;
        var heistingPerc = heistingFrac * 100;
        var rollMargin = 5;
        var lowLim = 35;
        var highLim = 66;
        var min = heistingPerc - rollMargin;
        if (min < lowLim) min = lowLim; else if (min > highLim) min = highLim;
        var max = heistingPerc + rollMargin;
        if (max > highLim) max = highLim; else if (max < lowLim) max = lowLim;
        var successRate = getRandomArbitrary(min, max);

        var bankIndex = Math.round((successRate - lowLim) / (highLim - lowLim) * (banks.length - 1));
        text += "**" + banks[bankIndex].name + "**.\n\n";

        var successRoll = getRandomArbitrary(0, 100);

        console.log("Participants: " + heistingPerc.toFixed(2) + "%, bank: " + banks[bankIndex].name + ", roll to win: " + successRate.toFixed(1) +
            " (" + min.toFixed(1) + "/" + max.toFixed(1) + "), roll: " + successRoll.toFixed(1));

        var gains = "\n\nGains: ";
        var dead = "\nUnfortunately, ";
        if (successRoll > successRate) {
            var alldead = true;
            for (var i = 0; i < usersHeist.length; i++) {
                if (getRandomTrueFalse(0.85)) {
                    dead += "<@" + usersHeist[i].id + "> didn't make it because they " + getRandomElement(deadReasons) + ".\n";
                    addToServerNum(usersHeist[i].id, channel.guild.id, "heistprofits", -1 * usersHeist[i].gamble);
                }
                else {
                    alldead = false;
                    var pointsWon = Math.round(usersHeist[i].gamble * banks[bankIndex].multiplier);
                    addTaypoints(usersHeist[i].id, channel.guild.id, pointsWon);
                    addToServerNum(usersHeist[i].id, channel.guild.id, "heistprofits", pointsWon - usersHeist[i].gamble);
                    addToServerNum(usersHeist[i].id, channel.guild.id, "heistwins", 1);

                    gains += "<@" + usersHeist[i].id + "> (+" + pointsWon + ") ";
                }
            }
            if (!alldead) text += "*The heist was a success!*";
            if (dead !== "\nUnfortunately, ") text += dead;
            if (gains !== "\n\nGains: ") text += gains;
        }
        else {
            var randomUser = getRandomElement(usersHeist);
            text += "Cops busted the crew because <@" + randomUser.id + "> " + getRandomElement(bustedReasons) + ".\n\nEverybody lost their taypoints!";
            addToServerNum(randomUser.id, channel.guild.id, "heistruined", 1);
            for (var i = 0; i < usersHeist.length; ++i) {
                addToServerNum(usersHeist[i].id, channel.guild.id, "heistprofits", -1 * usersHeist[i].gamble);
            }
        }

        sendMsg(channel, text);
        heistInProgress = false;
    });
}

function init() {
    console.log('Initializing...');
    bot.guilds.forEach(g => {
        g.members.forEach(m => {
            var user = m.user;
            db.get('SELECT * FROM userByServer WHERE `id` = ? AND `serverId` = ?', [user.id, g.id], function (err, row) {
                if (err) console.log(`SQL Error when trying to check existence of ${user.username} (${user.id}) for server ${g.name} (${g.id}):\n${err}`);
                else if (!row) {
                    console.log(`${user.username} (${user.id}) for server ${g.name} (${g.id}) did not exist in the userByServer table! Attempting to add.`);
                    addNewUser(user, g);
                }
            });
        });
    });

    var initTime = getCurrentTime();
    bot.users.forEach(user => {
        db.get('SELECT `username` FROM usernames WHERE `userId` = ? GROUP BY `userId`;', user.id, function (err, row) {
            if (!err) {
                if (!row) {
                    console.log(`${user.username} (${user.id} does not have a latest username. Attempting to add.`);
                    addNewUsername(user, initTime);
                }
                else if (row.username !== user.username) {
                    console.log(`${user.username} (${user.id}'s latest username was different. Attempting to add.`);
                    addNewUsername(user, initTime);
                }
            }
            else console.log(`Error when checking latest username for ${user.username} (${user.id}):\n${err}`);
        });

        db.get('SELECT `id` FROM user WHERE `id` = ?;', user.id, function (err, row) {
            if (err) console.log(`SQL Error when checking if ${user.username} (${user.id}) was in the user table:\n${err}`);
            else if (!row) {
                console.log(`${user.username} (${user.id}) did not exist in the user table! Attempting to add.`);
                addNewUser(user);
            }
        });
    });

    db.each("SELECT `id`, `prefix` FROM server;", function (err, row) {
        if (err) console.log(`SQL Error while trying to init servers:\n${err}`);
        else {
            serversInfo[row.id] = { "prefix": row.prefix };
        }
    }, function (err) {
        prefixesInit = true;
    });
}

function startIntervals() {
    checkerInterval = setInterval(function () {
        checkReddit();
        checkInstagrams();
        checkTumblrs();
        checkYoutube();
        checkReminders();
    }, 45000);

    onlineInterval = setInterval(() => {
        var minutesToAdd = 1, pointsToAddForMinute = 1, nbMinutesForReward = 8;
        db.run("UPDATE userByServer SET `minutes` = `minutes`+? WHERE `lastSpoke` > ?;", [minutesToAdd, getCurrentTime() - 600000], function (err) {
            if (err) console.log("SQL Error when trying to add 1 minute to all active users:\n" + err);
            else {
                db.run("UPDATE userByServer SET `minutesMilestone` = (`minutes`-(`minutes`%?)), `taypoints`=`taypoints`+? WHERE `minutes` >= `minutesMilestone`+?;", [nbMinutesForReward, pointsToAddForMinute, nbMinutesForReward], function (err) {
                    if (err) console.log(err);
                });
            }
        });
    }, 60000);
}

function stopIntervals() {
    clearInterval(checkerInterval);
    clearInterval(onlineInterval);
}

function logIn() {
    setTimeout(() => {
        bot.login(config.loginToken).then(() => {
            console.log("Bot logged in successfully!");
        }).catch(err => {
            console.log("Error while attempting to log in:\n" + err);
            process.exit(1);
        });
    }, 6000);
}

function replyMsg(msg, text, options) {
    if (msg.channel.type !== 'dm') text = msg.author.toString() + " " + text;
    sendMsg(msg.channel, text, options);
}

function sendMsg(recipient, text, options) {
    var format = options ? options.format : undefined, callback = options ? options.callback : undefined;
    text = text.replace(/(@)(everyone|here)/g, function (match, p1, p2) { return p1 + "\u200B" + p2; });
    var textEvalLenght = text.length + (format ? format.after.length + format.before.length : 0);
    var firstPart = text;
    var currentCallback;
    if (textEvalLenght >= 2000) {
        var adder = 1;
        var max = format ? 2000 - format.after.length - format.before.length : 2000;
        firstPart = firstPart.substring(0, max);
        var lastIndex = firstPart.lastIndexOf("\n");
        if (lastIndex === -1) lastIndex = firstPart.lastIndexOf(".");
        if (lastIndex === -1) lastIndex = firstPart.lastIndexOf(" ");
        if (lastIndex === -1) { lastIndex = max; adder = 0; }
        firstPart = text.substring(0, lastIndex);
        var lastPart = text.substring(lastIndex + adder);
        currentCallback = msg => {
            sendMsg(recipient, lastPart, options);
        };
    }
    else {
        currentCallback = msg => {
            if (callback) callback(null, msg);
        };
    }
    if (format) firstPart = format.before + firstPart + format.after;
    recipient.sendMessage(firstPart, options)
        .then(currentCallback)
        .catch(e => {
            console.log(`Sending message error in recipient:${recipient.id} : ${e}`);
            if (callback) callback(`${e} when trying to send message.`);
        });
}

function getIndexWithAttr(array, attr, value) {
    for (var i = 0; i < array.length; ++i) {
        if (array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}


logIn();

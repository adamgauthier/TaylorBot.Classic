# TaylorBot.Classic Release Notes

In the early days of TaylorBot, updates were frequent and unpredictable. At some point, I decided to post release notes whenever significant changes were deployed. These notes were mostly meant for the r/TaylorSwift server, the single community TaylorBot operated in for a while. As a result, they contain references to specific users, are not always exhaustive and their format isn't super consistent. Nonetheless, they are interesting to read as they bring back memories of when specific features were added/removed.

The list abruptly stops at 0.10, which I believe is when I started rewriting the project. Updates were still frequently made but not communicated through proper release notes.

## Unnamed version - 2015/12/07

TaylorBot now counts the number of minutes you're online on the server. Minutes can be viewed for a specific user using !minutes, or as a ranking using !rankminutes.

You can now use TaylorBot to set your age and gender (!setage 22, !setgender Female) as per some users request @13. It can also be viewed for any user (works in a similar way to !favorite or !country). If you have any ideas feel free to share with me, luna or historicc. Thanks for using TaylorBot!


## Unnamed version - 2015/12/08

TaylorBot has lost the following commands : !country, !age and !gender. They can now be seen in a nice info card with the command !info (Thank @Historicc for the great idea). Don't worry, everything you have set has been saved and can still be changed with !setcountry, !setage and !setgender. Thank you for using TaylorBot!


## 0.1 - 2015/12/15

Changes:

- Major change to the way the database is saved behind the scenes. This shouldn't change anything from a user's point of view, but will allow faster performance and the implementation of future features.
- Age minimum has been changed to 13 (was 6).
- Users can no longer use the '~' character when setting an information.
- Reduced the chance Enchanted13 has of passing his finals.


## 0.2 - 2015/12/16

Changes:

- Added a new command to search **Taylor youtube videos**! Try it yourself! Use !yt [search word] to see the related Taylor youtube video. (command still in beta and suggestions are welcomed :) )
- Fixed a bug where a reddit post would be posted in chat again when the last post on the subreddit would get deleted (finally!). This will now only happen if mods delete 3 reddit posts in a row.
- Added auto-detection of Facebook posts, considering sometimes things are posted there that are not posted elsewhere.
- Added auto-detection of Youtube posts.
- Minor changes/improvements to the detection of new posts.
- Added admin commands to make the database easier to edit from discord.
- Updated !help to show new commands.


## 0.3 - 2015/12/22

First of all, I'd like to apologize to everyone for TaylorBot being down on the 21th. Thanks to @Historicc, it is fixed now! Every new user from that day didn't get their messages up when posting a message, sorry for the inconvenience.

Changes:

- Added a new command to upload **Pictures to Imgur**! Try it yourself! Use !imgur <image link> to upload an image from another source to imgur. (Useful for shortening !save links)
- Added a new commands to see basic stats of the discord server. Use !genderstats for example to see stats about people's gender. (same can be done with !agestats)
- Age, rps wins, messages and minutes is now stored as integers instead of strings. (maybe what caused the crash on the 21th.)
- Removed bots from !rankminutes as requested multiple times.
- Added commands useful for mods.
- Updated !help to show new commands.


## 0.4 - 2015/12/24

Changes:

- **TaylorBot will now answer you** with basic stuff. If you ever feel lonely, just talk to her, she might be slow to answer depending on what you ask, so go easy on her. As with all things, don't abuse this feature unless you're in #spamming. (example: @TaylorBot hi) She has sometimes a weird humor, but I don't have control over what she says, so yeah.
- A new command to see in **what position someone joined the server** has been added. Use !joined <username> to view that information. Sometimes it might be inaccurate for old users but should be accurate for new ones.
- Minutes online have been reset. To have your minute counter increased, you must now have sent a message in any channel in the last 10 minutes. Old minutes can be viewed using !oldminutes.
- All commands that can be used with a username now work with usernames containing spaces. (!info Red Bot).
- All commands that can be used with a username now work regardless of lower or upper case. (!info red bot).
- Fixed a bug where !rankmessages with anything higher than 63 would not work. The ranking won't display more than 60 people now.
- Users that change username now have their usernames updated in the database when sending a message in chat. (this can still be done by a mod using !updatenames).
- Database cleaned a little and general improvements to performance.
- Added useless !code command.
- Updated !help to show new commands.


## 0.5 - 2015/12/29

Changes:

- **New weather command added**. Just use !weather <your city> to get a quick summary of the current weather there. Adding 'c' at the end will convert the units to celsius (ex: !weather Nashville c)
- **You can now set your steam id**. Just use !setsteam <your id> and !liststeam to see all ids. (requested by @Serpent10i)
- **Added a creepy counter for @Roswell_Ross** Anybody can view the count using !creepy @Roswell_Ross and mods can change it using !creepy++ or !creepy--.
- !joined command got updated to be 100% accurate, it also now shows the date AND hour when you joined! (e.g. !joined @Serpent10i)
- !imgur now won't re-upload an image already on imgur.
- Fixed a bug where people could play rock paper scissors without using !playrps
- Added !setinfo to set age, gender and country in one line. Use it like: !setinfo 18,M,Canada (as requested by @iandrewc).
- Added !ytn to search youtube videos not taylor-related, as requested by @iandrewc.
- Changed !updatenames to !obsolete since names are now auto-updated.
- Updated !help to show new commands.


## 0.6 - 2016/01/20

Changes:

- **TayPoints are officially introduced!** You have already accumulated taypoints from the minutes, messages and rps wins you had before. You can see the taypoints ranking using !ranktaypoints or !rankpoints.
You can see taypoints of a single user using !taypoints or !points. You can gift some of your taypoints to other users using the !give or !gift command. (ie !gift 22 @Murray). Mods can reward points to users if something cool happens (ie !rewardall 10).
You can win *guaranteed* points with Rock Paper Scissors (!playrps, as demonstrated by @Serpent10i, @Historicc and @teiu77). You can also gamble on getting points by gambling (!gamble 50 or !supergamble 50)
or by getting lucky rolling 13, 15 or 1989 (!roll <max number>). If you want to next-level gamble, you can participate in group gambles, aka "**heists**". Just launch a heist (ie !heist 50) and have other people join you!
But don't gamble away all your points, you might regret it! There is a small cooldown on those features to prevent abuse.
Of course the most reliable way to win taypoints will always be to **be active**. Messages, minutes and words all net you points.
- You can now ask the bot to remind you of something in the future. Use it like this: !remindme 2 minutes "blade is a dick".
- Heists results are stored under !heistswins, !heistsruined and !heistprofits.
- You can now set your timezone and see people's current time. As many of you noticed, you can set your timezone with !settime EST or !settime -5. Current time of a user will be shown with the !info command.
- TaylorBot now corrects spelling mistakes in usernames. (ie !info encchanteeedkuna <- will return @EnchantedLuna's info).
- !joined now checks if the inspected user has set their timezone. If they did, the time at which they joined will be converted to their timezone.
- Added "!pmsteam" command to make taylorbot send you in a private message the list with clickable links.
- Added !created command which shows the exact time the server was created by EnchantedLuna.
- When a message is deleted, it will be removed from the user's messages count.
- Fixed bug where !imgur would return youtube.com/undefined on large files.
- TaylorBot will now have a different conversation with everyone and won't answer with ads.
- Minor improvements to make the new !setinfo command work better.
- Removed !creepy counter.
- Minor behind the scenes improvements.
- Updated !help to show new commands.


## 0.7 - 2016/02/18

Changes:

- Added !stats command to show simple stats about a user: messages, minutes, taypoints, last seen and last spoke. (usage: !stats tayfan22)
- Added !usernames command to see the history of someone's past usernames. (usage: !usernames MarialovesTS)
- Added !image to search a picture of taylor on google images. (usage: !image with selena) (can also be used !imagen for non-taylor results like !ytn)
- Added !wolfram command that connects to Wolfram Alpha to provide answers to bunch of stuff. (ie !wolfram 2+2, !wolfram convert 2 liters to gallons, !wolfram when are the grammys, etc.)
- Added !urban command to look up a word on urbandictionnary. Use it like this: !urban dank meme
- Changed the way the !weather command used to work. You can now see the weather where someone lives. (ie: !weather serpent10i) You can still type location names directly, but if they are too close to a username, it might pick up that user instead.
- You can now set your temperature unit preference to ensure you always get the one you want when using !weather. (ie: !setunit C/F/K).
- Changed the rock paper scissors command. It's now a single line command used like: !rps rock/paper/scissors.
- Changed the way that taypoints are awarded to users for being active to prevent an important exploit.
- More taypoints are now awarded to users for being active.
- Added !servericon AKA !serveravatar command to show the icon of the server, a little like !avatar.
- Added snapchat, tumblr and lastfm usernames for you to set. You can always get a list using !listsnapchat for example.
- Changed the "country" info element to "location". Your previous info was saved and you can set it using !setlocation now.
- Huge change on how the bot stores data. This shouldn't affect the regular user's experience except that you can know put special characters in your baes, favorite songs, etc.
- Added !mr command used to send mr.enchanted copypasta to someone in chat. (ie !mr Donran)
- Minor changes and improvements to how taylorbot checks for new posts on various websites.
- Fixed !remindme command.


## 0.8 - 2016/04/28

Changes:

- Added !wiki command to get a small summary of an article on wikipedia, with a link to it. (`!wiki Speak Now`) (you can add |long to that command to get a longer summary, if available)
- Added !movie and !actor commands to get basic info from imdb. (usage: `!movie deadpool`, `!actor Brad Pitt`) (the response can be a little slow sometimes)
- Added !sub command to get a basic info and a link to a subreddit if it exists. (usage: `!sub music`)
- Added !dupes command to find people with the same name on the server and show their ID and Discrim to differentiate them.
- Added !clear command to clear one of the things you have set (age, location, snapchat, etc.) usage: `!clear tumblr`
- Added !hardmentions to get a list of usernames that contain weird characters/emojis hard to mention.
- Added `!serverinfo`, `!channelinfo`, `!userinfo` and `!roleinfo`. Keep in mind these commands are mainly meant for bot devs to get quick info, so some values might be obscure to some. :)
- Added `!rolecolor` used to find roles that are similar to a color. usage: `!rolecolor blue`. it will show all the colors that are more than 70% similar. you can change that minimum by adding `|50`, `|60`, etc to the command
- Added `!poll` command to be enabled when Red Bot goes down. You can show the poll without scrolling up or closing it with `!poll show`. Mods can enable and disable through `!enable poll` and `!disable poll`.
- All !rank, !list and !clear commands can now be used with a space (`!rank minutes` instead of `!rankminutes`), the old way still works.
- !servericon was removed, you can still do !serverinfo for a more complete summary, with icon.
- You can now add a parameter to the !rank command. `!rank points |desc` to get results in the reverse order.
- You can now add parameters to the !image or !imagen command. `!image grammys |recent` to get results from the past week. `!imagen dancing rabbit |gif` to get gifs (some gifs are non-animated).
- You can now add a parameter to the !urban command to get another result. `!urban lol` will always return the most upvoted result on urbandictionnary, but if you want the second one, just do `!urban lol |2`.
- Small rework to the !rps command with emojis :).
- !remindme's syntax has changed a little, to allow the use of quotes in your text and for better code in general. (old : `!remindme 1 day "i love taylor swift"`, new : `!remindme 1 day | i love taylor swift`)
- Added `!setprefix` command to change the prefix of TaylorBot for this server.
- Added `!modroles` and `!setmodrole` for command restrictions.
- Synced clock correctly to prevent inaccuracies in time.
- Minor improvements to the way taylorbot checks new tumblr and youtube posts.


## 0.9 - 2016/08/24

Changes:

- Joined dates have been fixed when using !joined command. The ranking will always be right and these dates won't be reset when leaving the server. Joined dates in !userinfo will always be the latest joined date and joined dates in !joined will always be the first joined date. Since they used to reset, you can appeal to change your joined date if you left previously.
- Fixes to commands parameters.
- !remindme command now uses ';' character to separate time and message (used to be '|').
- You can now `!gamble all` to gamble all your points. You can also use `half` or even `random`.
- Heists have been temporarily removed.
- Taybot is now using a new cooldown system. It will only listen to your command if it has answered to you. This should remove the spamming problem with rolls.
- `!give` has been changed a little bit. Previously, if you did !give @Enchanted13#4228 @NeonzHD#1540 13, it would give each user 13 points from your points. Now, it will divide the number of points to each user. So in that case, it would give 7 points to neon and 6 points to me. You can also !give all or !give half.
- Minor improvements and fixes.


## 0.10 - 2016/09/11

__Changes:__

- The bot as a whole has been adjusted entirely to work with newer standards of the library. What does this mean for you? Nothing you will notice for now, but this was inevitable and will help TaylorBot going forward.
- Timezones have been revamped so that !time/!timezone command actually shows the timezone name and the time. Now, TaylorBot will remember your timezone instead of just what time offset it was to UTC. This means that people who already had their timezone set have had their timezone changed to the new system, but there is a good chance your new timezone name doesn't represent your actual timezone. You change set it again by doing `!settimezone edt`, but your time offset should be good anyway.
- Added new command "charinfo", which returns a link to basic information of a character specified. Example: `!charinfo ]`
- Added new command "knowyourmeme", this was originally supposed to be a meme urban dictionary, but turns out that knowyourmeme didn't really like having bots on their site, so TaylorBot got banned. :/ Still decided the keep the command. Usage: `!kym` (returns random meme) `!kym nene` (return know your meme search link for "nene")
- The image and yt command have changed. No need to add an "n" to get non-taylor stuff anymore. This is because the "n" version of those commands was dramatically more used than the non "n" version. You can still use imagen and ytn, but now image and yt do the same. For taylor stuff, you can now use "imaget and ytt".
- The image search cap is still at 100. However, if the limit is reached, have @iandrewc or @emerald mention me and I will put it higher for the day. This is only possible thanks to their donations, don't spam them!
- Fixed a bug where !rps command would only give you rocks. (Thanks to @Mysae)
- Minor improvements and fixes.

__Known Bugs for this version:__

- Wiki command is not working.
- Wolfram command is not working.
- Bot is unable to find users by usernames. (Use a mention or the discrim: !avatar #9290)

I apologize for any incovenience this might cause.

The architecture of the bot will be completely rewritten. This is a very long process but it is very worth it in the end.


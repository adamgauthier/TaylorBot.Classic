"use strict";

function Poll(author, channel) {
    this.active = true;
    this.endTime = 0;
    this.options = [];
    this.creator = author;
    this.channel = channel;
    this.votes = [];
    var that = this;

    this.generateCloseText = function () {
        return "\n**The poll was closed! Results:**\n" + that.generatePollText();
    }

    this.generatePollText = function () {
        if (that.votes.length > 0) {
            var returnText = "";
            for (var i = 0, len = that.options.length; i < len; ++i) {
                returnText += that.options[i].name + " : " + that.options[i].votes + " vote";
                if (that.options[i].votes > 1) returnText += "s";
                returnText += " (" + Math.round(that.options[i].votes / that.votes.length * 100) + "%)\n";
            }
            return returnText;
        }
        else return "No vote placed for this poll. \uD83D\uDE15";
    }
}

Poll.prototype.setOptions = function (newOptions) {
    newOptions = newOptions.filter(function (e) { return e.trim() !== "" });
    if (newOptions.length > 1) {
        for (var i = 0, len = newOptions.length; i < len; ++i) {
            this.options.push({ "name": newOptions[i].trim(), "votes": 0 });
        }
        return true;
    }
    this.active = false;
    return false;
}

Poll.prototype.startPoll = function () {
    this.active = true;
    var returnText = "A poll has been started by " + this.creator.toString() + ", please enter a number to vote:";
    for (var j = 0, len2 = this.options.length; j < len2; ++j) {
        returnText += "\n" + (j + 1) + ": " + this.options[j].name;
    }
    this.endTime = new Date().getTime() + 120000;
    return returnText;
}

Poll.prototype.closePoll = function (closerId, isMod) {
    if (closerId === this.creator.id || isMod) {
        this.active = false;
        return this.generateCloseText();
    }
    else {
        var now = new Date().getTime();
        if (now > this.endTime) {
            this.active = false;
            return this.generateCloseText();
        }
        var secondsLeft = Math.round(((this.endTime - now) / 1000));
        var returnText = "This poll can only be closed by " + this.creator.toString() + ", mods or anyone in " + secondsLeft + " second";
        if (secondsLeft > 1) returnText += "s";
        returnText += ".";
        return returnText;
    }
}

Poll.prototype.showPoll = function () {
    return "**Ongoing poll results:**\n" + this.generatePollText();
}

Poll.prototype.vote = function (number, voterId) {
    number--;
    if (this.votes.indexOf(voterId) === -1 && number < this.options.length) {
        this.options[number].votes++;
        this.votes.push(voterId);
    }
}

module.exports = Poll;

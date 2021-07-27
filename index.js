const config = require('./config.json');
const fs = require('fs');
let Parser = require('rss-parser');
let parser = new Parser();
const Discord = require('discord.js');
const client = new Discord.Client();

let previousVidId;

fs.open("previousVidId.json", 'r', function (err, fd) {
    if (err) {
        fs.writeFile("previousVidId.json", '[]', function (err) {
            if (err) {
                console.log(err);
            };
            console.log("File previousVidId.json didn't exist so was created");
        });
    } else {
        console.log("File previousVidId.json already exists so was not created");
    };
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    previousVidId = require('./previousVidId.json');
    console.log(`First check for new vid will be done in ${config.newVidCheckIntervalInMinutes} minute(s)`);
    setInterval(function () {

        console.log("Checking for new vid...");
        parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${config.ytChannelId}`)
            .then(vidsJson => {

                if (vidsJson.items[0].id != previousVidId[0]) {
                    console.log("The is a new vid");

                    let notifMsg = config.notifMsg;
                    notifMsg = notifMsg.replace("{author}", vidsJson.items[0].author);
                    notifMsg = notifMsg.replace("{url}", vidsJson.items[0].link);
                    console.log(`Constructed message:\n\t${notifMsg.replace("\n", "\n\t")}\nFrom:\n\t${config.notifMsg.replace("\n", "\n\t")}`);
                    try {
                        client.channels.cache.get(config.notifsChannelId).send(notifMsg);
                    } catch (err) {
                        console.log("Failed to send Youtube notification message!\n" + err);
                    };

                    previousVidId[0] = vidsJson.items[0].id;
                    fs.writeFile('./previousVidId.json', JSON.stringify(previousVidId), 'utf8', function (err) {
                        if (err) return console.log(err);
                    });

                } else {
                    console.log("The is no new vid");
                };

            })
            .catch(err => {
                console.log(`Failed to collect or parse data from https://www.youtube.com/feeds/videos.xml?channel_id=${config.ytChannelId}\n${err}`);    
            });

    }, config.newVidCheckIntervalInMinutes * 60000);
});

client.login(config.botToken);
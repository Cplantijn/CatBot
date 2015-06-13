var http = require('http');
var server = http.createServer();
var port = process.env.PORT || 3000;
var Slack = require('slack-client');
var Request = require('request');
var parseXML = require('xml2js').parseString;

//Substitute your own API Key here
var myAPIKey = process.env.API_KEY;
var token = myAPIKey;

var slack = new Slack(token, true, true);

var makeMention = function(userId){
    return '<@' + userId + '>';
};

var isDirect = function(userId, messageText){
    var userTag = makeMention(userId);
    return messageText &&
           messageText.length >= userTag.length &&
           messageText.substr(0, userTag.length) === userTag;
};

slack.on('open', function () {
    var channels = Object.keys(slack.channels)
        .map(function (k) { return slack.channels[k]; })
        .filter(function (c) { return c.is_member; })
        .map(function (c) { return c.name; });

    var groups = Object.keys(slack.groups)
        .map(function (k) { return slack.groups[k]; })
        .filter(function (g) { return g.is_open && !g.is_archived; })
        .map(function (g) { return g.name; });


    if (channels.length > 0) {
        console.log('You are in: ' + channels.join(', '));
    }
    else {
        console.log('You are not in any channels.');
    }

    if (groups.length > 0) {
       console.log('As well as: ' + groups.join(', '));
    }
});

slack.on('message', function(message) {
    var channel = slack.getChannelGroupOrDMByID(message.channel);
    var user = slack.getUserByID(message.user);

    if (message.type === 'message' && isDirect(slack.self.id, message.text)) {
        var trimmedMessage = message.text.substr(makeMention(slack.self.id).length + 1).trim().toLowerCase();

        if(trimmedMessage.length){
            if(trimmedMessage.indexOf('give me a kitteh') > -1){
                Request.get({url:'http://thecatapi.com/api/images/get?format=xml&results_per_page=1&type=jpg&size=med'}, function(e, r, img){
                    parseXML(img, function(err, result){
                        channel.send(result.response.data[0].images[0].image[0].url[0]);
                    })
                });
            }else{
                channel.send('If you\'d like a picture, mention me and say "Give me a kitteh!"');
            }
        }else{
            channel.send('If you\'d like a picture, mention me and say "Give me a kitteh!"');
        }

    }


});
server.listen(port);
slack.login();

//Ping itself to keep the app awake every 10 minutes
setInterval(function() {
    http.get('http://'+ process.env.APP_NAME +'.herokuapp.com');
}, 600000);

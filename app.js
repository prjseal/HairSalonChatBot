var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
}); 

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MY_APP_ID,
    appPassword: process.env.MY_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.matches(/^make/i, [
    function (session) {
        session.beginDialog('/who');
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/name');
        } else {
            next();
        }
    },
    function (session, args, next) {
        if (!session.userData.phone) {
            session.beginDialog('/phone');
        } else {
            next();
        }
    },
    function (session, args, next) {
        if (!session.userData.email) {
            session.beginDialog('/email');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send("Hi %s", session.userData.name);
        session.beginDialog('/action');
    }
]);

bot.dialog('/name', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/phone', [
    function (session) {
        builder.Prompts.text(session, 'What is your phone number?');
    },
    function (session, results) {
        session.userData.phone = results.response;
        session.endDialog();
    }
]);

bot.dialog('/email', [
    function (session) {
        builder.Prompts.text(session, 'What is your email address?');
    },
    function (session, results) {
        session.userData.email = results.response;
        session.endDialog();
    }
]);

bot.dialog('/who', [
    function (session) {
        builder.Prompts.choice(session, "Who would you like your appointment with?", "Marie|Kristy|Nikki");
    },
    function (session, results) {
        session.userData.who = results.response.entity;
        builder.Prompts.choice(session, "Which day is best for you?", "Tuesday|Wednesday|Thursday|Friday|Saturday");
    },
    function (session, results) {
        session.userData.day = results.response.entity;
        builder.Prompts.choice(session, "What time of day would you prefer?", "10am to 12pm|12pm to 3pm|3pm to 5pm");
    },
    function (session, results) {
        session.userData.time = results.response.entity;
        session.send('Ok %s, I will try and book you in with %s on a %s at around %s', session.userData.name, session.userData.who, session.userData.day, session.userData.time);
        session.send('We will be in touch to confirm');

    // var data = '{"text": "This is a line of text.\nAnd this is another one."}';
    //var json_obj = JSON.parse(data);
    request.post({
            headers: {'content-type':'application/json'},
            url:process.env.SLACK_WEBHOOK_URL,
            form:    '{"text": "Chat enquiry\nName: ' + session.userData.name + '\nWould like an appointment with ' + session.userData.who + ' on a ' + session.userData.day + ' at around ' + session.userData.time + '\nEmail: ' + session.userData.email + '\nPhone: ' + session.userData.phone + '"}'
        },function(error, response, body){
        console.log(body)
    });


        session.endDialog();
    }
]);

bot.dialog('/action', [
    function (session) {
        builder.Prompts.choice(session, "What would you like to do?", "Book appointment|Send a message");
    },
    function (session, results) {
        session.userData.action = results.response.entity;
        if(results.response.entity === "Book appointment")
        {
            session.beginDialog('/who')
        }
        else
        {
            session.endDialog();
        }        
    }
]);
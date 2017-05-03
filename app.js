var builder = require('botbuilder');
var restify = require('restify');

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
    },
    function(session)
    {
        session.send('Ok %s I will book you in with %s', session.userData.name, session.userData.who)
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
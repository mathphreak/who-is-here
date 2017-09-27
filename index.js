const exec = require('child_process').exec;
const express = require('express');
const bodyParser = require('body-parser');
const GithubWebHook = require('express-github-webhook');
const getWifiClients = require('./getWifiClients');
const settings = require('./settings.json');

const app = express();
const webhookHandler = GithubWebHook({ path: '/github-webhook', secret: settings['gh-secret'] });

app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(webhookHandler);

app.get('/', (req, res) => {
    getWifiClients()
        .then(x => res.render('index', {
            clients: x,
            expected: getWifiClients.expected,
            allHere: x.length === getWifiClients.expected
        }))
        .catch(e => res.status(500).json(e));
});

webhookHandler.on('ping', function () {
    console.log('Pinged from GitHub!');
});

webhookHandler.on('push', function () {
    console.error('Got GitHub push, pulling & restarting...');
    exec('git fetch --all && git checkout --force "origin/master" && npm install', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
            return;
        }
        process.exit(42);
    });
});

app.listen(3000, () => {
    console.log('App listening on port 3000!');
});

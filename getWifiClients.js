const nightmare = require('nightmare');
const flatten = require('lodash/flatten');
const moment = require('moment');
const settings = require('./settings.json');

const names = settings.devices;

function makeClient(x) {
    let [name, , mac] = x;
    if (names[mac] === undefined) {
        name = false;
        // name = '"' + name + '"';
    } else {
        name = names[mac];
    }
    return name;
}

function getClients(on5G = false) {
    const n = nightmare({show: true});
    const url = 'http://192.168.100.1:8080/?wifi_wcl' + (on5G ? '1' : '');
    return n.goto(url)
        .wait('#ApplyButton')
        .type('#UserName', settings.username)
        .type('#Password', settings.password)
        .click('#ApplyButton input')
        .wait(1000)
        .wait('#KeywordFilteringTable')
        .evaluate(() => {
            /* global $, _ */
            return $('#KeywordFilteringTable tr.dataRow').get().map(r => _.map(r.children, c => c.innerText));
        })
        .end()
        .then(x => x.filter(a => a[1].indexOf(':') === -1).map(makeClient));
}

function getAllClients() {
    return Promise.all([getClients(false), getClients(true)]);
}

let nextFetchTime = moment();
let lastResults;
let fetching = false;

function getWifiClients() {
    if (nextFetchTime.isAfter(moment()) || fetching) {
        return Promise.resolve(lastResults);
    } else {
        console.log('getWifiClients() fetching...');
        fetching = true;
        return getAllClients()
            .then(x => flatten(x).filter(a => a !== false))
            .then(x => {
                console.log('getWifiClients() =', x);
                lastResults = x;
                nextFetchTime = moment().add(5, 'minutes');
                fetching = false;
                return x;
            });
    }
}

getWifiClients.expected = 0;
for (let k in names) {
    if (names[k] !== false) {
        getWifiClients.expected++;
    }
}

module.exports = getWifiClients;

const nightmare = require('nightmare');
const flatten = require('lodash/flatten');
const settings = require('./settings.json');

const names = settings.devices;

function makeClient(x) {
    let [name, , mac] = x;
    if (names[mac] === undefined) {
        name = '"' + name + '"';
    } else {
        name = names[mac];
    }
    return name;
}

function getClients(on5G = false) {
    const n = nightmare({show: false});
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

getAllClients()
    .then(x => flatten(x).filter(a => a !== false))
    .then(x => x.forEach(a => console.log(a)));


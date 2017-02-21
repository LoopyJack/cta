var fs = require('fs');
var http = require('http');
var bl = require('bl');

var MongoClient = require('mongodb').MongoClient;
var mongourl = 'mongodb://localhost:27017/cta';
var assert = require('assert');


const routes = require('../data/routes.json')['bustime-response']['routes'];
const baseurl = 'http://www.ctabustracker.com/bustime/api/v2/getvehicles?key='
const apikey = 'zBF9iFTDHQt97gSnTSdsWX7x9';

var results = {};
var rts;

module.exports = function() {
  rts = routes.reduce(function(acc, v, i){
    if (i % 10 == 0) {
      acc.push('');
    }
    acc[acc.length-1] = acc[acc.length-1].concat(v.rt).concat(',');
    return acc;
  },[])


  rts.forEach(function(e, i) {
    let str = baseurl + apikey + '&rt=' + e.slice(0, e.length-1) + '&format=json';

    let date = new Date();
    let ts = new Date(Math.round(date.getTime() / (1000 * 60)) * (1000 * 60));
    // console.log(new Date().toLocaleString(),'Requesting:', e.slice(0, e.length-1));
    httpGet(str, ts);
  });
}

function httpGet (url, timestamp) {
  http.get(url, function (response) {
    response.pipe(bl(function (err, data) {
      if (err) {
        return console.error(err);
      }
      try {
        var d = JSON.parse(data.toString())['bustime-response'];
      // if (d['error']) console.log(d['error']);
        manageResults(timestamp, d, rts)
      } catch(e) {
        console.log(e);
      }
    }))
  })
}

function manageResults(timestamp, d, rts) {
  let data;
  d['vehicle'] ? data = d['vehicle'] : data = [];

  if (timestamp in results) {
    results[timestamp].row = results[timestamp].row.concat(data);
    results[timestamp].pushed++;
    // console.log(results[timestamp].pushed,'of', rts.length);
    if (results[timestamp].pushed == rts.length) {
      writeToMongo();
    }
  } else {
    results[timestamp] = {row: data, pushed: 1}
  }

}

function writeToMongo() {
  MongoClient.connect(mongourl, function(err, db) {
    assert.equal(null, err);

    var keys = Object.keys(results).sort();
    let row = {}
    row[keys[0]] = results[keys[0]].row;

    db.collection('vehicles').insertOne(row, function(err, r) {
      assert.equal(null, err);
      assert.equal(1, r.insertedCount);

      db.close();
      delete results[keys[0]];
      console.log(new Date().toLocaleString(), 'written -', row[keys[0]].length, ' records - buffer size:', Object.keys(results).length);

    });
  });
}

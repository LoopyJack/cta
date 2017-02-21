var fs = require('fs');
var http = require('http');
var bl = require('bl');
var path = require('path');

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var MongoClient = require('mongodb').MongoClient;
var mongourl = 'mongodb://localhost:27017/cta';
var assert = require('assert');


const routes = require('../data/routes.json')['bustime-response']['routes'];
const getVehicles_base   = 'http://www.ctabustracker.com/bustime/api/v2/getvehicles?key=';
const getPatterns_base   = 'http://www.ctabustracker.com/bustime/api/v2/getpatterns?key=';
const getDirections_base = 'http://www.ctabustracker.com/bustime/api/v2/getdirections?key=';
// const apikey = 'zBF9iFTDHQt97gSnTSdsWX7x9'; //real one
// const apikey = '5We56sVDWfbC3Myemsz57fEjN'; //ctabus@mailinator:password
const apikeys = require('../data/apikeys.js');

function Downloader() {
  var self = this;

  this.patterns = {};
  this.results = {};
  this.directions = {};
  this.intervalID = 0;
  this.cbcount = 0;

  /* split routes into 2d array with max length 10 */
  this.rts = routes.reduce(function(acc, v, i){
    if (i % 10 == 0) {
      acc.push('');
    }
    acc[acc.length-1] = acc[acc.length-1].concat(v.rt).concat(',');
    return acc;
  },[])

  this.getRoutes = function(len) {
    return routes.reduce(function(acc, v, i){
      if (i % len == 0) {
        acc.push('');
      }
      acc[acc.length-1] = acc[acc.length-1].concat(v.rt).concat(',');
      return acc;
    },[]);
  }


  this.httpGet = function(url, manageCallback, count, param) {
    // console.log(url)
    http.get(url, function (response) {
      response.pipe(bl(function (err, data) {
        if (err) {
          return console.error(err);
        }

        manageCallback(data, count, param);
      }));
    });
  };



  /* Download all vehicles based on routes */
  this.downloadVehicles = function() {
    let rtlist = self.getRoutes(10);
    rtlist.forEach(function(e, i) {

      let str = getVehicles_base + apikey() + '&rt=' + e.slice(0, e.length-1) + '&format=json';
      // console.log(new Date().toLocaleString(),'Requesting:', e.slice(0, e.length-1));
      self.httpGet(str, self.manageVehicles, rtlist.length);
    });
  }


  /* download all patterns for all routes */
  this.downloadPatterns = function() {
    self.cbcount = 0;
    let rtlist = self.getRoutes(1);
    rtlist.forEach(function(ele) {
      let str = getPatterns_base + apikey() + '&rt=' + ele.slice(0, ele.length-1) + '&format=json';
      self.httpGet(str, self.managePatterns, rtlist.length);
    });
  }


  /* download single pattern based on pid */
  this.downloadPattern = function(pid) {
    self.cbcount = 0;
    let str = getPatterns_base + apikey() + '&pid=' + pid + '&format=json';
    self.httpGet(str, self.managePatterns, 1);
  }


  /* download all route directions */
  this.downloadDirections = function() {
    self.cbcount = 0;
    let rtlist = self.getRoutes(1);
    rtlist.forEach(function(ele){
      let str = getDirections_base + apikey() + '&rt=' + ele.slice(0, ele.length-1) + '&format=json';
      self.httpGet(str, self.manageDirections, rtlist.length, ele.slice(0, ele.length-1));
    });
  }


  /* write patterns to file once all response are received */
  this.managePatterns = function(sub, count) {
    try {
      self.cbcount++;
      let res = JSON.parse(sub.toString())['bustime-response'];
      if (res['error']) {
        console.log(res['error']);
        return;
      }

      let data;
      res['ptr'] ? data = res['ptr'] : data = {};
      data.forEach(function(ele) {
        self.patterns[ele.pid] = ele;
      });

    } catch(e) {
      console.log(e);
      return;
    }
    console.log('Received pattern:', self.cbcount, '/', count);
    if (self.cbcount == self.getRoutes(1).length) {
      let ws = fs.createWriteStream(path.join(__dirname, '../data/patterns.json'));
      ws.write(JSON.stringify(self.patterns));

      /* first call once patterns are downloaded */
      self.downloadVehicles();
    }
  }

  this.manageDirections = function(sub, count, rt) {
    try {
      self.cbcount++;
      let res = JSON.parse(sub.toString())['bustime-response'];
      if (res['error']) {
        if (res['error'][0]['msg'] == 'No data found for parameter') {
          console.log(res['error']);
          return;
        }
      }

      let data;
      res['directions'] ? data = res['directions'] : data = {};
      self.directions[rt] = data;

    } catch(e) {
      console.log(e);
      return;
    }

    console.log('Received direction:', rt, self.cbcount, '/', count);

    if (self.cbcount == self.getRoutes(1).length) {
      fs.writeFile(path.join(__dirname, '../data/directions.json'),
                   JSON.stringify(self.directions, null, 2), (err) => {
        if (err) throw err;
        console.log(Object.keys(self.directions).length, 'directions saved');
      });
    }

  }


  /* manages the gobal results object, updating and deleting db once all
    requests are received */
  this.manageVehicles = function(sub, count) {
    /* check if there's actually data in the response*/
    try {
      let res = JSON.parse(sub.toString())['bustime-response'];
      if (res['error']) {
        if (res['error'][0]['msg'] == 'Transaction limit for current day has been exceeded.') {
          console.log(res['error'], url);
          return;
        }
      }

      let date = new Date();
      let timestamp = new Date(Math.round(date.getTime() / (1000 * 60)) * (1000 * 60));

      /* format current response */
      let data;
      res['vehicle'] ? data = res['vehicle'] : data = [];

      /* add route direction from pattern data */
      data.forEach(function(ele) {
        if (self.patterns[ele['pid']]) {
          ele['rtdir'] = self.patterns[ele['pid']]['rtdir'];
        } else {
          console.log('Pattern:', ele['pid'], 'not found for vehicle:', ele['vid']);
          self.downloadPattern(ele['pid']);
        }
        try {

        } catch(e) {
          console.log(e);
        }
      });

      /* Place current response response into global structure and record*/
      if (timestamp in self.results) {
        self.results[timestamp].row = self.results[timestamp].row.concat(data);
        self.results[timestamp].pushed++;
        // console.log(results[timestamp].pushed,'of', rts.length);
        if (self.results[timestamp].pushed == count) {
          self.writeToMongo();
          self.emit('latest', self.results[timestamp].row);
        }
      } else {
        self.results[timestamp] = {row: data, pushed: 1};
      }
    } catch(e) {
      console.log(e);
    }
  };




  /* write global structure to mongodb */
  this.writeToMongo = function() {
    MongoClient.connect(mongourl, function(err, db) {
      assert.equal(null, err);

      var keys = Object.keys(self.results).sort();
      let row = {}
      row[keys[0]] = self.results[keys[0]].row;

      db.collection('vehicles').insertOne(row, function(err, r) {
        assert.equal(null, err);
        assert.equal(1, r.insertedCount);

        db.close();
        delete self.results[keys[0]];
        console.log(new Date().toLocaleString(), 'written -', row[keys[0]].length, ' records - buffer size:', Object.keys(self.results).length);

      });
    });
  };


  this.start = function () {
    self.downloadPatterns();

    self.intervalID = setInterval(self.downloadVehicles, 60 * 1000);
  }

  this.stop = function() {
    clearInterval(self.intervalID);
  }


}

function apikey() {
  let date = new Date();
  return apikeys[date.getHours() % apikeys.length];
}

util.inherits(Downloader, EventEmitter);

module.exports = Downloader;

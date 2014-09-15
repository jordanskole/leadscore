var express = require('express');
var app = express();
var alexaAPI = require('alexa');
var alexa = new alexaAPI('AKIAJJWTNFVUYX6BWIBA', 'd1OIz9p6AZLg3BjK2Xl3Ls1IXq4uCGSjB+xAgLWY');
var bw = require('./builtwith.js');
var _ = require('underscore');
var parseString = require('xml2js').parseString;
var keys = ['kjweh', 'i2duy3', '29yd'];


// do our super simple authentication to prevent randos from spending our $.
app.use(function(req, res, next) {
  if(!_.contains(keys, req.query.key)) {
    res.status(401).json({error: 'Key missing or incorrect'});
  } else if(typeof req.query.domain === 'undefined') {
    res.status(400).json({error: 'Domain is a required parameter'});
  } else if(typeof req.query.rg === 'undefined') {
    res.status(400).json({error: 'ResponseGroup is a required parameter'});
  } else {
    next();
  }
});

// a simple status call.
app.get('/', function(req, res){
  res.send('A-okay');
});

app.get('/UrlInfo', function(req, res) {
  var responsegroups = ['RelatedLinks', 'Categories', 'Rank', 'RankByCountry', ]
  request = alexa.makeRequest('UrlInfo', req.query.domain, req.query.rg);
  alexa.get(request, function(err, results){
    if(!err) {
      parseString(results.body, function(err, body){
        res.send(body);
      });
    }
  });
});

app.get('/TrafficHistory', function(req, res) {

  if (req.query.rg !== 'History') {

    res.status(400).json({error: 'History is the only ResponseGroup'});

  } else {

    request = alexa.makeRequest('TrafficHistory', req.query.domain, req.query.rg, req.query.range);
    alexa.get(request, function(err, results){
      if(!err) {
        parseString(results.body, function(err, body){
          res.send(body);
        });
      }
    });
  }
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

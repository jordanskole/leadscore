var express = require('express');
var app = express();
var alexaAPI = require('alexa');
var alexa = new alexaAPI(process.env.ALEXA_ID, process.env.ALEXA_SECRET);
var bw = require('./builtwith.js');
var _ = require('underscore');
var parseString = require('xml2js').parseString;
var keys = process.env.SECRET_KEYS.split(',');
var Mozscape = require('mozscape').Mozscape;
var moz = new Mozscape(process.env.MOZ_ACCESS_ID, process.env.MOZ_SECRET);


// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static(__dirname + '/public'));

// do our super simple authentication to prevent randos from spending our $.
app.use(function(req, res, next) {
  if(!_.contains(keys, req.query.key)) {
    res.status(401).json({error: 'Key missing or incorrect'});
  } else if(typeof req.query.domain === 'undefined') {
    res.status(400).json({error: 'Domain is a required parameter'});
  // } else if(typeof req.query.rg === 'undefined') {
  //   res.status(400).json({error: 'ResponseGroup is a required parameter'});
  } else {
    next();
  }
});

// a simple status call.
app.get('/', function(req, res){
  res.send('A-okay');
});

app.get('/UrlInfo', function(req, res) {
  // use this to validate that a
  var responsegroups = ['RelatedLinks', 'Categories', 'Rank', 'RankByCountry', 'RankByCity', 'UsageStats','ContactInfo', 'Speed', 'Keywords', 'OwnedDomains', 'LinksInCount','SiteData'];
  request = alexa.makeRequest('UrlInfo', req.query.domain, req.query.rg);

  // alexa.get(request, function(err, results){
  //   if(!err) {
  //     parseString(results.body, function(err, body){
  //       res.send(body);
  //     });
  //   }
  // });

});

app.get('/UrlMetrics', function(req, res){

  // use this to check Moz URL Metrics
  // https://github.com/scott-wyatt/node-mozscape/blob/master/lib/mozscape.js#L225
  var cols = ['mozRank','mozTrust','page_authority','domain_authority'];
  moz.urlMetrics(req.query.domain, cols, function(err, results){
    // if no errors
    if(!err) {

      // build a response for humans from the moz response based on the mozbar
      response = {};
      response.mozRank = results.umrp.toFixed(2);
      response.mozTrust = results.utrp.toFixed(2);
      response.pageAuthority = results.upa.toFixed(0);
      response.domainAuthority = results.pda.toFixed(0);

      // send the response
      res.send(response);

    } else {
      // log the error to console
      console.log(err);
      // and respond with an error saying something is wrong
      res.send(JSON.stringify(err));
    }
  });

})

app.get('/simple', function(req, res) {
  request = alexa.makeRequest('UrlInfo', req.query.domain, 'RelatedLinks,Categories,Rank,RankByCountry,RankByCity,UsageStats,ContactInfo,Speed,Keywords,OwnedDomains,LinksInCount,SiteData');

  var response = new Object;
  response.contactInfo = {};
  response.trafficData = {};
  response.moz = {};

  // do alexa first
  alexa.get(request, function(err, results){
    if(!err) {
      parseString(results.body, function(err, body){
        // make the data more meaningful
        console.log(response);

        // contact info
        response.contactInfo.dataUrl = body["aws:UrlInfoResponse"]["aws:Response"][0]["aws:UrlInfoResult"][0]["aws:Alexa"][0]["aws:ContactInfo"][0]["aws:DataUrl"][0]["_"];
        response.contactInfo.phoneNumber = body["aws:UrlInfoResponse"]["aws:Response"][0]["aws:UrlInfoResult"][0]["aws:Alexa"][0]["aws:ContactInfo"][0]["aws:PhoneNumbers"][0]["aws:PhoneNumbers"];
        response.contactInfo.ownerName = body["aws:UrlInfoResponse"]["aws:Response"][0]["aws:UrlInfoResult"][0]["aws:Alexa"][0]["aws:ContactInfo"][0]["aws:OwnerName"][0];
        response.contactInfo.email = body["aws:UrlInfoResponse"]["aws:Response"][0]["aws:UrlInfoResult"][0]["aws:Alexa"][0]["aws:ContactInfo"][0]["aws:Email"][0];
        if(typeof body["aws:UrlInfoResponse"]["aws:Response"][0]["aws:UrlInfoResult"][0]["aws:Alexa"][0]["aws:ContactInfo"][0]["aws:CompanyStockTicker"][0]["aws:Symbol"] !== "undefined") {
          response.contactInfo.public = true;
        } else {
          response.contactInfo.public = false;
        }

        // content data

        // related

        // traffic data
        response.trafficData.awsRank = body["aws:UrlInfoResponse"]["aws:Response"][0]["aws:UrlInfoResult"][0]["aws:Alexa"][0]["aws:TrafficData"][0]["aws:Rank"][0];


        // use this to check Moz URL Metrics
        // https://github.com/scott-wyatt/node-mozscape/blob/master/lib/mozscape.js#L225
        var cols = ['mozRank','mozTrust','page_authority','domain_authority'];
        moz.urlMetrics(req.query.domain, cols, function(err, results){
          // if no errors
          if(!err) {

            // build a response for humans from the moz response based on the mozbar
            response.moz.mozRank = results.umrp.toFixed(2);
            response.moz.mozTrust = results.utrp.toFixed(2);
            response.moz.pageAuthority = results.upa.toFixed(0);
            response.moz.domainAuthority = results.pda.toFixed(0);

            // send the response
            res.send(response);

          } else {
            // log the error to console
            console.log(err);
            // and respond with an error saying something is wrong
            res.send(JSON.stringify(err));
          }
        });
      }); //!err

    }
  }); // alexa.get



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

var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});

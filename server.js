'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
var dns = require('dns');
var url = require('url');

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

var Schema = mongoose.Schema;
var ShortWebSchema = new Schema({
    original_url:  {type: String, required: true},
    shortNum: {type: Number, required: true},
    short_url: {type: String, required: true}
  });

var ShortWeb = mongoose.model("ShortWeb", ShortWebSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({
  extended: true
})); 

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});



app.post("/api/shorturl/new", function (req, res) {
  const newURL = req.body.url;
  const newHost = url.parse(newURL).hostname;
  let j;
  // test that URL is valid (specifically that it passes the FCC test of http(s)://www.example.com(/more/routes) - Use dns.lookup(host, cb)
  // if not return {"error":"invalid URL"}.    host = bit after http(s)://
  const lookup = dns.lookup(newHost, function (err, addresses, family) {
    if(err) {
      console.log(err);
      console.log("bad URL");
      res.json({"error":"invalid URL"});
    } else {
      console.log("good URL");
      // if valid then create a short URL. This is [this_project_url]/api/shorturl/x where x is a number.
      // use last shortURL number and add 1
      ShortWeb.find().sort({"_id": -1}).limit(1).exec(function (err, docs) {
        let doc = docs.pop();
        console.log(doc);
        let num = 1;
        if (doc) {
          num = doc.shortNum + 1;
        }
        const shortened = "https://url-shortening-.glitch.me/api/shorturl/" + num;
        j = {original_url: newURL, short_url: shortened};
        const short = new ShortWeb({original_url: newURL, shortNum: num, short_url: shortened});
        short.save(function(err, data) {
          if (err) {
            //done(err);
            console.log("Error saving. Error: ", err);
            j = {"error":"cannot save URL"};
            res.json(j);
          } 
          //done(null, data); 
          console.log("URL saved");
          res.json(j);
        });  
      });
    }
  });
});


// when I vist the shortened URL, it will redirect me to my original link. Presumably: [this_project_url]/api/shorturl/:short then res.redirect(xxxx);
app.get("/api/shorturl/:short", function (req, res) {
  // check that the short url exists in the database
  ShortWeb.findOne({shortNum: req.params.short}, function(err, data) {
    if(err) {
       //done(err); 
      console.log(err);
      console.log("short URL not found");
      res.json({"error":"invalid short URL"});
      } else {
        //done(null, data);
        console.log("redirect to ", data.original_url);
        res.redirect(data.original_url); 
      }
    })
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
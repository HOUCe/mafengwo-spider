var http = require("http"),
    fs = require('fs'),
    async = require('async'),
    request = require('request');
var articlesUrl = [];

async.waterfall([
    function(done) {
        request({
            url: "http://www.mafengwo.cn/ajax/ajax_article.php?start=3",
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        }, function(error, response, data) {
            var res = data.match(/i\\\/\d{7}/g);
            for (var i = 0; i < 12; i++) {
                articlesUrl[i] = res[i * 3].substr(3, 7);
                console.log(articlesUrl[i]);
            };
            done(null, data);
        });
    }
], function(error) {
    for (var j = 0; j < articlesUrl.length; j++) {
        async.waterfall([
            function(done) {
                request({
                    url: "http://www.mafengwo.cn/i/" + articlesUrl[j] + ".html",
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                }, function(error, response, data) {
                    var title = data.match(/>.+<\/h1>/).toString();
                    title = title.substring(1, title.length - 5);
                    content = data.substring(data.indexOf("ginfo_kw_hotel") + 16, data.indexOf('vc_total') - 19);
                    fs.writeFile(j + ".html", content, function(e) {
                        if (e) throw e;
                    });
                    console.log(j);
                });
            }
        ], function(error) {})
    };
});



var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/myproject';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server1");

    db.close();
});

var http = require("http"),
    fs = require('fs'),
    async = require('async'),
    request = require('request'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var maxPageNum = 10,
    articlesUrl = [],
    pageList = [];
for (var i = 1; i <= maxPageNum; i++) {
    pageList[i - 1] = i;
};
var insertArticle = function(db, title, content, creator, mp3url, imageUrl, created, callback) {
    if (!creator) {
        creator = 'golmic';
    };
    if (!created) {
        created = '2015-09-12T04:10:54.745Z';
    };
    db.collection('articles').insertOne({
        "creator": creator,
        "title": title,
        "content": content,
        "mp3url": mp3url,
        "imageUrl": imageUrl,
        "created": created
    }, function(err, result) {
        assert.equal(err, null);
        console.log(title);
        callback(result);
    });
};


function getArticle(urlNumber) {
    request({
        url: "http://www.mafengwo.cn/i/" + urlNumber + ".html",
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    }, function(error, response, data) {
        var title, content, creator, created;
        /*获取标题*/
        title = data.match(/<h1.*>\s*.+\s*<\/h1>/).toString().replace(/\s*/g, "").replace(/$/g, "").replace(/\//g, "|").match(/>.+</).toString();
        title = title.substring(1, title.length - 1);
        /*如果有背景音乐就获取背景音乐*/
        if (data.indexOf("music_url") < data.indexOf('music_auto_play')) {
            mp3url = data.substring(data.indexOf("music_url"), data.indexOf('music_auto_play'));
        } else {
            mp3url = data.substring(data.indexOf("music_url"), data.indexOf('is_new_note'));
        };
        mp3url = mp3url.match(/http.+\.mp3/);
        if (mp3url) {
            mp3url = mp3url.toString();
            content = '<audio src="' + mp3url + '" autoplay="autoplay" loop="loop"></audio>';
        };
        /*获取文章内容，发现有两种类型，分别适配*/
        if (data.indexOf('a_con_text cont') != -1) {
            content += data.substring(data.indexOf("a_con_text cont") + 296, data.indexOf('integral') - 12);
        } else {
            content += data.substring(data.indexOf("ginfo_kw_hotel") + 16, data.indexOf('vc_total') - 19);
        };
        /*移除它给图片定义的父标签宽度以便响应式*/
        content = content.replace(/width:\d*px/g, "");
        /*把文中第一張圖片作為在列表中顯示時的圖片*//*有的第一張圖片是表情.....處理一下..*/
        imageUrl = data.match(/http.*\.(jpeg|png|jpg)"/).toString();
        imageUrl = imageUrl.substring(0,imageUrl.indexOf('"'));
        console.log(imageUrl);

        MongoClient.connect('mongodb://localhost:27017/mean', function(err, db) {
            assert.equal(null, err);
            insertArticle(db, title, content, creator, mp3url, imageUrl, created, function() {
                db.close();
            });
        });
        /*fs.writeFile("html/" + title + ".html", content, function(e) {
            if (e) throw e;
            console.log(title);
        });*/
        //console.log(urlNumber+"￥");
    });
};

function getArticleList(pageNum) {
    request({
        url: "http://www.mafengwo.cn/ajax/ajax_article.php?start=" + pageNum,
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    }, function(error, response, data) {
        var res = data.match(/i\\\/\d{7}/g);
        for (var i = 0; i < 12; i++) {
            articlesUrl[i] = res[i * 3].substr(3, 7);
        };
        async.each(articlesUrl, getArticle, function(err) {
            console.log('err: ' + err);
        });
    });
}


async.each(pageList, getArticleList, function(err) {
    console.log('err: ' + err);
});

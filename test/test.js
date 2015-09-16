/*jslint node:true*/

/*global describe, it, before, after, beforeEach, afterEach*/

'use strict';

var MirrorPlugin = require('../');

var Webcheck = require('webcheck');
var freeport = require('freeport');
var express = require('express');
var fs = require('fs');
var rimraf = require('rimraf');

describe('Mirror Plugin', function () {
    var port;
    before(function (done) {
        var app = express();

        /*jslint unparam: true*/
        app.get('/', function (req, res) {
            res.send('<html><head></head><body><p>index</p></body></html>');
        });
        app.get('/index.html', function (req, res) {
            res.send('<html><head></head><body><p>index.html</p></body></html>');
        });
        app.get('/json', function (req, res) {
            res.send({test: 'ok'});
        });
        app.get('/test.txt', function (req, res) {
            res.set('Content-Type', 'text/plain').send('Just a text');
        });
        app.get('/test', function (req, res) {
            res.set('Content-Type', 'text/plain').send('Just test');
        });
        /*jslint unparam: false*/

        freeport(function (err, p) {
            if (err) {
                done(err);
            }
            port = p;
            app.listen(port);
            done();
        });
    });
    after(function (done) {
        rimraf(process.cwd() + '/mirror-out/', done);
    });
    describe('Deafult settings', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        it('should mirror to deafult folder', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/index.html', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
});

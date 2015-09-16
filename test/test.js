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
        app.get('/notAvailable', function (req, res) {
            res.status(404).set('Content-Type', 'text/plain').send('Just test');
        });
        app.get('/error', function (req, res) {
            res.status(500).set('Content-Type', 'text/plain').send('An error');
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
    describe('Default settings', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/mirror-out/', done);
        });

        it('should mirror to default folder', function (done) {
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
        it('should mirror index', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/index', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not ignore the query', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html?test'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/index.html?test', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should also work with multiple fields', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html?test=yes&aha=no'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/index.html?test=yes&aha=no', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not mirror resources with HTTP status codes outside of the 200 area', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/notAvailable'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/notAvailable', function (exists) {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
        it('should not mirror resources with HTTP status codes outside of the 200 area (part 2)', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/error'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/error', function (exists) {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
    });
    describe('Specified destination', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror to specified folder', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror index', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
    describe('Specified content-type', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                filterContentType: /html/
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror matching content-type', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror matching content-type without file extension', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not mirror not matching content-type', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test.txt'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test.txt', function (exists) {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
        it('should not mirror not matching content-type without file extension', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test', function (exists) {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
    });
    describe('Specified status-code', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                filterStatusCode: /^4/
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror matching status-code', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/notAvailable'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/notAvailable', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not mirror not matching status-code', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', function (exists) {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
    });
    describe('Always add file extension', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                addFileExtension: true
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror with additional file extension', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html.html', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror index with file extension', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
    describe('Proof for file extension', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                proofFileExtension: true
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror with additional file extension', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror index with file extension', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test.txt', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror a file with extension and query with additional file extension', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test.txt?query=true'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test.txt?query=true.txt', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
    describe('Filter url', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                filterUrl: /\./
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror matching url', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not mirror not matching url', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test.txt', function (exists) {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
    });
    describe('Specified index name', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                indexName: 'default'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror to other index name', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/default', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror none index paths normal', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
    describe('Not ignore query', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                ignoreQuery: true
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after(function (done) {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror with query but should not use it in file name', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/json?test&aha'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/json', function (exists) {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
});

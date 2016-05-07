/*jslint node:true*/
/// <reference path="../typings/main.d.ts" />

import { MirrorPlugin } from '../webcheck-mirror';
import {Webcheck} from 'webcheck';
import * as freeport from 'freeport';
import * as express from 'express';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

/* tslint:disable:align */



describe('Mirror Plugin', (): void => {
    var port: number;
    before((done: MochaDone): void => {
        var app: express.Application = express();

        /*jslint unparam: true*/
        app.get('/', (req: express.Request, res: express.Response): void => {
            res.send('<html><head></head><body><p>index</p></body></html>');
        });
        app.get('/index.html', (req: express.Request, res: express.Response): void => {
            res.send('<html><head></head><body><p>index.html</p></body></html>');
        });
        app.get('/json', (req: express.Request, res: express.Response): void => {
            res.send({test: 'ok'});
        });
        app.get('/test.txt', (req: express.Request, res: express.Response): void => {
            res.set('Content-Type', 'text/plain').send('Just a text');
        });
        app.get('/test', (req: express.Request, res: express.Response): void => {
            res.set('Content-Type', 'text/plain').send('Just test');
        });
        app.get('/notAvailable', (req: express.Request, res: express.Response): void => {
            res.status(404).set('Content-Type', 'text/plain').send('Just test');
        });
        app.get('/error', (req: express.Request, res: express.Response): void => {
            res.status(500).set('Content-Type', 'text/plain').send('An error');
        });
        /*jslint unparam: false*/

        freeport((err: Error, p: number): void => {
            if (err) {
                done(err);
            }
            port = p;
            app.listen(port);
            done();
        });
    });
    describe('Default settings', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/mirror-out/', done);
        });

        it('should mirror to default folder', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/index.html', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror index', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/index', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not ignore the query', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html?test'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/index.html?test', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should also work with multiple fields', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html?test=yes&aha=no'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/index.html?test=yes&aha=no', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not mirror resources with HTTP status codes outside of the 200 area', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/notAvailable'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/notAvailable', (exists: boolean): void => {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
        it('should not mirror resources with HTTP status codes outside of the 200 area (part 2)', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/error'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/mirror-out/http/localhost/' + port + '/error', (exists: boolean): void => {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
    });
    describe('Specified destination', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror to specified folder', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror index', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
    describe('Specified content-type', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                filterContentType: /html/
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror matching content-type', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror matching content-type without file extension', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not mirror not matching content-type', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test.txt'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test.txt', (exists: boolean): void => {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
        it('should not mirror not matching content-type without file extension', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test', (exists: boolean): void => {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
    });
    describe('Specified status-code', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                filterStatusCode: /^4/
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror matching status-code', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/notAvailable'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/notAvailable', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not mirror not matching status-code', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', (exists: boolean): void => {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
    });
    describe('Always add file extension', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
                addFileExtension: true,
                dest: process.cwd() + '/test-out/'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror with additional file extension', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html.html', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror index with file extension', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
    describe('Proof for file extension', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                proofFileExtension: true
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror with additional file extension', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror index with file extension', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test.txt', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror a file with extension and query with additional file extension', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test.txt?query=true'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test.txt?query=true.txt', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
    describe('Filter url', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                filterUrl: /\./
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror matching url', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should not mirror not matching url', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/test'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/test.txt', (exists: boolean): void => {
                    if (exists) {
                        return done(new Error('File stored'));
                    }
                    return done();
                });
            });
        });
    });
    describe('Specified index name', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                indexName: 'default'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror to other index name', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/default', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
        it('should mirror none index paths normal', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/index.html', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
    describe('Not ignore query', (): void => {
        var webcheck: Webcheck,
            plugin: MirrorPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new MirrorPlugin({
                dest: process.cwd() + '/test-out/',
                ignoreQuery: true
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        after((done: MochaDone): void => {
            rimraf(process.cwd() + '/test-out/', done);
        });

        it('should mirror with query but should not use it in file name', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + port + '/json?test&aha'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                fs.exists(process.cwd() + '/test-out/http/localhost/' + port + '/json', (exists: boolean): void => {
                    if (exists) {
                        return done();
                    }
                    return done(new Error('File not stored'));
                });
            });
        });
    });
});

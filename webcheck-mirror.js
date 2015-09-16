/*jslint node:true*/
'use strict';

var WebcheckPlugin = require('webcheck/plugin');
var createWriteStream = require('fs').createWriteStream;
var path = require('path');
var url = require('url');
var mkdirp = require('mkdirp');
var mime = require('mime-types');

var pkg = require('./package.json');
/**
 * A helper function for empty regular expressions
 * @private
 * @type {{test: Function}}
 */
var emptyFilter = {
    test: function () {
        return true;
    }
};


/**
 * Mirroring plugin for webcheck.
 * Mirror content to directory structure.
 * @author Arne Schubert <atd.schubert@gmail.com>
 * @param {{}} [opts] - Options for this plugin
 * @param {string} [opts.dest] - Destination path for mirroring
 * @param {RegExp|{test:Function}} [opts.filterContentType] - Mirror only matching content-type
 * @param {RegExp|{test:Function}} [opts.filterStatusCode] - Mirror only matching HTTP status code
 * @param {RegExp|{test:Function}} [opts.filterUrl] - Mirror only matching url
 * @param {boolean} [opts.ignoreQuery=true] - Ignore query part of url when mirroring
 * @param {boolean} [opts.addFileExtension] - Always add a file extension from mime-type in content-type header
 * @param {boolean} [opts.proofFileExtension] - Proof if content-type matches mime-type, otherwise add file extension from content-type header
 * @param {string} [opts.indexName="index"] - Fallback for index pages
 * @augments Webcheck.Plugin
 * @constructor
 */
var MirrorPlugin = function (opts) {
    WebcheckPlugin.apply(this, arguments);

    opts = opts || {};
    opts.dest = opts.dest || process.cwd() + '/mirror-out';

    opts.filterContentType = opts.filterContentType || emptyFilter;
    opts.filterStatusCode = opts.filterStatusCode || /^2/;
    opts.filterUrl = opts.filterUrl || emptyFilter;

    opts.addFileExtension = opts.addFileExtension || false;
    opts.proofFileExtension = opts.proofFileExtension || false;

    if (!opts.hasOwnProperty('indexName')) {
        opts.indexName = 'index';
    }
    if (!opts.hasOwnProperty('ignoreQuery')) {
        opts.ignoreQuery = false;
    }

    this.middleware = function (result, next) {
        var pathInfo, urlInfo, stream;

        if (!opts.filterUrl.test(result.url) ||
                !opts.filterContentType.test(result.response.headers['content-type']) ||
                !opts.filterStatusCode.test(result.response.statusCode.toString())) {
            return next();
        }
        urlInfo = url.parse(result.url);

        urlInfo.protocol = urlInfo.protocol.substring(0, urlInfo.protocol.length - 1); // remove ":" at the end
        urlInfo.port = urlInfo.port || '';
        urlInfo.search = urlInfo.search || '';

        if (urlInfo.pathname === '/') {
            urlInfo.pathname = '/' + opts.indexName;
        }

        if (opts.addFileExtension) {
            urlInfo.pathname = urlInfo.pathname + '.' + mime.extension(result.response.headers['content-type']);
        }

        if (opts.ignoreQuery) {
            pathInfo = path.parse(path.resolve(opts.dest, urlInfo.protocol, urlInfo.hostname, urlInfo.port, '.' + urlInfo.pathname));
        } else {
            pathInfo = path.parse(path.resolve(opts.dest, urlInfo.protocol, urlInfo.hostname, urlInfo.port, '.' + urlInfo.pathname + urlInfo.search));
        }

        if (opts.proofFileExtension && (pathInfo.ext !== '.' + mime.extension(result.response.headers['content-type']))) {
            pathInfo.ext += '.' + mime.extension(result.response.headers['content-type']);
        }

        mkdirp(pathInfo.dir + '/', function (err) {
            if (err) {
                return next(err);
            }
            try {
                stream = createWriteStream(path.resolve(pathInfo.dir, pathInfo.name + pathInfo.ext));
            } catch (error) {
                return next(error);
            }

            result.response.pipe(stream);

            return next();
        });
    };
};

MirrorPlugin.prototype = {
    '__proto__': WebcheckPlugin.prototype,
    package: pkg
};

module.exports = MirrorPlugin;

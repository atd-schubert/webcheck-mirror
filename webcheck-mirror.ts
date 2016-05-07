/// <reference path="./typings/main.d.ts" />

import { Plugin as WebcheckPlugin, IResult, ICallback } from 'webcheck';
import * as url from 'url';
import * as path from 'path';
import * as mime from 'mime';
import * as mkdirp from 'mkdirp';

import { createWriteStream, WriteStream } from 'fs';

import * as pkg from './package.json';



export interface ISimplifiedRegExpr {
    test(txt: string): boolean;
}

export interface IMirrorPluginOptions {
    dest?: string;
    addFileExtension?: boolean;
    proofFileExtension?: boolean;
    indexName?: string;
    ignoreQuery?: boolean;

    filterContentType?: ISimplifiedRegExpr | RegExp;
    filterStatusCode?: ISimplifiedRegExpr | RegExp;
    filterUrl?: ISimplifiedRegExpr | RegExp;
}

/**
 * A helper function for empty regular expressions
 * @private
 * @type {{test: Function}}
 */
var emptyFilter: ISimplifiedRegExpr = { // a spoofed RegExpr...
    test: (): boolean => {
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
 * @augments WebcheckPlugin
 * @constructor
 */

export class MirrorPlugin extends WebcheckPlugin {
    public package: any = pkg;

    constructor(opts: IMirrorPluginOptions) {
        super();
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

        this.middleware = (result: IResult, next: ICallback): void => {
            var pathInfo: path.ParsedPath,
                urlInfo: url.Url,
                stream: WriteStream;

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

            mkdirp(pathInfo.dir + '/', (err: Error): void => {
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
    }
}

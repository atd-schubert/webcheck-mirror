import { extension } from "mime-types";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as url from "url";
import { ICallback, IResult, Plugin as WebcheckPlugin } from "webcheck";

import { createWriteStream, WriteStream } from "fs";

import * as pkg from "./package.json";

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
const emptyFilter: ISimplifiedRegExpr = { // a spoofed RegExpr...
    test: (): boolean => {
        return true;
    },
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
 * @param {boolean} [opts.proofFileExtension] - Proof if content-type matches mime-type, otherwise add file extension
 * from content-type header
 * @param {string} [opts.indexName="index"] - Fallback for index pages
 * @augments WebcheckPlugin
 * @constructor
 */

export class MirrorPlugin extends WebcheckPlugin {
    public package: any = pkg;

    constructor(opts: IMirrorPluginOptions = {}) {
        super();
        const dest = opts.dest || process.cwd() + "/mirror-out";

        const contentTypeFilter = opts.filterContentType || emptyFilter;
        const statusCodeFiler = opts.filterStatusCode || /^2/;
        const urlFilter = opts.filterUrl || emptyFilter;

        opts.addFileExtension = opts.addFileExtension || false;
        opts.proofFileExtension = opts.proofFileExtension || false;
        opts.ignoreQuery = opts.ignoreQuery || false;

        if (!opts.hasOwnProperty("indexName")) {
            opts.indexName = "index";
        }

        this.middleware = (result: IResult, next: ICallback): void => {
            let pathInfo: path.ParsedPath;

            if (!urlFilter.test(result.url) ||
                !contentTypeFilter.test(result.response.headers["content-type"]!) ||
                !statusCodeFiler.test(result.response.statusCode.toString())) {
                return next();
            }
            const urlInfo = url.parse(result.url);

            if (!urlInfo.protocol || !urlInfo.hostname) {
                return next(new Error("Parsing of url failed"));
            }
            if (!result.response.headers["content-type"]) {
                // Fallback to application/octet-stream
                result.response.headers["content-type"] = "application/octet-stream";
            }

            urlInfo.protocol = urlInfo.protocol!.substring(0, urlInfo.protocol.length - 1); // remove ":" at the end
            urlInfo.port = urlInfo.port || "";
            urlInfo.search = urlInfo.search || "";

            if (urlInfo.pathname === "/") {
                urlInfo.pathname = "/" + opts.indexName;
            }

            if (opts.addFileExtension) {
                urlInfo.pathname = urlInfo.pathname + "." + extension(result.response.headers["content-type"]);
            }

            if (opts.ignoreQuery) {
                pathInfo = path.parse(
                    path.resolve(dest, urlInfo.protocol, urlInfo.hostname, urlInfo.port, "." + urlInfo.pathname),
                );
            } else {
                pathInfo = path.parse(
                    path.resolve(
                        dest,
                        urlInfo.protocol,
                        urlInfo.hostname,
                        urlInfo.port,
                        "." + urlInfo.pathname + urlInfo.search,
                    ),
                );
            }

            if (
                opts.proofFileExtension
                && (pathInfo.ext !== "." + extension(result.response.headers["content-type"]))
            ) {
                pathInfo.ext += "." + extension(result.response.headers["content-type"]);
            }

            mkdirp(pathInfo.dir + "/", (err: Error): void => {
                if (err) {
                    return next(err);
                }
                try {
                    const stream = createWriteStream(path.resolve(pathInfo.dir, pathInfo.name + pathInfo.ext));
                    result.response.pipe(stream);
                    return next();
                } catch (error) {
                    return next(error);
                }
            });
        };
    }
}

import fs from 'fs-extra';
import options from './options';
import path from 'path';
import request from 'request';
import semver from 'semver';
import snooplogg from 'snooplogg';
import yauzl from 'yauzl';

import { arch } from 'appcd-util';
import { isFile } from 'appcd-fs';
import { STATUS_CODES } from 'http';

const { log } = snooplogg;
const { highlight } = snooplogg.styles;

/**
 * The current machine's architecture.
 * @type {String}
 */
export const architecture = arch();

/**
 * The current machine's operating system.
 * @type {String}
 */
export const os = process.platform === 'darwin' ? 'osx' : process.platform;

/**
 * Extracts a zip file to the specified destination.
 *
 * @param {Object} params - Various parameters.
 * @param {String} params.dest - The destination to extract the file.
 * @param {String} params.file - The path to the zip file to extract.
 * @returns {Promise}
 */
export async function extractZip(params) {
	if (!params || typeof params !== 'object') {
		throw new TypeError('Expected params to be an object');
	}

	let { dest, file } = params;

	if (!dest || typeof dest !== 'string') {
		throw new TypeError('Expected destination directory to be a non-empty string');
	}

	if (!file || typeof file !== 'string') {
		throw new TypeError('Expected zip file to be a non-empty string');
	}

	if (!fs.existsSync(file)) {
		throw new Error('The specified zip file does not exist');
	}

	if (!isFile(file)) {
		throw new Error('The specified zip file is not a file');
	}

	log(`Extracting ${highlight(file)} => ${highlight(dest)}`);

	await new Promise((resolve, reject) => {
		yauzl.open(file, { lazyEntries: true }, (err, zipfile) => {
			if (err) {
				return reject(new Error(`Invalid zip file: ${err.message || err}`));
			}

			zipfile
				.on('entry', entry => {
					if (typeof params.onEntry === 'function') {
						try {
							params.onEntry(entry.fileName);
						} catch (e) {
							return reject(e);
						}
					}

					const fullPath = path.join(dest, entry.fileName);

					if (/\/$/.test(entry.fileName)) {
						fs.mkdirp(fullPath, () => zipfile.readEntry());
					} else {
						fs.mkdirp(path.dirname(fullPath), () => {
							zipfile.openReadStream(entry, (err, readStream) => {
								if (err) {
									return reject(err);
								}

								const writeStream = fs.createWriteStream(fullPath);
								writeStream.on('close', () => zipfile.readEntry());
								writeStream.on('error', reject);
								readStream.pipe(writeStream);
							});
						});
					}
				})
				.on('close', resolve)
				.readEntry();
		});
	});
}

/**
 * Fetches a URL and parses the result as JSON.
 *
 * @param {String} url - The URL to request.
 * @returns {Promise} Resolves the parsed body.
 */
export function fetchJSON(url) {
	return new Promise((resolve, reject) => {
		log(`Fetching ${highlight(url)}`);
		const params = Object.assign({}, options.network, { method: 'GET', url });

		request(params, (err, response, body) => {
			if (err) {
				return reject(new Error(err));
			}

			// istanbul ignore if
			if (!response) {
				return reject(new Error('Request error: no response'));
			}

			const { statusCode } = response;

			if (statusCode >= 400) {
				return reject(new Error(`${statusCode} ${STATUS_CODES[statusCode]}`));
			}

			try {
				resolve(JSON.parse(body));
			} catch (e) {
				reject(new Error('Request error: malformed JSON response'));
			}
		});
	});
}

/**
 * Version number comparison helpers.
 *
 * @type {Object}
 */
export const version = {
	format(ver, min, max, chopDash) {
		ver = ('' + (ver || 0));
		if (chopDash) {
			ver = ver.replace(/(-.*)?$/, '');
		}
		ver = ver.split('.');
		if (min !== undefined) {
			while (ver.length < min) {
				ver.push('0');
			}
		}
		if (max !== undefined) {
			ver = ver.slice(0, max);
		}
		return ver.join('.');
	},
	eq(v1, v2) {
		return semver.eq(version.format(v1, 3, 3), version.format(v2, 3, 3));
	},
	lt(v1, v2) {
		return semver.lt(version.format(v1, 3, 3), version.format(v2, 3, 3));
	},
	rcompare(v1, v2) {
		return version.eq(v1, v2) ? 0 : version.lt(v1, v2) ? 1 : -1;
	}
};

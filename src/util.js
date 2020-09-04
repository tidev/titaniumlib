import fs from 'fs-extra';
import got from 'got';
import path from 'path';
import semver from 'semver';
import snooplogg from 'snooplogg';
import yauzl from 'yauzl';

import { arch } from 'appcd-util';
import { isFile } from 'appcd-fs';

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
 * @param {Function} [params.onEntry] - A callback to fire per entry.
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

			let idx = 0;
			const total = zipfile.entryCount;
			const abort = err => {
				zipfile.removeListener('end', resolve);
				zipfile.close();
				reject(err);
			};

			zipfile
				.on('entry', entry => {
					idx++;
					if (typeof params.onEntry === 'function') {
						try {
							params.onEntry(entry.fileName, idx, total);
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
									return abort(err);
								}

								const writeStream = fs.createWriteStream(fullPath,  {
									mode: entry.externalFileAttributes >>> 16
								});
								writeStream.on('close', () => zipfile.readEntry());
								writeStream.on('error', abort);
								readStream.pipe(writeStream);
							});
						});
					}
				})
				.once('end', resolve)
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
export async function fetchJSON(url) {
	log(`Fetching ${highlight(url)}`);
	return (await got(url, {
		responseType: 'json',
		retry: 0
	})).body;
}

/**
 * Tracks install tasks and their progress.
 */
export class TaskTracker {
	constructor(callback, tasks) {
		if (callback && typeof callback !== 'function') {
			throw new TypeError('Expected progress callback to be a function');
		}
		this.callback = callback || (() => {});
		this.tasks = tasks;
		this.currentTask = 1;
		this.currentProgress = 0;
	}

	startTask(hasProgress = true) {
		if (!this.sentTasks) {
			this.sentTasks = true;
			this.callback({ type: 'tasks', tasks: this.tasks });
		}

		this.callback({ hasProgress, task: this.currentTask, type: 'task-start' });
	}

	progress(value, force) {
		const prev = this.currentProgress;
		if (force || value - prev > 0.01) {
			this.currentProgress = value;
			this.callback({ task: this.currentTask, type: 'task-progress', progress: value });
		}
	}

	endTask() {
		if (this.currentProgress < 1) {
			this.progress(1, true);
		}
		this.callback({ task: this.currentTask, type: 'task-end' });
		this.currentTask++;
		this.currentProgress = 0;
	}
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

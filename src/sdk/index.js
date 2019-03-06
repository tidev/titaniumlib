import fs from 'fs-extra';
import options from '../options';
import path from 'path';
import pluralize from 'pluralize';
import request from 'request';
import snooplogg from 'snooplogg';
import TitaniumSDK from './titanium-sdk';
import tmp from 'tmp';

import { architecture, extractZip, fetchJSON, os, version } from '../util';
import { arrayify, cacheSync, get, unique } from 'appcd-util';
import { expandPath } from 'appcd-path';
import { isDir } from 'appcd-fs';
import { STATUS_CODES } from 'http';

export { TitaniumSDK };

const { log } = snooplogg;
const { highlight } = snooplogg.styles;

/**
 * Common search paths for Titanium SDKs.
 * @type {Object}
 */
export const locations = {
	darwin: [
		'~/Library/Application Support/Titanium',
		'/Library/Application Support/Titanium'
	],
	linux: [
		'~/.titanium'
	],
	win32: [
		'%ProgramData%\\Titanium',
		'%APPDATA%\\Titanium',
		'%ALLUSERSPROFILE%\\Application Data\\Titanium'
	]
};

/**
 * A regex to extract a continuous integration build version and platform from the filename.
 * @type {RegExp}
 */
const ciBuildRegExp = /^mobilesdk-(.+)(?:\.v|-)((\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2}))-([^.]+)/;

/**
 * A regex to test if a string is a URL or path to a zip file.
 * @type {RegExp}
 */
const uriRegExp = /^(https?:\/\/.+)|(?:file:\/\/(.+))$/;

/**
 * Retrieves the list of CI branches.
 *
 * @returns {Promise<Object>}
 */
export async function getBranches() {
	return await fetchJSON(options.sdk.urls.branches);
}

/**
 * Retreives a list of Titanium SDK continuous integration builds.
 *
 * @param {String} [branch="master"] - The branch to retreive.
 * @returns {Promise<Object>} Resolves a map of versions to build info.
 */
export async function getBuilds(branch = 'master') {
	if (!branch || typeof branch !== 'string') {
		throw new TypeError('Expected branch to be a string');
	}

	const { urls } = options.sdk;
	const builds = await fetchJSON(urls.builds.replace(/<BRANCH>/, branch));
	const results = {};

	log(`Received ${pluralize('build', builds.length, true)}`);

	for (const build of builds) {
		const { build_type, filename, git_branch, git_revision } = build;
		const m = filename && filename.match(ciBuildRegExp);

		if (build_type !== 'mobile' || !m || !filename.includes(`-${os}`)) {
			continue;
		}

		const name = `${m[1]}.v${m[2]}`;

		results[name] = {
			version: m[1],
			ts:      m[2],
			githash: git_revision,
			date:    new Date(`${m.slice(4, 6).join('/')}/${m[3]} ${m.slice(6, 9).join(':')}`),
			url:     urls.build.replace(/<BRANCH>/, git_branch).replace(/<FILENAME>/, filename)
		};
	}

	return results;
}

/**
 * Returns a list of Titanium SDK installation locations.
 *
 * @param {String} [defaultPath] - A path that represents the default and is the first path in the list.
 * @returns {Array.<String>}
 */
export function getInstallPaths(defaultPath) {
	const paths = locations[process.platform].map(p => expandPath(p));
	if (defaultPath) {
		if (typeof defaultPath !== 'string') {
			throw new TypeError('Expected default install path to be a string');
		}
		paths.unshift(expandPath(defaultPath));
	}
	return unique(paths);
}

/**
 * Retreives a map of Titanium SDK versions to release info including the download URL. By default,
 * the latest version is added to the map of releases.
 *
 * @param {Boolean} [noLatest=false] - When `true`, it does not determine the 'latest' release.
 * @returns {Promise<Object>} Resolves a map of versions to URLs.
 */
export async function getReleases(noLatest) {
	const { releases } = await fetchJSON(options.sdk.urls.releases);
	const results = {};
	const is64 = architecture === 'x64';
	const archRE = /64bit/;

	for (const release of releases) {
		const { build_type, name, url, version: ver } = release;

		if (release.os !== os || name !== 'mobilesdk') {
			continue;
		}

		const is64build = archRE.test(build_type);

		if (os !== 'linux' || (is64 && is64build) || (!is64 && !is64build)) {
			results[ver] = {
				version: ver.replace(/\.GA.*$/, ''),
				url
			};
		}
	}

	if (!noLatest) {
		const latest = Object.keys(results).sort(version.rcompare)[0];
		if (latest) {
			results.latest = results[latest];
		}
	}

	return results;
}

/**
 * Detect Titanium SDKs
 *
 * @param {Boolean} [force=false] - When true ignore the cache
 * @returns {Array<TitaniumSDK>}
 */
export function getInstalledSDKs(force) {
	return cacheSync('titaniumlib:sdk', force, () => {
		const results = [];
		let searchPaths = arrayify(get(options, 'sdk.searchPaths'));

		if (!searchPaths.length) {
			searchPaths = locations[process.platform];
		}

		for (let dir of searchPaths) {
			dir = expandPath(dir);
			if (isDir(dir)) {
				// do a quick check if this directory contains a 'mobilesdk' directory
				const dir2 = path.join(dir, 'mobilesdk', os);
				if (isDir(dir2)) {
					dir = dir2;
				}

				for (let sdkDir of fs.readdirSync(dir)) {
					sdkDir = path.join(dir, sdkDir);
					try {
						results.push(new TitaniumSDK(sdkDir));
					} catch (e) {
						// Do nothing
					}
				}
			}
		}

		return results;
	});
}

/**
 * Install a Titanium SDK from either a URI or version. A URI may be either a local file, a URL, an
 * SDK version, a CI branch, or a CI branch and build hash.
 *
 * @param {Object} params - Various parameters.
 * @param {String} [params.defaultInstallPath] - The default install path. Defaults to the platform-
 * specific install path.
 * @param {Context} [params.downloadDir] - When `uri` is a URL, release, or build, download the SDK to this directory.
 * @param {Boolean} [params.keep=false] - When `true` and `uri` is a URL, release, or build, then
 * @param {Boolean} [params.overwrite=false] - When `true`, overwrites an existing Titanium SDK
 * installation, otherwise an error is thrown.
 * @param {String} [params.uri] - A URI to a local file or remote URL to download.
 * @returns {Promise}
 */
export async function install(params = {}) {
	if (!params || typeof params !== 'object') {
		throw new TypeError('Expected params to be an object');
	}

	if (params.uri !== undefined && typeof params.uri !== 'string') {
		throw new TypeError('Expected URI to be a string');
	}

	let uri            = (params.uri || 'latest').trim();
	const uriMatch     = params.uri && params.uri.match(uriRegExp);
	let downloadedFile = null;
	let file           = null;
	let url            = null;

	// step 1: determine what the uri is

	if (uriMatch && uriMatch[2]) {
		file = uriMatch[2];
	} else if (params.uri && fs.existsSync(params.uri)) {
		file = params.uri;
	}

	if (file) {
		file = expandPath(file);

		if (!fs.existsSync(file)) {
			throw new Error('Specified file URI does not exist');
		}

		if (!/\.zip$/.test(file)) {
			throw new Error('Specified file URI is not a zip file');
		}
	} else {
		// we are downloading an sdk

		if (uriMatch && uriMatch[1]) {
			// we have a http url
			url = uriMatch[1];
			log(`URI is a URL: ${highlight(url)}`);

		} else {
			// we have a version that needs to be resolved to a url
			const releases = await getReleases();
			let ver = uri;

			if (ver && (releases[ver] || releases[`${ver}.GA`])) {
				// we have a ga release
				url = (releases[ver] || releases[`${ver}.GA`]).url;
				log(`URI is a release: ${highlight(url)}`);
			} else {
				// maybe a ci build?
				let { branches, defaultBranch } = await getBranches();

				if (ver) {
					const m = ver.match(/^([A-Za-z0-9_]+?):(.+)$/);

					if (m) {
						// uri is a branch:hash combo
						const branch = m[1];
						log(`URI is a branch:hash combo: ${highlight(ver)}`);
						if (!branches.includes(branch)) {
							throw new Error(`Invalid branch "${branch}"`);
						}
						branches = [ branch ];
						ver = m[2];

					} else if (branches.includes(ver)) {
						// uri is a ci branch, default to latest version
						log(`URI is a branch: ${highlight(`${ver}:latest`)}`);
						branches = [ ver ];
						ver = 'latest';
					}
				}

				branches.sort((a, b) => {
					// force the default branch to the front
					return a === defaultBranch ? -1 : b.localeCompare(a);
				});

				if (branches.length > 1) {
					log(`Scanning ${pluralize('branch', branches.length, true)} for ${ver}`);
				}

				url = await branches.reduce((promise, branch) => {
					return promise.then(async url => {
						if (url) {
							return url;
						}

						const builds = await getBuilds(branch);
						const sortBuilds = (a, b) => {
							const r = version.rcompare(builds[a].version, builds[b].version);
							return r === 0 ? builds[b].ts.localeCompare(builds[a].ts) : r;
						};

						// eslint-disable-next-line promise/always-return
						for (const name of Object.keys(builds).sort(sortBuilds)) {
							if (ver === 'latest' || name === ver || builds[name].githash === ver) {
								return builds[name].url;
							}
						}
					});
				}, Promise.resolve());
			}
		}

		if (!url) {
			// note: yes, we want `params.uri` and not `uri`
			throw new Error(`Unable to find any Titanium SDK releases or CI builds that match "${params.uri}"`);
		}

		// step 1.5: download the file

		let { downloadDir } = params;

		downloadedFile = tmp.tmpNameSync({
			dir: downloadDir,
			prefix: 'titaniumlib-',
			postfix: '.zip'
		});

		if (!downloadDir) {
			downloadDir = path.dirname(downloadedFile);
		}
		await fs.mkdirp(downloadDir);

		file = await new Promise((resolve, reject) => {
			log(`Downloading ${highlight(url)} => ${highlight(downloadedFile)}`);
			const req = request({ url });

			const out = fs.createWriteStream(downloadedFile);
			req.pipe(out);

			req.on('response', response => {
				const { statusCode } = response;

				if (statusCode >= 400) {
					fs.removeSync(downloadedFile);
					return reject(new Error(`${statusCode} ${STATUS_CODES[statusCode]}`));
				}

				out.on('close', () => {
					let file = downloadedFile;
					const m = url.match(/.*\/(.+\.zip)$/);
					if (m) {
						file = path.join(downloadDir, m[1]);
						fs.renameSync(downloadedFile, file);
						downloadedFile = file;
					}
					resolve(file);
				});
			});

			req.once('error', reject);
		});
	}

	// step 2: extract the sdk zip file

	// eslint-disable-next-line security/detect-non-literal-regexp
	const sdkDestRegExp = new RegExp(`^mobilesdk[/\\\\]${os}[/\\\\]([^/\\\\]+)`);
	const tempDir = tmp.tmpNameSync({ prefix: 'titaniumlib-' });
	const titaniumDir = getInstallPaths(params.defaultInstallPath)[0]; // first path is always the default
	let name;

	try {
		await extractZip({
			dest: tempDir,
			file,
			onEntry(filename) {
				// do a quick check to make sure the destination doesn't exist
				const m = !name && filename.match(sdkDestRegExp);
				if (m) {
					name = m[1];
					const sdkDir = path.join(titaniumDir, 'mobilesdk', os, name);
					if (!params.overwrite && isDir(sdkDir)) {
						throw new Error(`Titanium SDK "${name}" already exists: ${sdkDir}`);
					}
				}
			}
		});

		if (!name) {
			throw new Error('Zip file does not appear to contain a Titanium SDK');
		}

		// step 3: move the sdk files to the dest

		let src = path.join(tempDir, 'mobilesdk', os, name);
		let dest = path.join(titaniumDir, 'mobilesdk', os, name);
		log(`Moving SDK files: ${highlight(src)} => ${highlight(dest)}`);
		await fs.move(src, dest, { overwrite: true });

		// install the modules
		src = path.join(tempDir, 'modules');
		if (isDir(src)) {
			dest = path.join(titaniumDir, 'modules');

			for (const platform of fs.readdirSync(src)) {
				const srcPlatformDir = path.join(src, platform);
				if (!isDir(srcPlatformDir)) {
					continue;
				}

				for (const moduleName of fs.readdirSync(srcPlatformDir)) {
					const srcModuleDir = path.join(srcPlatformDir, moduleName);
					if (!isDir(srcModuleDir)) {
						continue;
					}

					for (const ver of fs.readdirSync(srcModuleDir)) {
						const srcVersionDir = path.join(srcModuleDir, ver);
						if (!isDir(srcVersionDir)) {
							continue;
						}

						const destDir = path.join(dest, platform, moduleName, ver);
						log(`Moving module files ${highlight(`${platform}/${moduleName}@${ver}`)}: ${highlight(srcVersionDir)} => ${highlight(destDir)}`);

						if (!params.overwrite && isDir(destDir)) {
							log(`Module ${highlight(`${platform}/${moduleName}@${ver}`)} already exists, skipping`);
							continue;
						}

						await fs.move(srcVersionDir, destDir, { overwrite: true });
					}
				}
			}
		}
	} finally {
		log(`Removing ${highlight(tempDir)}`);
		await fs.remove(tempDir);
	}

	if (downloadedFile && !params.keep) {
		log(`Removing ${highlight(downloadedFile)}`);
		await fs.remove(downloadedFile);
	}
}

/**
 * Deletes an installed Titanium SDK by name or path.
 *
 * @param {String} nameOrPath - The SDK name or path to uninstall.
 * @returns {Promise<Array<TitaniumSDK>>} Resolves an array of versions removed.
 * @access private
 */
export async function uninstall(nameOrPath) {
	if (!nameOrPath || typeof nameOrPath !== 'string') {
		throw new TypeError('Expected an SDK name or path');
	}

	const sdks = await getInstalledSDKs(true);
	const results = [];

	for (const sdk of sdks) {
		if (sdk.name === nameOrPath || sdk.path === nameOrPath) {
			results.push(sdk);
			log(`Deleting ${highlight(sdk.path)}`);
			await fs.remove(sdk.path);
		}
	}

	if (!results.length) {
		const err = new Error(`Unable to find any SDKs matching "${nameOrPath}"`);
		err.code = 'ENOTFOUND';
		throw err;
	}

	return results;
}

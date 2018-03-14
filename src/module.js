import fs from 'fs';
import path from 'path';
import semver from 'semver';
import options from './options';

import { arrayify, cacheSync, get } from 'appcd-util';
import { expandPath } from 'appcd-path';
import { isDir } from 'appcd-fs';

/**
 * Cached regex for matching key/values in properties files.
 * @type {RegExp}
 */
const iniRegExp = /^(?!\s*#)\s*([^:\s]+)\s*:\s*(.+?)\s*$/;

/**
 * Common search paths for Titanium Modules.
 * @type {Object}
 */
export const locations = {
	darwin: [
		'~/Library/Application Support/Titanium/modules',
		'/Library/Application Support/Titanium/modules'
	],
	linux: [
		'~/.titanium/modules'
	],
	win32: [
		'%ProgramData%\\Titanium\\modules',
		'%APPDATA%\\Titanium\\modules',
		'%ALLUSERSPROFILE%\\Application Data\\Titanium\\modules'
	]
};

/**
 * Titanium Module information object.
 */
export class TitaniumModule {
	/**
	 * Checks if the specified directory contains a Titanium Module.
	 *
	 * @param {String} dir - The directory to scan.
	 * @access public
	 */
	constructor(dir) {
		if (typeof dir !== 'string' || !dir) {
			throw new TypeError('Expected directory to be a valid string');
		}

		dir = expandPath(dir);
		if (!isDir(dir)) {
			throw new Error('Directory does not exist');
		}

		this.path     = dir;
		this.platform = path.basename(path.dirname(path.dirname(dir)));
		this.version  = path.basename(dir);

		try {
			const manifestFile = path.join(dir, 'manifest');

			for (const line of fs.readFileSync(manifestFile, 'utf8').split(/\r?\n/)) {
				const m = line.match(iniRegExp);
				if (m) {
					this[m[1]] = m[2];
				}
			}
		} catch (e) {
			throw new Error('Directory does not contain a valid manifest');
		}

		if (this.platform === 'iphone') {
			this.platform = 'ios';
		}

		if (!semver.valid(this.version)) {
			throw new Error(`Version ${this.version} is not valid`);
		}
	}
}

export default TitaniumModule;

/**
 * Detect Titanium modules
 * @param {Boolean} [force] - When true ignore the cache
 * @returns {Object}
 */
export function getModules(force) {
	return cacheSync('titaniumlib:modules', force, () => {
		const results = {};
		let searchPaths = arrayify(get(options, 'module.searchPaths'));
		if (!searchPaths.length) {
			searchPaths = locations[process.platform];
		}
		for (let dir of searchPaths) {
			dir = expandPath(dir);
			if (isDir(dir)) {
				for (const platform of fs.readdirSync(dir)) {
					const platformDir = path.join(dir, platform);
					if (isDir(platformDir)) {
						for (const moduleName of fs.readdirSync(platformDir)) {
							const moduleDir = path.join(platformDir, moduleName);
							if (isDir(moduleDir)) {
								for (const version of fs.readdirSync(moduleDir)) {
									const versionDir = path.join(moduleDir, version);
									try {
										const tiModule = new TitaniumModule(versionDir);
										if (!results[platform]) {
											results[platform] = {};
										}
										if (!results[platform][tiModule.moduleid]) {
											results[platform][tiModule.moduleid] = {};
										}
										results[platform][tiModule.moduleid][tiModule.version] = tiModule;
									} catch (e) {
										// console.log(e);
									}
								}
							}
						}
					}
				}
			}
		}
		return results;
	});
}

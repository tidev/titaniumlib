import fs from 'fs';
import path from 'path';
import options from '../options';
import TitaniumModule from './titanium-module';

import { arrayify, cacheSync, get } from 'appcd-util';
import { expandPath } from 'appcd-path';
import { isDir } from 'appcd-fs';

export { TitaniumModule };

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
 * Detect Titanium modules
 *
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
			if (!isDir(dir)) {
				continue;
			}

			for (const platform of fs.readdirSync(dir)) {
				const platformDir = path.join(dir, platform);
				if (!isDir(platformDir)) {
					continue;
				}

				for (const moduleName of fs.readdirSync(platformDir)) {
					const moduleDir = path.join(platformDir, moduleName);
					if (!isDir(moduleDir)) {
						continue;
					}

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
							// Do nothing
						}
					}
				}
			}
		}
		return results;
	});
}

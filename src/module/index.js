import fs from 'fs';
import path from 'path';
import options from '../options';
import TitaniumModule from './titanium-module';

import { arrayify, cacheSync, get, unique } from 'appcd-util';
import { expandPath } from 'appcd-path';
import { isDir } from 'appcd-fs';

import { getInstallPaths } from '../locations';

export { TitaniumModule };

/**
 * Detect Titanium modules
 *
 * @param {Boolean} [force] - When true ignore the cache
 * @returns {Object}
 */
export function getInstalledModules(force) {
	return cacheSync('titaniumlib:modules', force, () => {
		const results = {};

		for (let dir of getPaths()) {
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

/**
 * Returns a list of possible module install paths.
 *
 * @returns {Array.<String>}
 */
export function getPaths() {
	return unique([
		...arrayify(get(options, 'module.searchPaths'), true).map(p => expandPath(p)),
		...getInstallPaths().map(p => expandPath(p, 'modules'))
	]);
}

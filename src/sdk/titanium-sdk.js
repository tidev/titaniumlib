import fs from 'fs-extra';
import path from 'path';

import { expandPath } from 'appcd-path';
import { isDir, isFile } from 'appcd-fs';

/**
 * Titanium SDK information object.
 */
export default class TitaniumSDK {
	/**
	 * Checks if the specified directory contains a Titanium SDK, then parses the SDK's
	 * `manifest.json`.
	 *
	 * @param {String} dir - The directory to scan.
	 * @access public
	 */
	constructor(dir) {
		if (!dir || typeof dir !== 'string') {
			throw new TypeError('Expected Titanium SDK directory to be a non-empty string');
		}

		dir = expandPath(dir);
		if (!isDir(dir)) {
			throw new Error(`Specified Titanium SDK directory does not exist: ${dir}`);
		}

		this.name     = path.basename(dir);
		this.manifest = null;
		this.path     = dir;

		try {
			for (const [ filename, prop ] of [ [ 'manifest', 'manifest' ], [ 'package', 'packageJson' ] ]) {
				const file = path.join(dir, `${filename}.json`);
				if (!isFile(file)) {
					throw new Error(`No ${filename}.json found`);
				}

				try {
					const obj = this[prop] = fs.readJsonSync(file);
					if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
						throw new Error();
					}
				} catch (e) {
					throw new Error(`Directory does not contain a valid ${filename}.json`);
				}
			}
		} catch (err) {
			throw new Error(`Invalid Titanium SDK${err.message ? `: ${err.message}` : ''}`);
		}
	}
}

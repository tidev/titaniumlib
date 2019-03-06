import { expandPath } from 'appcd-path';
import { unique } from 'appcd-util';

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
 * Returns a list of Titanium SDK installation locations.
 *
 * @param {String} [defaultPath] - A path that represents the default and is the first path in the
 * list.
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

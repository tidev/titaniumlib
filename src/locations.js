import options from './options';

import { expandPath } from 'appcd-path';
import { arrayify, get, unique } from 'appcd-util';

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
 * @returns {Array.<String>}
 */
export function getInstallPaths() {
	return unique([
		...arrayify(get(options, 'searchPaths'), true).map(p => expandPath(p)),
		...(locations[process.env.TITANIUMLIB_PLATFORM || process.platform] || []).map(p => expandPath(p))
	]);
}

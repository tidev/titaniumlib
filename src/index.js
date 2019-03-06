// istanbul ignore if
if (!Error.prepareStackTrace) {
	require('source-map-support/register');
}

export { default as options } from './options';

import * as modules from './module';
import * as project from './project';
import * as sdk from './sdk';

import { getInstallPaths, locations } from './locations';

export {
	getInstallPaths,
	locations,
	modules,
	project,
	sdk
};

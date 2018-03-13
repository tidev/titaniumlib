/* istanbul ignore if */
if (!Error.prepareStackTrace) {
	require('source-map-support/register');
}

export { default as options } from './options';

import TitaniumSDK, * as sdk from './sdk';
import TitaniumModule, * as modules from './module';

export {
	modules,
	sdk,
	TitaniumSDK,
	TitaniumModule
};

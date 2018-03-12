/* istanbul ignore if */
if (!Error.prepareStackTrace) {
	require('source-map-support/register');
}

import TitaniumSDK, * as sdk from './sdk';
import TitaniumModule from './module';

export {
	sdk,
	TitaniumSDK,
	TitaniumModule
};

/**
 * A list of options that can be changed by the parent program.
 * @type {Object}
 */
const options = {
	network: {
		ca: null,
		proxy: null,
		strictSSL: null,
		caFile: null,
		certFile: null,
		keyFile: null
	},
	sdk: {
		searchPaths: [],
		urls: {
			branches: 'http://builds.appcelerator.com/mobile/branches.json',
			build:    'http://builds.appcelerator.com/mobile/<BRANCH>/<FILENAME>',
			builds:   'http://builds.appcelerator.com/mobile/<BRANCH>/index.json',
			releases: 'https://s3-us-west-2.amazonaws.com/appc-mobilesdk-server/releases.json'
		}
	},
	module: {
		searchPaths: []
	}
};

export default options;

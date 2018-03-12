import path from 'path';

import { TitaniumSDK } from '../dist/index';

const fixturesDir = path.join(__dirname, 'fixtures');
describe('TiSDK', () => {

	it('should error if directory is invalid', () => {
		expect(() => {
			new TitaniumSDK();
		}).to.throw(TypeError, 'Expected directory to be a valid string');

		expect(() => {
			new TitaniumSDK(123);
		}).to.throw(TypeError, 'Expected directory to be a valid string');

		expect(() => {
			new TitaniumSDK('');
		}).to.throw(TypeError, 'Expected directory to be a valid string');
	});

	it('should error if directory does not exist', () => {
		expect(() => {
			new TitaniumSDK(path.join(__dirname, 'doesnotexist'));
		}).to.throw(Error, 'Directory does not exist');
	});

	it('should error if directory has no manifest', () => {
		expect(() => {
			new TitaniumSDK(path.join(fixturesDir, 'empty'));
		}).to.throw(Error, 'Directory does not contain a valid manifest');
	});

	it('should error if manifest is not an object', () => {
		expect(() => {
			const x = new TitaniumSDK(path.join(fixturesDir, 'sdk', 'manifestisarray'));
			console.log(x);
		}).to.throw(Error, 'Directory does not contain a valid manifest');

		expect(() => {
			const x = new TitaniumSDK(path.join(fixturesDir, 'sdk', 'manifestisstring'));
			console.log(x);
		}).to.throw(Error, 'Directory does not contain a valid manifest');

		expect(() => {
			const x = new TitaniumSDK(path.join(fixturesDir, 'sdk', 'manifestisnumber'));
			console.log(x);
		}).to.throw(Error, 'Directory does not contain a valid manifest');
	});

	it('should read a good sdk', () => {
		const sdkPath = path.join(fixturesDir, 'sdk', 'good');
		const sdkInfo = new TitaniumSDK(sdkPath);
		expect(sdkInfo).to.deep.equal({
			name: 'good',
			manifest: {
				name: '7.0.2.v20180209105903',
				version: '7.0.2',
				moduleAPIVersion: { iphone: '2', android: '4', windows: '4' },
				timestamp: '2/9/2018 19:05',
				githash: '5ef0c56',
				platforms: [
					'iphone',
					'android'
				]
			},
			path: sdkPath
		});
	});
});

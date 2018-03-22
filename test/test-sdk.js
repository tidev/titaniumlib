import path from 'path';

import * as titaniumlib from '../dist/index';

const fixturesDir = path.join(__dirname, 'fixtures');
describe('sdk', () => {

	describe('TitaniumSDK', () => {
		it('should error if directory is invalid', () => {
			expect(() => {
				new titaniumlib.TitaniumSDK();
			}).to.throw(TypeError, 'Expected directory to be a valid string');

			expect(() => {
				new titaniumlib.TitaniumSDK(123);
			}).to.throw(TypeError, 'Expected directory to be a valid string');

			expect(() => {
				new titaniumlib.TitaniumSDK('');
			}).to.throw(TypeError, 'Expected directory to be a valid string');
		});

		it('should error if directory does not exist', () => {
			expect(() => {
				new titaniumlib.TitaniumSDK(path.join(__dirname, 'doesnotexist'));
			}).to.throw(Error, 'Directory does not exist');
		});

		it('should error if directory has no manifest', () => {
			expect(() => {
				new titaniumlib.TitaniumSDK(path.join(fixturesDir, 'empty'));
			}).to.throw(Error, 'Directory does not contain a valid manifest');
		});

		it('should error if manifest is not an object', () => {
			expect(() => {
				const x = new titaniumlib.TitaniumSDK(path.join(fixturesDir, 'sdk', 'manifestisarray'));
				console.log(x);
			}).to.throw(Error, 'Directory does not contain a valid manifest');

			expect(() => {
				const x = new titaniumlib.TitaniumSDK(path.join(fixturesDir, 'sdk', 'manifestisstring'));
				console.log(x);
			}).to.throw(Error, 'Directory does not contain a valid manifest');

			expect(() => {
				const x = new titaniumlib.TitaniumSDK(path.join(fixturesDir, 'sdk', 'manifestisnumber'));
				console.log(x);
			}).to.throw(Error, 'Directory does not contain a valid manifest');
		});

		it('should read a good sdk', () => {
			const sdkPath = path.join(fixturesDir, 'sdk', 'good');
			const sdkInfo = new titaniumlib.TitaniumSDK(sdkPath);
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

	describe('getSDKs()', () => {
		beforeEach(function () {
			this.searchPaths = titaniumlib.options.sdk.searchPaths;
		});

		afterEach(function () {
			titaniumlib.options.sdk.searchPaths = this.searchPaths;
		});

		it('should detect sdks', () => {
			titaniumlib.options.sdk.searchPaths = path.join(fixturesDir, 'sdk');
			const sdks = titaniumlib.sdk.getSDKs(true);
			expect(sdks).to.deep.equal([
				{
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
					path: path.join(fixturesDir, 'sdk', 'good')
				}
			]);
		});

		it('should detect sdks on the system', () => {
			const sdks = titaniumlib.sdk.getSDKs(true);
			expect(sdks).to.be.an('array');
		});
	});
});

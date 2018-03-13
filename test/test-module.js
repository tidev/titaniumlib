import path from 'path';

import * as titaniumlib from '../dist/index';

const fixturesDir = path.join(__dirname, 'fixtures');
describe('module', () => {
	describe('TitaniumModule', () => {
		it('should error if directory is invalid', () => {
			expect(() => {
				new titaniumlib.TitaniumModule();
			}).to.throw(TypeError, 'Expected directory to be a valid string');

			expect(() => {
				new titaniumlib.TitaniumModule(123);
			}).to.throw(TypeError, 'Expected directory to be a valid string');

			expect(() => {
				new titaniumlib.TitaniumModule('');
			}).to.throw(TypeError, 'Expected directory to be a valid string');
		});

		it('should error if directory does not exist', () => {
			expect(() => {
				new titaniumlib.TitaniumModule(path.join(__dirname, 'doesnotexist'));
			}).to.throw(Error, 'Directory does not exist');
		});

		it('should error if directory has no manifest', () => {
			expect(() => {
				new titaniumlib.TitaniumModule(path.join(fixturesDir, 'empty'));
			}).to.throw(Error, 'Directory does not contain a valid manifest');
		});

		it('should error if version is not valid semver', () => {
			expect(() => {
				new titaniumlib.TitaniumModule(path.join(fixturesDir, 'module', 'commonjs', 'invalid-version',  '1.0.0'));
			}).to.throw(Error, 'Version \'foo\' is not valid');

			expect(() => {
				new titaniumlib.TitaniumModule(path.join(fixturesDir, 'module', 'commonjs', 'invalid-version',  '1.0.1'));
			}).to.throw(Error, 'Version 1.0 is not valid');
		});

		it('should detect an Android module', () => {
			const modPath = path.join(fixturesDir, 'module', 'android', 'test-module',  '1.0.0');
			const modInfo = new titaniumlib.TitaniumModule(modPath);

			expect(modInfo).to.deep.equal({
				path: modPath,
				platform: 'android',
				version: '1.0.0',
				apiversion: '4',
				architectures: 'arm64-v8a armeabi-v7a x86',
				description: 'testModule',
				author: 'Your Name',
				license: 'Specify your license',
				copyright: 'Copyright (c) 2018 by Your Company',
				name: 'testModule',
				moduleid: 'com.test.module',
				guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
				minsdk: '7.2.0'
			});
		});

		it('should detect a commonjs module', () => {
			const modPath = path.join(fixturesDir, 'module', 'commonjs', 'test-module',  '1.0.0');
			const modInfo = new titaniumlib.TitaniumModule(modPath);

			expect(modInfo).to.deep.equal({
				path: modPath,
				platform: 'commonjs',
				version: '1.0.0',
				description: 'testModule',
				author: 'Your Name',
				license: 'Specify your license',
				copyright: 'Copyright (c) 2018 by Your Company',
				name: 'testModule',
				moduleid: 'com.test.module',
				guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
				minsdk: '7.2.0'
			});
		});

		it('should detect an iOS module', () => {
			const modPath = path.join(fixturesDir, 'module', 'ios', 'test-module', '1.0.0');
			const modInfo = new titaniumlib.TitaniumModule(modPath);

			expect(modInfo).to.deep.equal({
				path: modPath,
				platform: 'ios',
				version: '1.0.0',
				apiversion: '2',
				architectures: 'armv7 arm64 i386 x86_64',
				description: 'testModule',
				author: 'Your Name',
				license: 'Specify your license',
				copyright: 'Copyright (c) 2018 by Your Company',
				name: 'testModule',
				moduleid: 'com.test.module',
				guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
				minsdk: '7.2.0'
			});
		});

		it('should detect an iOS module where the path and manifest are iphone', () => {
			const modPath = path.join(fixturesDir, 'module', 'iphone', 'test-module', '1.0.0');
			const modInfo = new titaniumlib.TitaniumModule(modPath);

			expect(modInfo).to.deep.equal({
				path: modPath,
				platform: 'ios',
				version: '1.0.0',
				apiversion: '2',
				architectures: 'armv7 arm64 i386 x86_64',
				description: 'testModule',
				author: 'Your Name',
				license: 'Specify your license',
				copyright: 'Copyright (c) 2018 by Your Company',
				name: 'testModule',
				moduleid: 'com.test.module',
				guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
				minsdk: '7.2.0'
			});
		});

		it('should detect a Windows module', () => {
			const modPath = path.join(fixturesDir, 'module', 'windows', 'test-module', '1.0.0');
			const modInfo = new titaniumlib.TitaniumModule(modPath);

			expect(modInfo).to.deep.equal({
				path: modPath,
				platform: 'ios',
				version: '1.0.0',
				apiversion: '4',
				architectures: 'ARM x86',
				description: 'testModule',
				author: 'Your Name',
				license: 'Specify your license',
				copyright: 'Copyright (c) 2018 by Your Company',
				name: 'testModule',
				moduleid: 'com.test.module',
				guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
				minsdk: '7.2.0'
			});
		});
	});

	describe('getModules', () => {
		beforeEach(function () {
			this.searchPaths = titaniumlib.options.module.searchPaths;
		});

		afterEach(function () {
			titaniumlib.options.module.searchPaths = this.searchPaths;
		});

		it('should detect sdks', () => {
			titaniumlib.options.module.searchPaths = path.join(fixturesDir, 'module');
			const modules = titaniumlib.modules.getModules(true);
			expect(modules).to.deep.equal({
				android: {
					'com.test.module': {
						'1.0.0': {
							path: path.join(fixturesDir, 'module/android/test-module/1.0.0'),
							platform: 'android',
							version: '1.0.0',
							apiversion: '4',
							architectures: 'arm64-v8a armeabi-v7a x86',
							description: 'testModule',
							author: 'Your Name',
							license: 'Specify your license',
							copyright: 'Copyright (c) 2018 by Your Company',
							name: 'testModule',
							moduleid: 'com.test.module',
							guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
							minsdk: '7.2.0'
						}
					}
				},
				commonjs: {
					'com.test.module': {
						'1.0.0': {
							path: path.join(fixturesDir, 'module/commonjs/test-module/1.0.0'),
							platform: 'commonjs',
							version: '1.0.0',
							description: 'testModule',
							author: 'Your Name',
							license: 'Specify your license',
							copyright: 'Copyright (c) 2018 by Your Company',
							name: 'testModule',
							moduleid: 'com.test.module',
							guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
							minsdk: '7.2.0'
						}
					}
				},
				ios: {
					'com.test.module': {
						'1.0.0': {
							path: path.join(fixturesDir, 'module/ios/test-module/1.0.0'),
							platform: 'ios',
							version: '1.0.0',
							apiversion: '2',
							architectures: 'armv7 arm64 i386 x86_64',
							description: 'testModule',
							author: 'Your Name',
							license: 'Specify your license',
							copyright: 'Copyright (c) 2018 by Your Company',
							name: 'testModule',
							moduleid: 'com.test.module',
							guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
							minsdk: '7.2.0'
						}
					}
				},
				iphone: {
					'com.test.module':  {
						'1.0.0': {
							path: path.join(fixturesDir, 'module/iphone/test-module/1.0.0'),
							platform: 'ios',
							version: '1.0.0',
							apiversion: '2',
							architectures: 'armv7 arm64 i386 x86_64',
							description: 'testModule',
							author: 'Your Name',
							license: 'Specify your license',
							copyright: 'Copyright (c) 2018 by Your Company',
							name: 'testModule',
							moduleid: 'com.test.module',
							guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
							minsdk: '7.2.0'
						}
					}
				},
				windows: {
					'com.test.module': {
						'1.0.0': {
							path: path.join(fixturesDir, 'module/windows/test-module/1.0.0'),
							platform: 'ios',
							version: '1.0.0',
							apiversion: '4',
							architectures: 'ARM x86',
							description: 'testModule',
							author: 'Your Name',
							license: 'Specify your license',
							copyright: 'Copyright (c) 2018 by Your Company',
							name: 'testModule',
							moduleid: 'com.test.module',
							guid: 'dcaea77e-2860-42c1-a57b-319f81da10e0',
							minsdk: '7.2.0'
						}
					}
				}
			});
		});

		it('should detect system sdks', () => {
			const modules = titaniumlib.modules.getModules(true);
			expect(modules).to.be.a('object');
		});
	});
});

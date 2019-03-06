import path from 'path';
import { getInstallPaths } from '../dist/locations';

describe('getInstallPaths()', () => {
	it('should return array of install paths', () => {
		const paths = getInstallPaths();
		expect(paths).to.be.an('array');
		expect(paths).to.have.lengthOf.at.least(1);

		expect(paths[0]).to.be.a('string');
		expect(paths[0]).to.not.equal('');
	});

	it('should return install paths including default path', () => {
		const paths = getInstallPaths('/foo');
		expect(paths).to.be.an('array');
		expect(paths).to.have.lengthOf.at.least(2);
		expect(paths).to.include(path.resolve('/foo'));
	});

	it('should make sure paths are unique', () => {
		let paths = getInstallPaths();
		const len = paths.length;

		paths = getInstallPaths(paths[0]);
		expect(paths).to.have.lengthOf(len);
	});

	it('should error if default path is not a string', () => {
		expect(() => {
			getInstallPaths(123);
		}).to.throw(TypeError, 'Expected default install path to be a string');
	});
});

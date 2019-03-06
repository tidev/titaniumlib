import { extractZip } from '../dist/util';

describe('extractZip()', () => {
	it('should error if params is not an object', async () => {
		try {
			await extractZip(123);
		} catch (e) {
			expect(e).to.be.instanceOf(TypeError);
			expect(e.message).to.equal('Expected params to be an object');
			return;
		}

		throw new Error('Expected error');
	});

	it('should error if dest is not a string', async () => {
		try {
			await extractZip({ dest: 123 });
		} catch (e) {
			expect(e).to.be.instanceOf(TypeError);
			expect(e.message).to.equal('Expected destination directory to be a non-empty string');
			return;
		}

		throw new Error('Expected error');
	});

	it('should error if file is not a string', async () => {
		try {
			await extractZip({ dest: __dirname, file: 123 });
		} catch (e) {
			expect(e).to.be.instanceOf(TypeError);
			expect(e.message).to.equal('Expected zip file to be a non-empty string');
			return;
		}

		throw new Error('Expected error');
	});

	it('should error if file does not exist', async () => {
		try {
			await extractZip({ dest: __dirname, file: 'does_not_exist.zip' });
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			expect(e.message).to.equal('The specified zip file does not exist');
			return;
		}

		throw new Error('Expected error');
	});

	it('should error if file is invalid', async () => {
		try {
			await extractZip({ dest: __dirname, file: __dirname });
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			expect(e.message).to.equal('The specified zip file is not a file');
			return;
		}

		throw new Error('Expected error');
	});
});

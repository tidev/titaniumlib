import { extractZip } from '../dist/util';
import * as path from 'path';
import tmp from 'tmp';
import * as fs from 'fs-extra';

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

	it('should support symlinks', async () => {
		const tempDir = tmp.dirSync().name;
		await extractZip({ dest: tempDir, file: path.join(__dirname, 'fixtures', 'symlinks.zip') });

		const folder = path.join(tempDir, 'symlinks/folder');
		expect(fs.existsSync(folder)).to.equal(true);
		const folderStat = fs.statSync(folder);
		expect(folderStat.isDirectory()).to.equal(true);

		const file = path.join(tempDir, 'symlinks/folder/testfile.txt');
		expect(fs.existsSync(file)).to.equal(true);
		const fileStat = fs.statSync(file);
		expect(fileStat.isDirectory()).to.equal(false);
		expect(fileStat.isFile()).to.equal(true);

		const fileLink = path.join(tempDir, 'symlinks/link.txt');
		expect(fs.existsSync(fileLink)).to.equal(true);
		const fileLinkStat = fs.lstatSync(fileLink);
		expect(fileLinkStat.isSymbolicLink()).to.equal(true);

		const folderLink = path.join(tempDir, 'symlinks/folderlink');
		expect(fs.existsSync(folderLink)).to.equal(true);
		const folderLinkStat = fs.lstatSync(folderLink);
		expect(folderLinkStat.isSymbolicLink()).to.equal(true);
		const target = fs.readlinkSync(folderLink);
		expect(target).to.equal('folder/');
	});
});

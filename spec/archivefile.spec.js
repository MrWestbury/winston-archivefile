'use strict'
/**
 * ArchiveFile winston transport module jasmine-node test specification
 * 
 * Copyright Adam Eastbury 2015
 * Licence: MIT
 */

describe('winston-archivefile', function() {
	var winston = require('winston');
	var winstonArchiveFile = require('../lib/winston-archivefile.js');
	var fs = require('fs');
	var path = require('path');
	

	var testDir = path.join(__dirname, 'testData');

	var options = {
			filename: path.join(testDir, "/log1.log")
	};

	var createTestFolder = function() {
		if(!fs.existsSync(testDir)) {
			fs.mkdirSync(testDir);
		};
	}

	var decToOct = function(dec) {
		var num = dec;
		var ans = '';
		while(num > 0) {
			var quo = Math.floor(num/8);
			var rem = num % 8;
			num = quo;
			ans = '' + rem + ans;
		}
		return ans;
	};

	// TODO: make this async on the inside and sync on the outside.
	var emptyFolderRecursive = function(dir) {
	  if(!fs.existsSync(dir)) {
	    return;
		}

	  var list = fs.readdirSync(dir);
		for(var i = 0; i < list.length; i++) {
			var filename = path.join(dir, list[i]);
			var stat = fs.statSync(filename);
			if(list[i] === '.' || list[i] === '..') {
				// do nothing
			}
			if(stat.isDirectory()) {
				emptyFolderRecursive(filename);
			}
			else if(stat.isFile()) {
				try {
					fs.unlinkSync(filename);	
				}
				catch(ex) {
					console.log('Failed to delete file: ' + filename);
					console.log(ex);
				}
			}
		}

		var maxRetries = 10;
		var retries = 0;

		var tryRmDir = function() {
			try {
				fs.rmdirSync(dir);
			}
			catch(ex2) {
				if(retries < maxRetries) {
					retries++;
					setTimeout(tryRmDir, 100);	
				}
			}
		};
		tryRmDir();
		
	};

	var emptyTestFolder = function() {
		if(fs.existsSync(testDir)) {
	    emptyFolderRecursive(testDir);
		};
	};

	it('should create the test folder', function() {
		createTestFolder();
	});

	it('should add itself to the winston transports', function() {
		expect(winston.transports.ArchiveFile).toBeDefined();
	});

	it('should log a message to the current log file', function() {
		var finishFlag = false;

		runs(function() {
			var trans = new winston.transports.ArchiveFile(options);
			var logger = new winston.Logger({ transports: [ trans ] });
			logger.info('Test message');
			trans.close();
			finishFlag = true;
		});
		
		waitsFor(function() { return finishFlag; }, 'Timeout waiting for logger to finish', 1000 );


		runs(function() {
			expect(fs.existsSync(options.filename)).toBe(true);	
		});
	});

	it('should use a custom formatter, if provided', function() {
		//if(fs.existsSync(options.filename)) {
	//	fs.unlinkSync(options.filename);
		//}
		var fmtr = function(level, msg, meta) {
			return "LVL:" + level + '|MSG:' + msg + '|META:' + JSON.stringify(meta);
		};

		var opts = {
			filename: options.filename,
			archivedir: path.join(testDir, 'archive'),
			formatter: fmtr
		};

		var trans = new winston.transports.ArchiveFile(opts);
		var logger = new winston.Logger({ transports: [ trans ] });

		logger.log('info', 'Test1', {});
		trans.close();
	});

	it('should archive the current file at the change of date', function() {
		var timeoutFlag = false;

		runs(function() {
			var opts = {
				filename: options.filename,
				archivedir: path.join(testDir, 'archive')
			};

			var trans = new winston.transports.ArchiveFile(opts);
			var logger = new winston.Logger({ transports: [ trans ] });
			
			logger.info("First message");
			
			trans._currentLogDate = '2015-01-02'; // change the date internally
			logger.info("second message");

			trans.close();

			setTimeout(function() { 
				timeoutFlag = true;
			}, 1000);
		});
		
		waitsFor(function() {
			return timeoutFlag;
		}, 'Got bored of waiting for the I/O to finish', 1500);

		runs(function() {
			var expectPath = path.join(testDir, 'archive', 'log1.2015-01-02.log')
			expect(fs.existsSync(expectPath)).toBe(true);	
		});

	});

	it('should create the archive folder if it doesn\'t exist', function() {
		var opts = {
			filename: options.filename,
			archivedir: testDir + '/archive'
		};
		
		var trans = new winston.transports.ArchiveFile(opts);
		var logger = new winston.Logger({ transports: [ trans ] });

		expect(fs.existsSync(path.join(testDir, 'archive'))).toBe(true);

		trans.close();
		
	});

	it('should destroy the testData folder', function() {
		// wait to allow for I/O to finish
		setTimeout(function() {
			emptyTestFolder();	
		}, 1000);
		
	});

});
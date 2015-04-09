'use strict';
/**
 * ArchiveFile winston transport module
 * Log file name is maintained as a constant filename. Once the date changes the old 
 * log file is archived in the format {logFileBaseName}.{YYYYMMDD}.{logFileExtension}
 * 
 * Copyright Adam Eastbury 2015
 * Licence: MIT
 */

var path = require('path');
var util = require('util');
var winston = require('winston');
var fs = require('fs');

var getDateId = function(dateObj) {
	if(dateObj === undefined) {
		dateObj = new Date();	
	}
	return dateObj.getFullYear() + '-' + dateObj.getMonth() + '-' + dateObj.getDate(); 
};

var defaultFormatter = function(level, msg, meta) {
	var now = new Date();
	var output = now.toISOString();
	output += ' ' + level;
	output += ' ' + msg;
	
	if(typeof meta !== 'undefined') {
		output += ' ' + util.inspect(meta, { depth: 5 });	
	}

	return output;
};

var ArchiveFile = function(options) {
	options.filename = options.filename || 'winston.log';

	this._stream = null;
	this._currentLogDate = getDateId();
	this._buffer = [];
	this._ready = true;
	this._opening = false;
	this._filename = path.basename(options.filename);
	this._dirname = path.dirname(options.filename);
	this._archivedir = options.archivedir || this._dirname;
	this.formatter = options.formatter || defaultFormatter;
	this.EOL = options.EOL || '\n';

	var self = this;
	if(!fs.existsSync(this._archivedir)) {
		fs.mkdirSync(self._archivedir);
	}
};

ArchiveFile.prototype.name = 'ArchiveFile';

// Add to the transports winston knows about
util.inherits(ArchiveFile, winston.Transport);
winston.transports.ArchiveFile = ArchiveFile; // back compatability

// Log the entry
ArchiveFile.prototype.log = function(level, msg, meta, callback) {
	var self = this;
	var entry;
	if(JSON.stringify(meta) !== '{}') {
		entry = this.formatter(level, msg, meta) + this.EOL;
	}
	else {
		entry = this.formatter(level, msg) + this.EOL;
	}

	if(this._ready) {
		this._checkOpen(function(okToWrite) {
			if(okToWrite) {
				self._write(entry, callback);
			}
			else {
				self._buffer.push([entry, callback]);
			}
		});
	}
	else {
		this._buffer.push([entry, callback]);
	}
};

ArchiveFile.prototype._checkOpen = function(callback) {
	var self = this;
	var checkDate = getDateId();
	var filename = path.join(this._dirname, this._filename);
	if(this._ready && this._stream) {
		if(this._currentLogDate !== checkDate) {
			this._ready = false;
			callback(false); // return now so logging can continue while files are being sorted
			
			// swap files
			this._swapFiles(filename, function() {
				self._drainBuffer();
			});
		}
		else {
			// all good to go!
			callback(true);
		}
	}
	else {
		// not ready. check if we are already handling it. in which case do nothing
		if(!this._opening) {
			this._opening = true;
			callback(false); // return false to allow logging to continue into the buffer
			
			if(this._stream !== null) {
				this._stream.end(function() {
					this._swapFiles(filename, function() {
						self._drainBuffer();
					});
				});
			}
			else {
				// check if a log file exists.
				if(fs.existsSync(filename)) {
					// determine when it was created to see if we should append to the file, or archive it
					var stats = fs.statSync(filename);
					var createdDate = new Date(stats.ctime);
					var fileCheckDate = getDateId(createdDate);

					if(fileCheckDate === checkDate) {
						// it was created today, so append to it
						self._currentLogDate = fileCheckDate;
						self._openStream(filename, function() {
							self._drainBuffer();
						});
					}
					else {
						// file is old, so swap it out
						self._currentLogDate = fileCheckDate;
						self._swapFiles(filename, function() {
							self._drainBuffer();
						});
					}
				}
				else {
					// no existing file. so just set things up
					self._openStream(filename, function() {
						self._drainBuffer();
					});
				}
			}
		}
	}
};


// swap old file to archive and open a new log file
ArchiveFile.prototype._swapFiles = function(filename, callback) {
	var self = this;
	// only do swap if we have an open stream
	if(fs.existsSync(filename)) {
		var ext = path.extname(this._filename);
		var newName = path.basename(this._filename, ext) + '.' + this._currentLogDate + ext;
		newName = path.join(this._archivedir, newName);
		
		var fileCount = 0;
		while(fs.existsSync(newName)) {
			fileCount++;
			newName = path.basename(this._filename, ext) + '.' + this._currentLogDate + '.' + fileCount + ext;
			newName = path.join(this._archivedir, newName);
		}

		self._stream.end(function(err) {
			fs.rename(filename, newName, function(err) {
				if(err) {
					console.log('Error swapping file: ' + util.inspect(err, { depth: 5 }));
				}
				else {
					self._openStream(filename, callback);	
				}					
			});	
		});
		
	}
	else {
		self._openStream(filename, callback);
	}

};

// open the log file
ArchiveFile.prototype._openStream = function(filename, callback) {
	this._stream = fs.createWriteStream(filename, { flags: 'a', encoding: 'utf-8', fd: null });
	callback();
};

// write to the log file
ArchiveFile.prototype._write = function(entry, callback) {
	this._stream.write(entry);
	if(typeof callback === 'function') {
		callback();
	}
};

// replay the buffer back to the stream
ArchiveFile.prototype._drainBuffer = function() {
	var self = this;
	// replay the entries in the buffer
	this._buffer.forEach(function(entry) {
		self._write.apply(self, entry);
	});
	this._buffer = []; // empty the buffer

	// reset flags to nominal state
	this._ready = true;
	this._opening = false;
};

ArchiveFile.prototype.close = function() {
	if(this._stream) {
		this._ready = false;
		this._stream.end(function() {
			this._stream = null;
			this._ready = true;
		});
	}
}

module.exports = exports = ArchiveFile;
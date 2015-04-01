'use strict';

var winston = require('winston');
require('../lib/winston-archivefile.js');

var options = {
	filename: "C:\\temp\\archfile.log"
};

var trans = new winston.transports.ArchiveFile(options);
var logger = new winston.Logger({
	transports: [trans]
});


logger.log('info', 'first test');
trans._currentLogDate = '20150321';
logger.info('debug test');
logger.info('should go to new file');
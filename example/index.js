'use strict';

var winston = require('winston');
require('winston-archivefile');

var options = {
	filename: "logs/archfile.log",
	archivedir: "logs/archive"
};

var trans = new winston.transports.ArchiveFile(options);
var logger = new winston.Logger({
	transports: [trans]
});


logger.log('info', 'first test');
// This is a dirty hack to trick it into thinking the date has changed
trans._currentLogDate = '20150321';

logger.info('debug test');
logger.info('should go to new file');
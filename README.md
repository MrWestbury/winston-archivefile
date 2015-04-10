# winston-archivefile #

## Motivation ##
I needed a winston transport that rotated the log file by writing a constant filename and only add the date when the date rolls over.
e.g.

myLog.log <= Current log file being written to
myLog.2015-03-30.log <= Yesterdays log file

This is also my first github project of my own. So any feedback/help is more than welcome.

Most of the code is a copy of the DailyRotateFile transport code in the main winston repository
* [DailyRotateFile][1]
* [winston][0]

## Usage ##
```
var winston = require('winston');
var archiveFile = require('winston-archivefile');

var options = {
	filename: "myLog.log",
	archivedir: "archive"
};

var trans = new archiveFile(options);
var logger = new winston.Logger({
	transports: [trans]
});
```

## Options ##
ArchiveFile takes the following options:

* __filename__ : full path and filename of the log file default: ./winston.log
* __archivedir__ : path to archive old log files to: default: dir of filename
* __formatter__ : function to format the entry. signature function(level, msg, meta). default format: {timestamp} {level} {message} {meta}
* __EOL__ : End of line char sequence. default: \n

## Testing ##
Unit tests written using [jasmine-node][2]. 
Simply run 
```
jasmine-node spec
```

Unit tests are a bit thin on the ground and I must put more effort into them, I know. If anyone else wants to write them please feel free.

## LICENCE ##
MIT licence

[0]: https://github.com/flatiron/winston
[1]: https://github.com/winstonjs/winston/blob/master/lib/winston/transports/daily-rotate-file.js
[2]: https://github.com/mhevery/jasmine-node
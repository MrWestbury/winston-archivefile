#winston-archivefile#

##Motivation##
I needed a winston transport that rotated the log file by writing a constant filename and only add the date when the date rolls over.
e.g.

myLog.log <= Current log file being written to
myLog.2015-03-30.log <= Yesterdays log file

This is also my first github project of my own. So any feedback/help is more than welcome.

Most of the code is a copy of the DailyRotateFile transport code in the main winton repository
https://github.com/winstonjs/winston/blob/master/lib/winston/transports/daily-rotate-file.js
https://github.com/winstonjs/winston/

##Usage##
```
var winston = require('winston');
require('winston-archivefile');

winston.add(winston.transports.ArchiveFile, options);
```

##Options##
filename - full path and filename of the log file default: ./winston.log
archivedir - path to archive old log files to: default: dir of filename
formatter - function to format the entry. signature function(level, msg, meta, callback). default: {timestamp} {level} {message} {meta}

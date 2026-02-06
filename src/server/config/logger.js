/**
 * logger 세팅
 */
 const winston = require('winston');
 const winstonDaily = require('winston-daily-rotate-file');
 const { combine, timestamp, label, printf } = winston.format;
 // 로그파일 저장 경로
 const logDir = `${rootPath}/logs`;
 
 /*
  * Log Level
  * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
  */
 const logger = winston.createLogger({
   format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      label({ label: '' }),
      printf(({ level, message, label, timestamp }) => {
        return `${timestamp} [${level}] : ${message}`; 
      })
   ),
   transports: [
    
      new winstonDaily({
         level: 'info',
         datePattern: 'YYYY-MM-DD',
         dirname: logDir,
         filename: `%DATE%.log`,
         maxFiles: 30,
         zippedArchive: true,
      }),
      new winstonDaily({
         level: 'error',
         datePattern: 'YYYY-MM-DD',
         dirname: logDir + '/error',
         filename: `%DATE%.error.log`,
         maxFiles: 90,
         zippedArchive: true,
      }),
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'prd' ? 'info' : 'debug',
        handleExceptions: true,
        colorize: true
        })
   ],
   exceptionHandlers: [
      new winstonDaily({
         level: 'error',
         datePattern: 'YYYY-MM-DD',
         dirname: logDir,
         filename: `%DATE%.exception.log`,
         maxFiles: 90,
         zippedArchive: true,
      }),
   ],
});

module.exports = logger;
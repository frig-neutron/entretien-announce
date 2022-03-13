// Lifted from GCP documentation on logging w/ NodeJS
// https://cloud.google.com/logging/docs/setup/nodejs#using_winston

const winston = require("winston")
// Imports the Google Cloud client library for Winston
const {LoggingWinston} = require('@google-cloud/logging-winston');
const loggingWinston = new LoggingWinston();

// Create a Winston logger that streams to Stackdriver Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/winston_log"
export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    // Add Stackdriver Logging
    loggingWinston,
  ],
});
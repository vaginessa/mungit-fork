'use strict';

const Winston = require('winston');

const winston = module.exports = Winston.createLogger({
  format: Winston.format.simple(),
  transports: [new Winston.transports.Console()]
});

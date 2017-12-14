'use strict';

const winston = require('winston');
const sysinfo = require('./sysinfo');
const config = require('./config');
const raven = require('raven');
var client;

class BugTracker {
  constructor(subsystem) {
    if (!config.bugtracking) return;

    client = raven.config('https://1ccfef6f2d3e41a2b74372e22546731c:17bd0b6ba90a489c981365323b518419@sentry.io/244250').install();
    this.subsystem = subsystem;
    this.appVersion = 'unknown';
    this.userHash = 'unkown';
    this.appVersion = config.ungitDevVersion;
    winston.info(`BugTracker set version: ${this.appVersion}`);

    sysinfo.getUserHash()
      .then((userHash) => {
        this.userHash = userHash;
        winston.info('BugTracker set user hash: ' + userHash);
      });
  }
  notify(exception, clientName) {
    if (!config.bugtracking) return;

    let options = {
      level: 'error',
      tags: {
        version: this.appVersion,
        subsystem: this.subsystem,
        deployment: config.desktopMode ? 'desktop' : 'web'
      },
      extra: {
        user: { id: this.userHash }
      }
    }
    winston.warn('Sending exception to Sentry.io');
    client.captureException(JSON.stringify(exception, null, 4), options);
  }
}
module.exports = BugTracker;

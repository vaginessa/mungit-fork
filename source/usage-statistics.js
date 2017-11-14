const config = require('./config');
const cache = require('./utils/cache');
const sysinfo = require('./sysinfo');
const getmac = require('getmac');
const winston = require('winston');
const keenio = require('keen-js');

const _PROJECT_ID = '5a097593c9e77c0001099055';
const _WRITE_KEY = '60DB4CB04DEF91400BDEB9825D90407DEE4288E76EE59EA87EC4125FC7BCBD9DDC087DE9F6E910B3219EFF772F609F7D6F3CCCCC848DBB7C636136A484503D260BE723234D6D996859F4122297A62811F290CBA1D278D5B9062B57BAC92978EF';

class UsageStatistics {
  constructor() {
    if (!config.sendUsageStatistics) return;
    this.keen = new keenio({ projectId: _PROJECT_ID, writeKey: _WRITE_KEY });
    this.getDefaultDataKey = cache.registerFunc(() => {
      return sysinfo.getUserHash().then((hash) => {
          return { version: config.ungitDevVersion, userHash: hash };
        });
    });
  }

  _mergeDataWithDefaultData(data, callback) {
    cache.resolveFunc(this.getDefaultDataKey).then((defaultData) => {
      data = data || {};
      for(const k in defaultData)
        data[k] = defaultData[k];
      callback(data);
    });
  }

  addEvent(event, data, callback) {
    if (!config.sendUsageStatistics) return;
    this._mergeDataWithDefaultData(data, (data) => {
      winston.info(`Sending to keen.io: event ${JSON.stringify(data)}`);
      this.keen.addEvent(event, data, callback);
    });
  }
}

module.exports = new UsageStatistics();

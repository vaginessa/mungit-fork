const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 0 });
const md5 = require('blueimp-md5');
const funcMap = {}; // Will there ever be a use case where this is a cache with TTL? func registration with TTL?

/**
 * @function resolveFunc
 * @description Get cached result associated with the key or execute a function to get the result
 * @param {string} [key] - A key associated with a function to be executed.
 * @return {Promise} - Promise either resolved with cached result of the function or rejected with function not found.
 */
cache.resolveFunc = (key) => {
  let result = cache.get(key);
  if (result !== undefined) {
    return Promise.resolve(result);
  }
  result = funcMap[key];
  if (result === undefined) {
    return Promise.reject(new Error(`Cache entry ${key} not found`));
  }
  try {
    result = result.func();
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.resolve(result) // func is found, resolve, set with TTL and return result
    .then((r) => {
      cache.set(key, r, funcMap[key].ttl);
      return r;
    });
};

/**
 * @function registerFunc
 * @description Register a function to cache it's result. If same key exists, key is deregistered and registered again.
 * @param {ttl} [ttl=0] - ttl in seconds to be used for the cached result of function.
 * @param {string} [key=md5 of func] - Key to retrieve cached function result.
 * @param {function} [func] - Function to be executed to get the result.
 * @return {string} - key to retrieve cached function result.
 */
cache.registerFunc = (...args) => {
  const func = args.pop();
  const key = args.pop() || md5(func);
  const ttl = args.pop() || cache.options.stdTTL;

  if (typeof func !== 'function') {
    throw new Error('no function was passed in.');
  }

  if (isNaN(ttl) || ttl < 0) {
    throw new Error('ttl value is not valid.');
  }

  if (funcMap[key]) {
    cache.deregisterFunc(key);
  }

  funcMap[key] = {
    func: func,
    ttl: ttl,
  };

  return key;
};

/**
 * @function invalidateFunc
 * @description Immediately invalidate cached function result despite ttl value
 * @param {string} [key] - A key associated with a function to be executed.
 */
cache.invalidateFunc = (key) => {
  cache.del(key);
};

/**
 * @function deregisterFunc
 * @description Remove function registration and invalidate it's cached value.
 * @param {string} [key] - A key associated with a function to be executed.
 */
cache.deregisterFunc = (key) => {
  cache.invalidateFunc(key);
  delete funcMap[key];
};

module.exports = cache;

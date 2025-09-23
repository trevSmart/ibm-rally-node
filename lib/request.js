import axios from 'axios';
import _ from 'lodash';
import callbackify from './util/callbackify.js';

const generateError = (errorMessages) => {
  const e = new Error(errorMessages[0]);
  e.errors = errorMessages;
  return e;
}
export default class Request {
  constructor(options) {
    this.wsapiUrl = `${options.server}/slm/webservice/${options.apiVersion}`;

    // Create axios instance with default configuration
    const axiosConfig = {
      baseURL: this.wsapiUrl,
      timeout: 30000,
      withCredentials: true,
      ...options.requestOptions
    };

    this.httpRequest = axios.create(axiosConfig);
    this._hasKey = options.requestOptions &&
        options.requestOptions.headers &&
        options.requestOptions.headers.zsessionid;

    // Store cookies for session management
    this._cookies = {};
  }

  getCookies() {
    // Simple cookie management for compatibility
    return Object.keys(this._cookies).map(name => ({
      name,
      value: this._cookies[name],
      domain: new URL(this.wsapiUrl).hostname
    }));
  }

  auth() {
    return this.doRequest('get', {
      url: '/security/authorize'
    }).then((result) => {
      this._token = result.SecurityToken;
    });
  }

  doSecuredRequest(method, options, callback) {
    if (this._hasKey) {
      return this.doRequest(method, options, callback);
    }

    const doRequest = () => {
      const requestOptions = _.merge(
        {},
        options,
        {
          qs: {
            key: this._token
          }
        }
      );
      return this.doRequest(method, requestOptions);
    };

    let securedRequestPromise;
    if (this._token) {
      securedRequestPromise = doRequest();
    } else {
      securedRequestPromise = this.auth().then(doRequest);
    }
    callbackify(securedRequestPromise, callback);
    return securedRequestPromise;
  }

  doRequest(method, options, callback) {
    const doRequestPromise = new Promise((resolve, reject) => {
      const axiosOptions = {
        method: method.toUpperCase(),
        url: options.url,
        ...options
      };

      // Handle query parameters
      if (options.qs) {
        axiosOptions.params = options.qs;
      }

      // Handle JSON body
      if (options.json && typeof options.json === 'object') {
        axiosOptions.data = options.json;
        axiosOptions.headers = {
          'Content-Type': 'application/json',
          ...axiosOptions.headers
        };
      }

      // Remove axios-incompatible options
      delete axiosOptions.qs;
      delete axiosOptions.json;

      this.httpRequest(axiosOptions)
        .then(response => {
          const body = response.data;
          if (!body || !_.isObject(body)) {
            reject(generateError([`${options.url}: ${response.status}! body=${body}`]));
          } else {
            const result = _.values(body)[0];
            if (result && result.Errors && result.Errors.length) {
              reject(generateError(result.Errors));
            } else {
              resolve(result);
            }
          }
        })
        .catch(error => {
          if (error.response) {
            // Server responded with error status
            reject(generateError([`${options.url}: ${error.response.status}! ${error.response.statusText}`]));
          } else if (error.request) {
            // Network error
            reject(generateError([`Unable to connect to server: ${this.wsapiUrl}`]));
          } else {
            // Other error
            reject(generateError([error.message]));
          }
        });
    });

    callbackify(doRequestPromise, callback);
    return doRequestPromise;
  }

  get(options, callback) {
    return this.doRequest('get', options, callback);
  }

  post(options, callback) {
    return this.doSecuredRequest('post', options, callback);
  }

  put(options, callback) {
    return this.doSecuredRequest('put', options, callback);
  }

  del(options, callback) {
    return this.doSecuredRequest('delete', options, callback);
  }
}

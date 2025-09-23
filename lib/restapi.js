/**
 @module RestApi

 This module presents a higher-level API for interacting with resources
 in the Rally REST API.
 */
import _ from 'lodash';
import Request from './request';
import callbackify from './util/callbackify';
import refUtils from './util/ref';
import pkgInfo from '../package.json';

const defaultServer = 'https://rally1.rallydev.com';
const defaultApiVersion = 'v2.0';

function optionsToRequestOptions(options) {
  const qs = {};
  if (options.scope) {
    if (options.scope.project) {
      qs.project = refUtils.getRelative(options.scope.project);
      if (options.scope.hasOwnProperty('up')) {
        qs.projectScopeUp = options.scope.up;
      }
      if (options.scope.hasOwnProperty('down')) {
        qs.projectScopeDown = options.scope.down;
      }
    } else if (options.scope.workspace) {
      qs.workspace = refUtils.getRelative(options.scope.workspace);
    }
  }
  if (_.isArray(options.fetch)) {
    qs.fetch = options.fetch.join(',');
  } else if (_.isString(options.fetch)) {
    qs.fetch = options.fetch;
  }

  return {
    qs: qs
  };
}

function collectionPost(options, operation, callback) {
  const relativeRef = refUtils.getRelative(options.ref);
  if (!relativeRef) {
    const error = new Error(`Invalid ref: ${options.ref}`);
    error.errors = [`Invalid ref: ${options.ref}`];
    return Promise.reject(error);
  }
  
  return this.request.post(
    _.merge(
      {
        url: `${relativeRef}/${options.collection}/${operation}`,
        json: {CollectionItems: options.data}
      },
      options.requestOptions,
      optionsToRequestOptions(options)
    ),
    callback
  );
}

/**
 The Rally REST API client
 @constructor
 @param {object} options (optional) - optional config for the REST client
 - @member {string} server - server for the Rally API (default: https://rally1.rallydev.com)
 - @member {string} apiVersion - the Rally REST API version to use for requests (default: v2.0)
 - @member {string} userName||user - the username to use for requests (default: RALLY_USERNAME env variable) (@deprecated in favor of apiKey)
 - @member {string} password||pass - the password to use for requests (default: RALLY_PASSWORD env variable) (@deprecated in favor of apiKey)
 - @member {string} apiKey - the api key to use for requests (default: RALLY_API_KEY env variable)
 - @member {object} requestOptions - default options for the request: https://github.com/mikeal/request
 */
export default class RestApi {
  constructor(options) {
    options = _.merge({
      server: defaultServer,
      apiVersion: defaultApiVersion,
      requestOptions: {
        json: true,
        gzip: true,
        headers: {
          'X-RallyIntegrationLibrary': `${pkgInfo.description} v${pkgInfo.version}`,
          'X-RallyIntegrationName': pkgInfo.description,
          'X-RallyIntegrationVendor': 'Rally Software, Inc.',
          'X-RallyIntegrationVersion': pkgInfo.version
        }
      }
    }, options);

    const apiKey = (options && options.apiKey) || process.env.RALLY_API_KEY;
    if (apiKey) {
      options = _.merge({
        requestOptions: {
          headers: {
            zsessionid: apiKey
          },
          jar: false
        }
      }, options);
    } else {
      options = _.merge({
        requestOptions: {
          auth: {
            user: (options && (options.user || options.userName)) || process.env.RALLY_USERNAME,
            pass: (options && (options.pass || options.password)) || process.env.RALLY_PASSWORD,
            sendImmediately: false
          }
        }
      }, options);
    }

    this.request = new Request(options);
  }

  /**
   Create a new object
   @param {object} options - The create options (required)
   - @member {string} type - The type to be created, e.g. defect, hierarchicalrequirement, etc. (required)
   - @member {object} data - Key/value pairs of data with which to populate the new object (required)
   - @member {object} scope - the default scoping to use.  if not specified server default will be used.
   - @member {ref} scope.workspace - the workspace
   - @member {string/string[]} fetch - the fields to include on the returned record
   - @member {object} requestOptions - Additional options to be applied to the request: https://github.com/mikeal/request (optional)
   @param {function} callback - A callback to be called when the operation completes
   - @param {string[]} errors - Any errors which occurred
   - @param {object} result - the operation result
   @return {promise}
   */
  create(options, callback) {
    const postBody = {};
    postBody[options.type] = options.data;
    return this.request.post(
      _.merge(
        {
          url: `/${options.type}/create`,
          json: postBody
        },
        options.requestOptions,
        optionsToRequestOptions(options)
      ),
      callback
    );
  }

  /**
   Update an object
   @param {object} options - The update options (required)
   - @member {string} ref - The ref of the object to update, e.g. /defect/12345 (required)
   - @member {object} data - Key/value pairs of data with which to update object (required)
   - @member {object} scope - the default scoping to use.  if not specified server default will be used.
   - @member {ref} scope.workspace - the workspace
   - @member {string/string[]} fetch - the fields to include on the returned record
   - @member {object} requestOptions - Additional options to be applied to the request: https://github.com/mikeal/request (optional)
   @param {function} callback - A callback to be called when the operation completes
   - @param {string[]} errors - Any errors which occurred
   - @param {object} result - the operation result
   @return {promise}
   */
  update(options, callback) {
    const relativeRef = refUtils.getRelative(options.ref);
    if (!relativeRef) {
      const error = new Error(`Invalid ref: ${options.ref}`);
      error.errors = [`Invalid ref: ${options.ref}`];
      return Promise.reject(error);
    }
    
    const postBody = {};
    postBody[refUtils.getType(options.ref)] = options.data;
    return this.request.put(
      _.merge(
        {
          url: relativeRef,
          json: postBody
        },
        options.requestOptions,
        optionsToRequestOptions(options)
      ),
      callback
    );
  }

  /**
   Delete an object
   @param {object} options - The delete options (required)
   - @member {string} ref - The ref of the object to delete, e.g. /defect/1234
   - @member {object} scope - the default scoping to use.  if not specified server default will be used.
   - @member {ref} scope.workspace - the workspace
   - @member {object} requestOptions - Additional options to be applied to the request: https://github.com/mikeal/request (optional)
   @param {function} callback - A callback to be called when the operation completes
   - @param {string[]} errors - Any errors which occurred
   - @param {object} result - the operation result
   @return {promise}
   */
  del(options, callback) {
    const relativeRef = refUtils.getRelative(options.ref);
    if (!relativeRef) {
      const error = new Error(`Invalid ref: ${options.ref}`);
      error.errors = [`Invalid ref: ${options.ref}`];
      return Promise.reject(error);
    }
    
    return this.request.del(
      _.merge(
        {
          url: relativeRef
        },
        options.requestOptions,
        optionsToRequestOptions(options)
      ),
      callback
    );
  }

  /**
   Get an object
   @param {object} options - The get options (required)
   - @member {string} ref - The ref of the object to get, e.g. /defect/12345 (required)
   - @member {object} scope - the default scoping to use.  if not specified server default will be used.
   - @member {ref} scope.workspace - the workspace
   - @member {string/string[]} fetch - the fields to include on the returned record
   - @member {object} requestOptions - Additional options to be applied to the request: https://github.com/mikeal/request (optional)
   @param {function} callback - A callback to be called when the operation completes
   - @param {string[]} errors - Any errors which occurred
   - @param {object} result - the operation result
   @return {promise}
   */
  get(options, callback) {
    const relativeRef = refUtils.getRelative(options.ref);
    if (!relativeRef) {
      const error = new Error(`Invalid ref: ${options.ref}`);
      error.errors = [`Invalid ref: ${options.ref}`];
      return Promise.reject(error);
    }
    
    const getPromise = this.request.get(
      _.merge(
        {
          url: relativeRef
        },
        options.requestOptions,
        optionsToRequestOptions(options)
      )
    ).then(function(result) {
      return {
        Errors: (result && result.Errors) || [],
        Warnings: (result && result.Warnings) || [],
        Object: _.omit(result, ['Errors', 'Warnings'])
      };
    });

    callbackify(getPromise, callback);
    return getPromise;
  }

  /**
   Query for objects
   @param {object} options - The query options (required)
   - @member {string} ref - The ref of the collection to query, e.g. /defect/12345/tasks (required if type not specified)
   - @member {string} type - The type to query, e.g. defect, hierarchicalrequirement (required if ref not specified)
   - @member {object} scope - the default scoping to use.  if not specified server default will be used.
   - @member {ref} scope.workspace - the workspace
   - @member {ref} scope.project - the project, or null to include entire workspace
   - @member {ref} scope.up - true to include parent project data, false otherwise
   - @member {ref} scope.down - true to include child project data, false otherwise
   - @member {int} start - the 1 based start index
   - @member {int} pageSize - the page size, 1 - 200 (default=200)
   - @member {int} limit - the maximum number of records to return
   - @member {string/string[]} fetch - the fields to include on each returned record
   - @member {string/string[]} order - the order by which to sort the results
   - @member {string/query} query - a query to filter the result set
   - @member {object} requestOptions - Additional options to be applied to the request: https://github.com/mikeal/request (optional)
   @param {function} callback - A callback to be called when the operation completes
   - @param {string[]} errors - Any errors which occurred
   - @param {object} result - the operation result
   @return {promise}
   */
  query(options, callback) {
    const self = this;
    options = _.merge({
      start: 1,
      pageSize: 200
    }, options);

    // Performance optimization: Calculate optimal page size for better network efficiency
    let optimalPageSize = options.pageSize;
    if (options.limit !== undefined && options.limit > 0) {
      // Use smaller page size for small limits to reduce over-fetching
      optimalPageSize = Math.min(options.pageSize, options.limit);
    }

    const requestOptions = _.merge({
      url: refUtils.getRelative(options.ref) || `/${options.type}`,
      qs: {
        start: options.start,
        pagesize: optimalPageSize
      }
    }, options.requestOptions, optionsToRequestOptions(options));
    if (_.isArray(options.order)) {
      requestOptions.qs.order = options.order.join(',');
    } else if (_.isString(options.order)) {
      requestOptions.qs.order = options.order;
    }
    if (options.query) {
      requestOptions.qs.query = (options.query.toQueryString &&
          options.query.toQueryString()) || options.query;
    }

    let results = [];
    let totalFetched = 0;

    function loadRemainingPages(result) {
      const pageResults = result.Results;
      
      // Performance optimization: Use push.apply instead of concat to avoid array copying
      if (pageResults && pageResults.length > 0) {
        // Check if we need to limit the page results to respect the overall limit
        if (options.limit !== undefined) {
          const remainingNeeded = options.limit - totalFetched;
          if (remainingNeeded <= 0) {
            // Early exit: we already have enough results
            result.Results = results;
            result.StartIndex = options.start;
            result.PageSize = results.length;
            return result;
          }
          if (pageResults.length > remainingNeeded) {
            // Trim the page results to exactly what we need
            results.push.apply(results, pageResults.slice(0, remainingNeeded));
            totalFetched += remainingNeeded;
            
            // Early exit: we have exactly what we need
            result.Results = results;
            result.StartIndex = options.start;
            result.PageSize = results.length;
            return result;
          }
        }
        
        results.push.apply(results, pageResults);
        totalFetched += pageResults.length;
      }
      
      // Validate pagination parameters to prevent infinite loops
      const isValidPagination = 
        result.StartIndex && 
        typeof result.StartIndex === 'number' &&
        options.pageSize && 
        options.pageSize > 0 &&
        result.TotalResultCount &&
        typeof result.TotalResultCount === 'number';
      
      // Enhanced termination condition with early exit for limits
      const hasMoreData = result.StartIndex + options.pageSize <= result.TotalResultCount;
      const withinLimit = options.limit === undefined || totalFetched < options.limit;
      
      if (isValidPagination && hasMoreData && withinLimit) {
        // Performance optimization: Reuse base request options object
        const nextPageOptions = {
          url: requestOptions.url,
          qs: Object.assign({}, requestOptions.qs, {
            start: result.StartIndex + options.pageSize
          })
        };
        
        return self.request.get(nextPageOptions).then(loadRemainingPages);
      } else {
        // Final result preparation - no additional slicing needed due to early exits above
        result.Results = results;
        result.StartIndex = options.start;
        result.PageSize = results.length;
        return result;
      }
    }

    const queryPromise = this.request.get(requestOptions).then(loadRemainingPages);

    callbackify(queryPromise, callback);
    return queryPromise;
  }

  /**
   Query for objects with streaming/async iteration support for large datasets
   @param {object} options - The query options (same as query method)
   @param {function} onPageCallback - Called for each page of results: (pageResults, pageInfo) => boolean|Promise<boolean>
   - Return true to continue, false to stop iteration
   @param {function} callback - A callback to be called when the operation completes
   @return {promise}
   */
  queryStream(options, onPageCallback, callback) {
    const self = this;
    options = _.merge({
      start: 1,
      pageSize: 200
    }, options);

    // Performance optimization: Calculate optimal page size
    let optimalPageSize = options.pageSize;
    if (options.limit !== undefined && options.limit > 0) {
      optimalPageSize = Math.min(options.pageSize, options.limit);
    }

    const requestOptions = _.merge({
      url: refUtils.getRelative(options.ref) || `/${options.type}`,
      qs: {
        start: options.start,
        pagesize: optimalPageSize
      }
    }, options.requestOptions, optionsToRequestOptions(options));
    
    if (_.isArray(options.order)) {
      requestOptions.qs.order = options.order.join(',');
    } else if (_.isString(options.order)) {
      requestOptions.qs.order = options.order;
    }
    if (options.query) {
      requestOptions.qs.query = (options.query.toQueryString &&
          options.query.toQueryString()) || options.query;
    }

    let totalProcessed = 0;

    async function processPages(result) {
      const pageResults = result.Results;
      
      if (pageResults && pageResults.length > 0) {
        // Apply limit to page results if necessary
        let limitedPageResults = pageResults;
        if (options.limit !== undefined) {
          const remainingNeeded = options.limit - totalProcessed;
          if (remainingNeeded <= 0) {
            return { totalProcessed, completed: true };
          }
          if (pageResults.length > remainingNeeded) {
            limitedPageResults = pageResults.slice(0, remainingNeeded);
          }
        }

        // Call the page callback
        const pageInfo = {
          startIndex: result.StartIndex,
          pageSize: limitedPageResults.length,
          totalResultCount: result.TotalResultCount,
          totalProcessed: totalProcessed + limitedPageResults.length
        };

        const continueProcessing = await onPageCallback(limitedPageResults, pageInfo);
        totalProcessed += limitedPageResults.length;

        if (!continueProcessing) {
          return { totalProcessed, completed: false };
        }

        // Check if we've reached the limit
        if (options.limit !== undefined && totalProcessed >= options.limit) {
          return { totalProcessed, completed: true };
        }
      }
      
      // Check if there are more pages
      const isValidPagination = 
        result.StartIndex && 
        typeof result.StartIndex === 'number' &&
        options.pageSize && 
        options.pageSize > 0 &&
        result.TotalResultCount &&
        typeof result.TotalResultCount === 'number';
      
      const hasMoreData = result.StartIndex + options.pageSize <= result.TotalResultCount;
      const withinLimit = options.limit === undefined || totalProcessed < options.limit;
      
      if (isValidPagination && hasMoreData && withinLimit) {
        const nextPageOptions = {
          url: requestOptions.url,
          qs: Object.assign({}, requestOptions.qs, {
            start: result.StartIndex + options.pageSize
          })
        };
        
        const nextResult = await self.request.get(nextPageOptions);
        return processPages(nextResult);
      } else {
        return { totalProcessed, completed: true };
      }
    }

    const queryPromise = this.request.get(requestOptions).then(processPages);

    callbackify(queryPromise, callback);
    return queryPromise;
  }

  /**
   Query for objects with batch processing support
   @param {object} options - The query options (same as query method)
   @param {number} batchSize - Number of results to process in each batch (default: pageSize)
   @param {function} onBatchCallback - Called for each batch: (batchResults, batchInfo) => boolean|Promise<boolean>
   @param {function} callback - A callback to be called when the operation completes
   @return {promise}
   */
  queryBatch(options, batchSize, onBatchCallback, callback) {
    // Handle overloaded parameters
    if (typeof batchSize === 'function') {
      callback = onBatchCallback;
      onBatchCallback = batchSize;
      batchSize = options.pageSize || 200;
    }

    const batches = [];
    let currentBatch = [];
    let totalProcessed = 0;

    return this.queryStream(options, async (pageResults, pageInfo) => {
      // Add page results to current batch
      for (const result of pageResults) {
        currentBatch.push(result);
        
        // Process batch when it reaches the desired size
        if (currentBatch.length >= batchSize) {
          const batchInfo = {
            batchNumber: batches.length + 1,
            batchSize: currentBatch.length,
            totalProcessed: totalProcessed + currentBatch.length,
            totalResultCount: pageInfo.totalResultCount
          };

          const continueProcessing = await onBatchCallback([...currentBatch], batchInfo);
          batches.push(currentBatch);
          totalProcessed += currentBatch.length;
          currentBatch = [];

          if (!continueProcessing) {
            return false;
          }
        }
      }
      return true;
    }, callback).then(async (streamResult) => {
      // Process any remaining items in the final batch
      if (currentBatch.length > 0) {
        const batchInfo = {
          batchNumber: batches.length + 1,
          batchSize: currentBatch.length,
          totalProcessed: totalProcessed + currentBatch.length,
          totalResultCount: streamResult.totalProcessed
        };

        await onBatchCallback([...currentBatch], batchInfo);
        batches.push(currentBatch);
        totalProcessed += currentBatch.length;
      }

      return {
        totalProcessed,
        totalBatches: batches.length,
        completed: streamResult.completed
      };
    });
  }

  /**
   Adds items to a collection
   @param {object} options - The add options (required)
   - @member {string} ref - The ref of the collection to update, e.g. /user/12345 (required)
   - @member {string} collection - The name of the collection to update, e.g. 'TeamMemberships (required)
   - @member {object} data - [{_ref: objectRef}, {Name:"Joe"}], things to be added to the collection (required)
   - @member {string/string[]} fetch - the fields to include on the returned records
   - @member {object} scope - the default scoping to use.  if not specified server default will be used.
   - @member {ref} scope.workspace - the workspace
   - @member {object} requestOptions - Additional options to be applied to the request: https://github.com/mikeal/request (optional)
   @param {function} callback - A callback to be called when the operation completes
   - @param {string[]} errors - Any errors which occurred
   - @param {object} result - the operation result
   @return {promise}
   */
  add(options, callback) {
    return collectionPost.call(this, options, 'add', callback);
  }

  /**
   Remove items from a collection
   @param {object} options - The remove options (required)
   - @member {string} ref - The ref of the collection to update, e.g. /user/12345 (required)
   - @member {string} collection - The name of the collection to update, e.g. 'TeamMemberships (required)
   - @member {object} data - [{_ref: objectRef}], where the objectRefs are to be removed from the collection (required)
   - @member {string/string[]} fetch - the fields to include on the returned records
   - @member {object} scope - the default scoping to use.  if not specified server default will be used.
   - @member {ref} scope.workspace - the workspace
   - @member {object} requestOptions - Additional options to be applied to the request: https://github.com/mikeal/request (optional)
   @param {function} callback - A callback to be called when the operation completes
   - @param {string[]} errors - Any errors which occurred
   - @param {object} result - the operation result
   @return {promise}
   */
  remove(options, callback) {
    return collectionPost.call(this, options, 'remove', callback);
  }
}

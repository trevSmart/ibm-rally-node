import Request from '../lib/request';
import axios from 'axios';
import sinon from 'sinon';
import _ from 'lodash';

describe('Request', () => {
  let axiosStub, mockAxiosInstance;

  beforeEach(() => {
    // Stub axios.create to return a mock axios instance
    mockAxiosInstance = sinon.stub();
    mockAxiosInstance.get = sinon.stub();
    mockAxiosInstance.post = sinon.stub();
    mockAxiosInstance.put = sinon.stub();
    mockAxiosInstance.delete = sinon.stub();
    axiosStub = sinon.stub(axios, 'create').returns(mockAxiosInstance);
  });

  afterEach(() => {
    axiosStub.restore();
  });

  const createRequest = (options) => {
    return new Request(_.extend({
      server: 'https://rally1.rallydev.com',
      apiVersion: 'v2.0'
    }, options));
  };

  describe('#constructor', () => {

    it('should initialize the wsapi url correctly', () => {
      createRequest({
        server: 'http://www.acme.com',
        apiVersion: 'v3.0'
      }).wsapiUrl.should.eql('http://www.acme.com/slm/webservice/v3.0');
    });

    it('should pass request options through', () => {
      const requestOptions = {
        timeout: 5000,
        headers: { 'Custom-Header': 'value' }
      };
      createRequest({
        requestOptions: requestOptions
      });
      axiosStub.calledOnce.should.eql(true);
      const axiosConfig = axiosStub.firstCall.args[0];
      axiosConfig.timeout.should.eql(5000);
      axiosConfig.headers['Custom-Header'].should.eql('value');
    });
  });

  // TODO: Update these tests to work with axios instead of request library
  /*
  describe('#doRequest', () => {

    it('calls the correct request method', () => {
      const rr = createRequest();
      rr.doRequest('get', {foo: 'bar', url: '/someUrl'});
      get.calledOnce.should.eql(true);
      const args = get.firstCall.args[0];
      args.url.should.eql(rr.wsapiUrl + '/someUrl');
      args.foo.should.eql('bar');
    });

    it('calls back with an error', ( ) => {
      const rr = createRequest();
      const error = 'Error!';
      get.yieldsAsync(error);
      rr.doRequest('get', {url: '/someUrl'}, (err, body) => {
        err.errors.should.eql([error]);
        should.not.exist(body);

      });
    });

    it('rejects the promise with an error', async ( ) => {
      const rr = createRequest();
      const error = 'Error!';
      get.yieldsAsync(error);
      try {
        await rr.doRequest('get', {url: '/someUrl'});
        fail('expected promise to be rejected');
      } catch (err) {
        err.errors.should.eql([error]);

      }
    });

    it('calls back with error with an empty response', ( ) => {
        const rr = createRequest();
        get.yieldsAsync(null, null);
        rr.doRequest('get', {url: '/someUrl'}, (err, body) => {
          err.errors.should.eql(['Unable to connect to server: ' + rr.wsapiUrl]);
          should.not.exist(body);

        });
      });

    it('rejects the promise with an empty response', async ( ) => {
      const rr = createRequest();
      get.yieldsAsync(null, null);
      try {
        await rr.doRequest('get', {url: '/someUrl'});
        fail('expected promise to be rejected');
      } catch (err) {
        err.errors.should.eql(['Unable to connect to server: ' + rr.wsapiUrl]);

      }
    });

    it('calls back with error with a non json response', ( ) => {
      const rr = createRequest();
      get.yieldsAsync(null, {statusCode: 404}, 'not found!');
      rr.doRequest('get', {url: '/someUrl'}, (err, body) => {
        err.errors.should.eql(['/someUrl: 404! body=not found!']);
        should.not.exist(body);

      });
    });

    it('rejects the promise with a non json response', async ( ) => {
      const rr = createRequest();
      get.yieldsAsync(null, {statusCode: 404}, 'not found!');
      try {
        await rr.doRequest('get', {url: '/someUrl'});
        fail('expected promise to be rejected');
      } catch (err) {
        err.errors.should.eql(['/someUrl: 404! body=not found!']);

      }
    });

    it('rejects the promise with an error on a successful response', async ( ) => {
      const rr = createRequest();
      const error = 'Error!';
      const responseBody = {Result: {foo: 'bar', Errors: [error], Warnings: []}};
      get.yieldsAsync(null, {}, responseBody);
      try {
        await rr.doRequest('get', {url: '/someUrl'});
        fail('expected promise to be rejected');
      } catch (err) {
        err.errors.should.eql([error]);

      }
    });

    it('calls back with a success', ( ) => {
      const rr = createRequest();
      const responseBody = {Result: {foo: 'bar', Errors: [], Warnings: []}};
      get.yieldsAsync(null, {}, responseBody);
      rr.doRequest('get', {url: '/someUrl'}, (err, body) => {
        should.not.exist(err);
        body.should.eql(responseBody.Result);

      });
    });

    it('resolves the promise with a success', async ( ) => {
      const rr = createRequest();
      const responseBody = {Result: {foo: 'bar', Errors: [], Warnings: []}};
      get.yieldsAsync(null, {}, responseBody);
      const result = await rr.doRequest('get', {url: '/someUrl'});
      result.should.eql(responseBody.Result);

    });
  });

  describe('#doSecuredRequest', () => {

    it('does not request a security token if api key specified', () => {
      const rr = createRequest({
        requestOptions: {
          headers: {
            zsessionid: '!#$%!@#$@!#'
          }
        }
      });
      rr.doSecuredRequest('put', {foo: 'bar'});
      get.callCount.should.eql(0);
    });

    it('requests a security token', () => {
      const rr = createRequest();
      rr.doSecuredRequest('put', {foo: 'bar'});
      get.callCount.should.eql(1);
      get.firstCall.args[0].url.should.eql(rr.wsapiUrl + '/security/authorize');
    });

    it('passes along the security token to doRequest and calls back on success', ( ) => {
      const rr = createRequest();
      const token = 'a secret token';
      const putResponseBody = {OperationResult: {Errors: [], Warnings: [], Object: {}}};
      get.yieldsAsync(null, {}, {OperationResult: {Errors: [], Warnings: [], SecurityToken: token}});
      put.yieldsAsync(null, {}, putResponseBody);
      rr.doSecuredRequest('put', {foo: 'bar'}, (error, result) => {
        put.callCount.should.eql(1);
        put.firstCall.args[0].foo.should.eql('bar');
        put.firstCall.args[0].qs.key.should.eql(token);
        putResponseBody.OperationResult.should.eql(result);
        should.not.exist(error);

      });
    });

    it('passes along the security token to doRequest and resolves the promise on success', async ( ) => {
      const rr = createRequest();
      const token = 'a secret token';
      const putResponseBody = {OperationResult: {Errors: [], Warnings: [], Object: {}}};
      get.yieldsAsync(null, {}, {OperationResult: {Errors: [], Warnings: [], SecurityToken: token}});
      put.yieldsAsync(null, {}, putResponseBody);
      const result = await rr.doSecuredRequest('put', {foo: 'bar'});
      put.callCount.should.eql(1);
      put.firstCall.args[0].foo.should.eql('bar');
      put.firstCall.args[0].qs.key.should.eql(token);
      putResponseBody.OperationResult.should.eql(result);

    });

    it('calls back with error on security token failure', function( ) {
      const rr = createRequest();
      const error = 'Some key error';
      get.yieldsAsync(null, {}, {OperationResult: {Errors: [error]}});
      rr.doSecuredRequest('put', {}, function(err, result) {
        err.errors.should.eql([error]);
        should.not.exist(result);

      });
    });

    it('rejects the promise on security token failure', async ( ) => {
      const rr = createRequest();
      const error = 'Some key error';
      get.yieldsAsync(null, {}, {OperationResult: {Errors: [error]}});
      try {
        await rr.doSecuredRequest('put', {});
      } catch (err) {
        err.errors.should.eql([error]);

      }
    });

    it('rejects the promise on request failure', async ( ) => {
      const rr = createRequest();
      const error = 'An error';
      const putResponseBody = {OperationResult: {Errors: [error]}};
      get.yieldsAsync(null, {}, {OperationResult: {Errors: [], Warnings: [], SecurityToken: 'foo'}});
      put.yieldsAsync(null, {}, putResponseBody);
      try {
        await rr.doSecuredRequest('put', {});
        fail('promise should be rejected');
      } catch (err) {
        err.errors.should.eql([error]);
      }

    });

    it('calls back with error on request failure after getting security token', function( ) {
      const rr = createRequest();
      const error = 'An error';
      const putResponseBody = {OperationResult: {Errors: [error]}};
      get.yieldsAsync(null, {}, {OperationResult: {Errors: [], Warnings: [], SecurityToken: 'foo'}});
      put.yieldsAsync(null, {}, putResponseBody);
      rr.doSecuredRequest('put', {}, function(err, result) {
        err.errors.should.eql([error]);
        should.not.exist(result);

      });
    });
  });
  */

  describe('#httpMethods', () => {
    let doRequest, doSecuredRequest;

    beforeEach(() => {
      doRequest = sinon.spy(Request.prototype, 'doRequest');
      doSecuredRequest = sinon.spy(Request.prototype, 'doSecuredRequest');
    });

    afterEach(() => {
      doRequest.restore();
      doSecuredRequest.restore();
    });

    it('should get with callback', function() {
      const rr = createRequest();

      const options = {foo: 'bar'};
      const callback = sinon.stub();
      rr.get(options, callback);

      doRequest.callCount.should.eql(1);
      doRequest.firstCall.args.should.eql(['get', options, callback]);
      doSecuredRequest.callCount.should.eql(0);
    });

    it('should get with promise', () => {
      const rr = createRequest();

      const options = {foo: 'bar'};
      const returnValue = rr.get(options);

      doRequest.callCount.should.eql(1);
      doRequest.firstCall.args.should.eql(['get', options, undefined]);
      doRequest.firstCall.returnValue.should.be.exactly(returnValue);
      doSecuredRequest.callCount.should.eql(0);
    });

    it('should post with callback', function() {
      const rr = createRequest();

      const options = {foo: 'bar'};
      const callback = sinon.stub();
      rr.post(options, callback);

      doSecuredRequest.callCount.should.eql(1);
      doSecuredRequest.firstCall.args.should.eql(['post', options, callback]);
    });

    it('should post with promise', () => {
      const rr = createRequest();

      const options = {foo: 'bar'};
      const returnValue = rr.post(options);

      doSecuredRequest.callCount.should.eql(1);
      doSecuredRequest.firstCall.args.should.eql(['post', options, undefined]);
      doSecuredRequest.firstCall.returnValue.should.be.exactly(returnValue);
    });

    it('should put with callback', function() {
      const rr = createRequest();

      const options = {foo: 'bar'};
      const callback = sinon.stub();
      rr.put(options, callback);

      doSecuredRequest.callCount.should.eql(1);
      doSecuredRequest.firstCall.args.should.eql(['put', options, callback]);
    });

    it('should put with promise', () => {
      const rr = createRequest();

      const options = {foo: 'bar'};
      const returnValue = rr.put(options);

      doSecuredRequest.callCount.should.eql(1);
      doSecuredRequest.firstCall.args.should.eql(['put', options, undefined]);
      doSecuredRequest.firstCall.returnValue.should.be.exactly(returnValue);
    });

    it('should delete with callback', function() {
      const rr = createRequest();

      const options = {foo: 'bar'};
      const callback = sinon.stub();
      rr.del(options, callback);

      doSecuredRequest.callCount.should.eql(1);
      doSecuredRequest.firstCall.args.should.eql(['delete', options, callback]);
    });

    it('should delete with promise', () => {
      const rr = createRequest();

      const options = {foo: 'bar'};
      const returnValue = rr.del(options);

      doSecuredRequest.callCount.should.eql(1);
      doSecuredRequest.firstCall.args.should.eql(['delete', options, undefined]);
      doSecuredRequest.firstCall.returnValue.should.be.exactly(returnValue);
    });
  });
});

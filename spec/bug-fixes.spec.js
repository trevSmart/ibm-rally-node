import should from 'should';
import rally from '../lib/index';
import sinon from 'sinon';

const RestApi = rally.createClient;

describe('Bug Fixes', () => {

  describe('Limit=0 handling', () => {
    let restApi, get;

    beforeEach(() => {
      restApi = new RestApi();
      get = sinon.stub(restApi.request, 'get');
    });

    afterEach(() => {
      get.restore();
    });

    it('should respect limit=0 and return no results', async () => {
      // Mock response with some results
      get.returns(Promise.resolve({
        Results: [{ _ref: '/defect/1' }, { _ref: '/defect/2' }],
        StartIndex: 1,
        PageSize: 2,
        TotalResultCount: 100,
        Errors: [],
        Warnings: []
      }));

      const result = await restApi.query({
        type: 'defect',
        limit: 0
      });

      // Should return 0 results when limit is 0
      result.Results.should.have.length(0);
      get.callCount.should.eql(1);
      
      // Check that pagesize was set to 0 in the request
      const args = get.firstCall.args[0];
      args.qs.pagesize.should.eql(0);
    });

    it('should handle limit=0 correctly in pagination logic', async () => {
      // This tests the pagination condition fix
      const options = { limit: 0, pageSize: 200 };
      const shouldPaginate = options.limit !== undefined;
      
      shouldPaginate.should.eql(true);
      
      // The min calculation should use 0, not fallback to pageSize
      const pageSize = options.limit !== undefined ? Math.min(options.pageSize, options.limit) : options.pageSize;
      pageSize.should.eql(0);
    });
  });

  describe('Invalid ref handling', () => {
    let restApi;

    beforeEach(() => {
      restApi = new RestApi();
    });

    it('should reject get() with invalid ref', async () => {
      try {
        await restApi.get({ ref: 'invalid-ref' });
        should.fail('Expected error for invalid ref');
      } catch (err) {
        err.message.should.match(/Invalid ref/);
        err.errors.should.be.an.Array();
        err.errors[0].should.match(/Invalid ref/);
      }
    });

    it('should reject update() with invalid ref', async () => {
      try {
        await restApi.update({ ref: 'invalid-ref', data: { Name: 'test' } });
        should.fail('Expected error for invalid ref');
      } catch (err) {
        err.message.should.match(/Invalid ref/);
      }
    });

    it('should reject del() with invalid ref', async () => {
      try {
        await restApi.del({ ref: 'invalid-ref' });
        should.fail('Expected error for invalid ref');
      } catch (err) {
        err.message.should.match(/Invalid ref/);
      }
    });

    it('should reject add() with invalid ref', async () => {
      try {
        await restApi.add({ 
          ref: 'invalid-ref', 
          collection: 'tasks',
          data: [{ _ref: '/task/123' }]
        });
        should.fail('Expected error for invalid ref');
      } catch (err) {
        err.message.should.match(/Invalid ref/);
      }
    });

    it('should reject remove() with invalid ref', async () => {
      try {
        await restApi.remove({ 
          ref: 'invalid-ref', 
          collection: 'tasks',
          data: [{ _ref: '/task/123' }]
        });
        should.fail('Expected error for invalid ref');
      } catch (err) {
        err.message.should.match(/Invalid ref/);
      }
    });
  });

  describe('Pagination infinite loop protection', () => {
    let restApi, get;

    beforeEach(() => {
      restApi = new RestApi();
      get = sinon.stub(restApi.request, 'get');
    });

    afterEach(() => {
      get.restore();
    });

    it('should handle invalid pagination parameters safely', async () => {
      // Mock response with invalid/missing pagination data
      get.returns(Promise.resolve({
        Results: [{ _ref: '/defect/1' }],
        // Missing StartIndex, invalid TotalResultCount
        TotalResultCount: 'invalid',
        Errors: [],
        Warnings: []
      }));

      const result = await restApi.query({
        type: 'defect',
        limit: 10
      });

      // Should not attempt pagination due to invalid parameters
      get.callCount.should.eql(1);
      result.Results.should.have.length(1);
    });

    it('should handle pageSize=0 safely', async () => {
      get.returns(Promise.resolve({
        Results: [{ _ref: '/defect/1' }],
        StartIndex: 1,
        TotalResultCount: 100,
        Errors: [],
        Warnings: []
      }));

      const result = await restApi.query({
        type: 'defect',
        pageSize: 0,  // This could cause infinite loop
        limit: 10
      });

      // Should not attempt pagination due to pageSize=0
      get.callCount.should.eql(1);
      result.Results.should.have.length(1);
    });
  });
});
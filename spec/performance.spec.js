import should from 'should';
import sinon from 'sinon';
import RestApi from '../lib/restapi';

describe('RestApi Performance Optimizations', () => {
  let restApi, requestGetStub;

  beforeEach(() => {
    restApi = new RestApi();
    requestGetStub = sinon.stub(restApi.request, 'get');
  });

  afterEach(() => {
    if (requestGetStub && requestGetStub.restore) {
      requestGetStub.restore();
    }
  });

  describe('Memory optimization tests', () => {
    const generateMockResults = (start, count, total = 10000) => {
      const results = [];
      for (let i = start; i < start + count; i++) {
        results.push({
          _ref: `/defect/${i}`,
          FormattedID: `DE${i}`,
          Name: `Test Defect ${i}`
        });
      }
      return {
        Errors: [],
        Warnings: [],
        StartIndex: start,
        TotalResultCount: total,
        Results: results
      };
    };

    it('should handle large result sets efficiently with early exit', async () => {
      const pageSize = 100;
      const limit = 250;
      
      // Mock responses for multiple pages
      requestGetStub.onCall(0).resolves(generateMockResults(1, pageSize, 10000));
      requestGetStub.onCall(1).resolves(generateMockResults(101, pageSize, 10000));
      requestGetStub.onCall(2).resolves(generateMockResults(201, pageSize, 10000));

      const result = await restApi.query({
        type: 'defect',
        pageSize: pageSize,
        limit: limit,
        fetch: ['FormattedID', 'Name']
      });

      // Should call exactly 3 times (250 results / 100 per page = 2.5 pages)
      requestGetStub.callCount.should.eql(3);
      result.Results.should.have.length(limit);
      result.Results[0].FormattedID.should.eql('DE1');
      result.Results[249].FormattedID.should.eql('DE250');
    });

    it('should optimize page size for small limits', async () => {
      const limit = 5;
      
      requestGetStub.onCall(0).resolves(generateMockResults(1, limit, 1000));

      await restApi.query({
        type: 'defect',
        pageSize: 200,
        limit: limit,
        fetch: ['FormattedID']
      });

      // Should use the limit as page size for first request
      const firstCall = requestGetStub.getCall(0);
      firstCall.args[0].qs.pagesize.should.eql(limit);
    });

    it('should handle limit reached exactly at page boundary', async () => {
      const pageSize = 100;
      const limit = 200;
      
      requestGetStub.onCall(0).resolves(generateMockResults(1, pageSize, 10000));
      requestGetStub.onCall(1).resolves(generateMockResults(101, pageSize, 10000));

      const result = await restApi.query({
        type: 'defect',
        pageSize: pageSize,
        limit: limit
      });

      requestGetStub.callCount.should.eql(2);
      result.Results.should.have.length(limit);
    });
  });

  describe('queryStream method', () => {
    it('should stream results page by page', async () => {
      const pages = [];
      const pageInfos = [];
      
      requestGetStub.onCall(0).resolves({
        Errors: [], Warnings: [], StartIndex: 1, TotalResultCount: 250,
        Results: Array.from({length: 100}, (_, i) => ({_ref: `/defect/${i + 1}`}))
      });
      requestGetStub.onCall(1).resolves({
        Errors: [], Warnings: [], StartIndex: 101, TotalResultCount: 250,
        Results: Array.from({length: 100}, (_, i) => ({_ref: `/defect/${i + 101}`}))
      });
      requestGetStub.onCall(2).resolves({
        Errors: [], Warnings: [], StartIndex: 201, TotalResultCount: 250,
        Results: Array.from({length: 50}, (_, i) => ({_ref: `/defect/${i + 201}`}))
      });

      const result = await restApi.queryStream({
        type: 'defect',
        pageSize: 100
      }, (pageResults, pageInfo) => {
        pages.push(pageResults);
        pageInfos.push(pageInfo);
        return true; // continue
      });

      pages.should.have.length(3);
      pages[0].should.have.length(100);
      pages[1].should.have.length(100);
      pages[2].should.have.length(50);
      
      pageInfos[0].startIndex.should.eql(1);
      pageInfos[1].startIndex.should.eql(101);
      pageInfos[2].startIndex.should.eql(201);
      
      result.totalProcessed.should.eql(250);
      result.completed.should.eql(true);
    });

    it('should support early termination via callback return value', async () => {
      const pages = [];
      
      // Setup the stubs to resolve immediately
      const firstPageResponse = {
        Errors: [], Warnings: [], StartIndex: 1, TotalResultCount: 1000,
        Results: Array.from({length: 100}, (_, i) => ({_ref: `/defect/${i + 1}`}))
      };
      
      const secondPageResponse = {
        Errors: [], Warnings: [], StartIndex: 101, TotalResultCount: 1000,
        Results: Array.from({length: 100}, (_, i) => ({_ref: `/defect/${i + 101}`}))
      };

      const thirdPageResponse = {
        Errors: [], Warnings: [], StartIndex: 201, TotalResultCount: 1000,
        Results: Array.from({length: 100}, (_, i) => ({_ref: `/defect/${i + 201}`}))
      };

      requestGetStub.onCall(0).resolves(firstPageResponse);
      requestGetStub.onCall(1).resolves(secondPageResponse);
      requestGetStub.onCall(2).resolves(thirdPageResponse);

      const result = await restApi.queryStream({
        type: 'defect',
        pageSize: 100
      }, (pageResults, pageInfo) => {
        pages.push(pageResults);
        const shouldContinue = pages.length < 2; // stop after second page
        console.log(`Processing page ${pages.length}, totalProcessed will be: ${pageInfo.totalProcessed}, shouldContinue: ${shouldContinue}`);
        return shouldContinue;
      });

      console.log(`Final pages count: ${pages.length}`);
      console.log(`Request stub call count: ${requestGetStub.callCount}`);
      
      // Should process exactly 2 pages and stop
      pages.should.have.length(2);
      requestGetStub.callCount.should.eql(2); // No third request should be made
      result.totalProcessed.should.eql(200);
      result.completed.should.eql(false);
    });
  });

  describe('queryBatch method', () => {
    it('should process results in specified batch sizes', async () => {
      const batches = [];
      
      requestGetStub.onCall(0).resolves({
        Errors: [], Warnings: [], StartIndex: 1, TotalResultCount: 350,
        Results: Array.from({length: 200}, (_, i) => ({_ref: `/defect/${i + 1}`}))
      });
      requestGetStub.onCall(1).resolves({
        Errors: [], Warnings: [], StartIndex: 201, TotalResultCount: 350,
        Results: Array.from({length: 150}, (_, i) => ({_ref: `/defect/${i + 201}`}))
      });

      const result = await restApi.queryBatch({
        type: 'defect',
        pageSize: 200
      }, 75, (batchResults, batchInfo) => {
        batches.push({
          size: batchResults.length,
          batchNumber: batchInfo.batchNumber
        });
        return true;
      });

      // 350 items / 75 batch size = 4.67 batches (5 total)
      batches.should.have.length(5);
      batches[0].size.should.eql(75);
      batches[1].size.should.eql(75);
      batches[2].size.should.eql(75);
      batches[3].size.should.eql(75);
      batches[4].size.should.eql(50); // remainder
      
      result.totalProcessed.should.eql(350);
      result.totalBatches.should.eql(5);
    });
  });
});
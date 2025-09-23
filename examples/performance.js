// NOTE: Environment variable RALLY_API_KEY (or RALLY_USERNAME and RALLY_PASSWORD)
// must be defined to actually run this example

const rally = require('..');
const queryUtils = rally.util.query;
const restApi = rally();

// Example 1: Using queryStream for memory-efficient processing of large datasets
async function streamLargeDataset() {
    console.log('=== Streaming Large Dataset ===');
    
    let totalProcessed = 0;
    const startTime = Date.now();
    
    try {
        const result = await restApi.queryStream({
            type: 'hierarchicalrequirement',
            query: queryUtils.where('ScheduleState', '!=', 'Accepted'),
            fetch: ['FormattedID', 'Name', 'ScheduleState', 'PlanEstimate'],
            pageSize: 100
        }, (pageResults, pageInfo) => {
            totalProcessed += pageResults.length;
            
            console.log(`Page ${Math.ceil(pageInfo.totalProcessed / 100)}: ${pageResults.length} stories`);
            console.log(`Total processed: ${pageInfo.totalProcessed}/${pageInfo.totalResultCount}`);
            
            // Process each story in the page
            pageResults.forEach(story => {
                console.log(`  ${story.FormattedID}: ${story.Name} (${story.ScheduleState})`);
            });
            
            // Continue until we've processed 500 items or reached the end
            return pageInfo.totalProcessed < 500;
        });
        
        const duration = Date.now() - startTime;
        console.log(`\nStreaming completed: ${result.totalProcessed} items in ${duration}ms`);
        console.log(`Early termination: ${!result.completed}`);
        
    } catch (error) {
        console.error('Streaming failed:', error.message);
    }
}

// Example 2: Using queryBatch for processing results in fixed-size chunks
async function processBatches() {
    console.log('\n=== Batch Processing ===');
    
    try {
        const result = await restApi.queryBatch({
            type: 'defect',
            query: queryUtils.where('State', 'in', ['Open', 'In Progress']),
            fetch: ['FormattedID', 'Name', 'Severity', 'Owner'],
            pageSize: 200
        }, 25, (batchResults, batchInfo) => {
            console.log(`\nBatch ${batchInfo.batchNumber}: ${batchResults.length} defects`);
            
            // Analyze batch
            const severityCounts = {};
            batchResults.forEach(defect => {
                const severity = defect.Severity || 'None';
                severityCounts[severity] = (severityCounts[severity] || 0) + 1;
            });
            
            console.log('Severity distribution:', severityCounts);
            console.log(`Progress: ${batchInfo.totalProcessed}/${batchInfo.totalResultCount}`);
            
            // Continue processing (return false to stop early)
            return batchInfo.totalProcessed < 200;
        });
        
        console.log(`\nBatch processing completed: ${result.totalProcessed} items in ${result.totalBatches} batches`);
        
    } catch (error) {
        console.error('Batch processing failed:', error.message);
    }
}

// Example 3: Performance comparison between traditional query and streaming
async function performanceComparison() {
    console.log('\n=== Performance Comparison ===');
    
    const queryOptions = {
        type: 'hierarchicalrequirement',
        fetch: ['FormattedID', 'Name', 'ScheduleState'],
        limit: 500
    };
    
    // Traditional query approach
    console.log('Testing traditional query...');
    const traditionalStart = Date.now();
    const traditionalMemBefore = process.memoryUsage().heapUsed;
    
    try {
        const traditionalResult = await restApi.query(queryOptions);
        const traditionalDuration = Date.now() - traditionalStart;
        const traditionalMemAfter = process.memoryUsage().heapUsed;
        
        console.log(`Traditional: ${traditionalResult.Results.length} items in ${traditionalDuration}ms`);
        console.log(`Memory delta: ${Math.round((traditionalMemAfter - traditionalMemBefore) / 1024)}KB`);
        
    } catch (error) {
        console.error('Traditional query failed:', error.message);
    }
    
    // Streaming approach
    console.log('\nTesting streaming query...');
    const streamingStart = Date.now();
    const streamingMemBefore = process.memoryUsage().heapUsed;
    
    let streamedCount = 0;
    try {
        await restApi.queryStream(queryOptions, (pageResults, pageInfo) => {
            streamedCount += pageResults.length;
            return pageInfo.totalProcessed < 500;
        });
        
        const streamingDuration = Date.now() - streamingStart;
        const streamingMemAfter = process.memoryUsage().heapUsed;
        
        console.log(`Streaming: ${streamedCount} items in ${streamingDuration}ms`);
        console.log(`Memory delta: ${Math.round((streamingMemAfter - streamingMemBefore) / 1024)}KB`);
        
    } catch (error) {
        console.error('Streaming query failed:', error.message);
    }
}

// Run all examples
async function runExamples() {
    try {
        await streamLargeDataset();
        await processBatches();
        await performanceComparison();
        
        console.log('\n=== All examples completed ===');
        
    } catch (error) {
        console.error('Examples failed:', error.message, error.errors);
    }
}

runExamples();
# Customized Rally REST Toolkit for Node.js
> Note: This repository is a maintained fork of the original project at [RallyTools/rally-node](https://github.com/RallyTools/rally-node).


A Node.js client library for interacting with the Rally REST API.

## Installation

The toolkit is distributed as an npm module. You can install it from GitHub Packages or npm registry.

### From GitHub Packages (Recommended)

First, configure npm to use GitHub Packages for the `@trevsmart` scope:

```bash
# Create or update .npmrc file
echo "@trevsmart:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc
```

Then install the package:

```bash
npm install @trevsmart/rally-node
```

**Note**: You need a GitHub Personal Access Token with `read:packages` permission. Set it as `GITHUB_TOKEN` environment variable.

### From npm registry (Legacy)

```bash
npm install ibm-rally-node
```

## Quick Start

```javascript
import RestApi from '@trevsmart/rally-node';

// Create a client
const client = new RestApi({
  apiKey: 'your-api-key',
  server: 'https://rally1.rallydev.com'
});

// Query for stories
client.query({
  type: 'story',
  fetch: ['Name', 'FormattedID', 'State'],
  limit: 10
}, (err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Stories:', result.Results);
});
```

## API Reference

### Creating a Client

```javascript
import RestApi from '@trevsmart/rally-node';

const client = new RestApi({
  apiKey: 'your-api-key',        // Required: Your Rally API key
  server: 'https://rally1.rallydev.com', // Required: Rally server URL
  workspace: 'workspace-ref',    // Optional: Default workspace
  project: 'project-ref'         // Optional: Default project
});
```

### Querying Data

```javascript
// Query with callback
client.query({
  type: 'story',
  fetch: ['Name', 'FormattedID', 'State'],
  where: 'State = "In Progress"',
  limit: 10
}, (err, result) => {
  if (err) console.error(err);
  else console.log(result.Results);
});

// Query with promises
client.query({
  type: 'story',
  fetch: ['Name', 'FormattedID', 'State']
}).then(result => {
  console.log(result.Results);
}).catch(err => {
  console.error(err);
});
```

### Creating Records

```javascript
client.create({
  type: 'story',
  data: {
    Name: 'New Story',
    Project: '/project/123456789',
    Owner: '/user/987654321'
  }
}, (err, result) => {
  if (err) console.error(err);
  else console.log('Created:', result.Object);
});
```

### Updating Records

```javascript
client.update({
  type: 'story',
  ref: '/story/123456789',
  data: {
    State: 'Completed'
  }
}, (err, result) => {
  if (err) console.error(err);
  else console.log('Updated:', result.Object);
});
```

### Deleting Records

```javascript
client.del({
  type: 'story',
  ref: '/story/123456789'
}, (err, result) => {
  if (err) console.error(err);
  else console.log('Deleted');
});
```

## Examples

Check the `examples/` directory for more detailed usage examples:

- `crud.callback.js` - CRUD operations using callbacks
- `crud.promise.js` - CRUD operations using promises
- `query.callback.js` - Query operations using callbacks
- `query.promise.js` - Query operations using promises

## License

Copyright (c) Rally Software Development Corp. 2014 Distributed under the MIT License.

## Warranty

The Rally REST Toolkit for Node.js is available on an as-is basis.

## Support

Rally Software does not actively maintain or support this toolkit. If you have a question or problem, we recommend posting it to Stack Overflow: http://stackoverflow.com/questions/ask?tags=rally

## User Guide

Please view the [User Guide](https://github.com/RallyTools/rally-node/wiki/User-Guide) in the attached wiki.

## Performance Guide
For best practices and performance optimizations, see [PERFORMANCE.md](PERFORMANCE.md).

**New in v2.1.3+**: Enhanced query performance with memory optimizations, early exit logic, and new streaming methods (`queryStream`, `queryBatch`) for handling large datasets efficiently.

## Developer Guide

Please view the [Developer Guide](https://github.com/RallyTools/rally-node/wiki/Developer-Guide) in the attached wiki.

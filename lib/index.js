import RestApi from './restapi.js';
import { where } from './util/query.js';
import ref from './util/ref.js';

const createClient = options => new RestApi(options);

const restapi = createClient;
restapi.createClient = createClient;
restapi.debug = process.env.NODE_DEBUG && /rally/.test(process.env.NODE_DEBUG),
restapi.util = {
  query: { where },
  ref
};

export default restapi;

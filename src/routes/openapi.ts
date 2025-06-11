import { Hono } from 'hono';
import { apiDocs } from '../lib/apidocs';

const openapi = new Hono();

openapi.get('/', (c) => {
  return c.json(apiDocs);
});

export default openapi; 
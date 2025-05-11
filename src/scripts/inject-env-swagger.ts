import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import config from '@config/constants';

dotenv.config();

const swaggerPath = path.resolve(__dirname, '../swagger.json');
const swagger = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

// Inject dynamic server URLs
swagger.servers = [
  {
    url: `${config.hostname}/api`,
    description: 'REST API',
  },
  {
    url: `ws://${config.hostname.replace(/^https?:\/\//, '')}`,
    description: 'WebSocket API',
  },
];

// Write updated Swagger config
fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
console.log(`✅ Injected hostname ${config.hostname} into swagger.json`);

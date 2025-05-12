import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import config from '@config/constants';

dotenv.config();

//Use a base Swagger file (put this in /src or /swagger.json)
const sourcePath = path.resolve(__dirname, '../swagger.json');
const swagger = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

console.log('🔍 Environment variables at build time:');
console.log('MONGODB_URL:', config.mongo);
console.log('PORT:', config.port);
console.log('APP_SECRET:', config.secret);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('HOSTNAME:', config.hostname);

//Inject dynamic server URLs
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
const outputPath = path.resolve(__dirname, '../../dist/swagger.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(swagger, null, 2));

console.log(`✅ Injected hostname into ${outputPath}`);

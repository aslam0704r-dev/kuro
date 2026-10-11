import handler from '../../api/kuro.mjs';
import { invokeApi } from './invoke-api.mjs';
const chunks = []; for await (const chunk of process.stdin) chunks.push(chunk);
console.log(JSON.stringify(await invokeApi(handler, JSON.parse(Buffer.concat(chunks).toString()))));

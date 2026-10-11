import net from 'node:net';
import http from 'node:http';
import { once } from 'node:events';

// A test-only Upstash HTTP boundary backed by a real, dedicated local Redis server.
function parse(buffer, start = 0) {
  const end = buffer.indexOf('\r\n', start);
  if (end < 0) return null;
  const type = String.fromCharCode(buffer[start]), line = buffer.toString('utf8', start + 1, end);
  let offset = end + 2;
  if (type === '+' || type === '-') return { value: type === '-' ? new Error(line) : line, end: offset };
  if (type === ':') return { value: Number(line), end: offset };
  const size = Number(line);
  if (size === -1) return { value: null, end: offset };
  if (type === '$') {
    if (buffer.length < offset + size + 2) return null;
    return { value: buffer.toString('utf8', offset, offset + size), end: offset + size + 2 };
  }
  if (type === '*') {
    const value = [];
    for (let n = 0; n < size; n++) {
      const item = parse(buffer, offset); if (!item) return null;
      value.push(item.value); offset = item.end;
    }
    return { value, end: offset };
  }
  throw new Error('Unsupported test Redis response');
}

export function redisCommand(redisUrl, command) {
  const url = new URL(redisUrl);
  if (url.hostname !== '127.0.0.1' || url.username || url.password) throw new Error('Tests require a dedicated local Redis without credentials.');
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: url.hostname, port: Number(url.port || 6379) });
    let response = Buffer.alloc(0);
    socket.setTimeout(5000, () => socket.destroy(new Error('Test Redis timeout')));
    socket.on('error', reject);
    socket.on('connect', () => socket.write('*' + command.length + '\r\n' + command.map(value => {
      const text = String(value); return '$' + Buffer.byteLength(text) + '\r\n' + text + '\r\n';
    }).join('')));
    socket.on('data', chunk => {
      response = Buffer.concat([response, chunk]);
      const result = parse(response); if (!result) return;
      socket.destroy();
      if (result.value instanceof Error) reject(result.value); else resolve(result.value);
    });
  });
}

export async function redisFixture(redisUrl) {
  let failure = false, staleReads = false;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (failure) { res.writeHead(503); res.end('{"error":"Fixture unavailable"}'); return; }
    if (req.method !== 'POST' || req.url !== '/' || req.headers.authorization !== 'Bearer fixture-only-token') {
      res.writeHead(401); res.end('{"error":"Unauthorized"}'); return;
    }
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const command = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!Array.isArray(command)) throw new Error('Expected a Redis command array');
      // Model Upstash's documented replica lag for ordinary GET requests.
      if (staleReads && String(command[0]).toUpperCase() === 'GET') { res.end('{"result":null}'); return; }
      const result = await redisCommand(redisUrl, command);
      res.end(JSON.stringify({ result }));
    } catch (error) { res.end(JSON.stringify({ error: error.message })); }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return {
    url: 'http://127.0.0.1:' + server.address().port,
    setFailure(value) { failure = value; },
    setStaleReads(value) { staleReads = value; },
    command(command) { return redisCommand(redisUrl, command); },
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
  };
}

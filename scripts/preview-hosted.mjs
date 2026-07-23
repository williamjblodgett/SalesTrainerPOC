import http from "node:http";

import worker from "../dist/server/index.js";

const port = Number(process.env.SUADENCE_PREVIEW_PORT || 4178);

const server = http.createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }
  const webRequest = new Request(`http://127.0.0.1:${port}${request.url}`, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : body,
  });
  const webResponse = await worker.fetch(webRequest, {});
  response.writeHead(webResponse.status, Object.fromEntries(webResponse.headers));
  response.end(Buffer.from(await webResponse.arrayBuffer()));
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Suadence preview listening on http://127.0.0.1:${port}\n`);
});

import http from "http";

const EXPO_PORT = 22710;
const API_PORT = 8080;
const PROXY_PORT = 5000;

function proxyRequest(req, res, targetPort) {
  const options = {
    hostname: "localhost",
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${targetPort}` },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on("error", () => {
    res.writeHead(502);
    res.end("Service unavailable, please wait...");
  });

  req.pipe(proxy, { end: true });
}

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  if (url.startsWith("/api/") || url === "/api") {
    proxyRequest(req, res, API_PORT);
  } else {
    proxyRequest(req, res, EXPO_PORT);
  }
});

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`Preview proxy: :${PROXY_PORT} → /api/* → :${API_PORT}, /* → :${EXPO_PORT}`);
});

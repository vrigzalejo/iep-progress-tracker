import net from "node:net";

const listenPort = Number(process.env.LISTEN_PORT || 43147);
const tlsHost = process.env.TLS_UPSTREAM || "proxy";
const tlsPort = Number(process.env.TLS_PORT || 443);
const fallbackHost = process.env.HTTPS_HOST || "127.0.0.1:43147";
const httpMethods = /^(GET|POST|HEAD|PUT|PATCH|DELETE|OPTIONS|CONNECT|TRACE|PRI) /;

function httpRedirect(chunk) {
  const text = chunk.toString("latin1");
  const lines = text.split("\r\n");
  const path = lines[0]?.split(" ")[1] || "/";
  const hostLine = lines.find((line) => line.toLowerCase().startsWith("host:"));
  const host = hostLine?.slice(5).trim() || fallbackHost;
  const location = `https://${host}${path}`;
  return Buffer.from(
    `HTTP/1.1 308 Permanent Redirect\r\nLocation: ${location}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  );
}

const server = net.createServer((client) => {
  client.once("data", (chunk) => {
    const head = chunk.toString("utf8", 0, Math.min(chunk.length, 12));
    if (httpMethods.test(head)) {
      client.end(httpRedirect(chunk));
      return;
    }

    const upstream = net.connect(tlsPort, tlsHost, () => {
      upstream.write(chunk);
      client.pipe(upstream);
      upstream.pipe(client);
    });
    upstream.on("error", () => client.destroy());
    client.on("error", () => upstream.destroy());
  });
  client.on("error", () => {});
});

server.listen(listenPort, "0.0.0.0", () => {
  console.log(`HTTP→HTTPS mux on ${listenPort}, TLS upstream ${tlsHost}:${tlsPort}`);
});

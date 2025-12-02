const TCPServer = require("./tcp_server");

const server = new TCPServer(5050);

server.on("message", (msg, ip) => {
  console.log("[SERVER] Received:", msg, "from", ip);
});

server.start();

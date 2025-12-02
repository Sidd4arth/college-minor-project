// tcp_server.js

const net = require("net");
const EventEmitter = require("events");

class TCPServer extends EventEmitter {
  constructor(port) {
    super();
    this.port = port;
  }

  start() {
    this.server = net.createServer((socket) => {
      console.log(`[tcp_server] Connection from ${socket.remoteAddress}`);

      let buffer = "";

      socket.on("data", (chunk) => {
        buffer += chunk.toString();

        // Process lines separated by newline
        let index;
        while ((index = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 1);

          try {
            const msg = JSON.parse(line);
            this.emit("message", msg, socket.remoteAddress);

            // send ack
            const ack = JSON.stringify({ status: "ok" }) + "\n";
            socket.write(ack);

          } catch (err) {
            console.error("[tcp_server] Invalid JSON:", line);
          }
        }
      });

      socket.on("error", (err) => {
        console.error("[tcp_server] Socket error:", err.message);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`[tcp_server] Listening on TCP port ${this.port}`);
    });
  }
}

module.exports = TCPServer;

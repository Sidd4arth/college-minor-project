// tcp_client.js

const net = require("net");

class TCPClient {
  static send(peerIp, peerPort, jsonObj) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let connected = false;

      socket.setTimeout(4000);

      socket.connect(peerPort, peerIp, () => {
        connected = true;
        console.log(`[tcp_client] Connected to ${peerIp}:${peerPort}`);

        const payload = JSON.stringify(jsonObj) + "\n";
        socket.write(payload);
      });

      let buffer = "";

      socket.on("data", (data) => {
        buffer += data.toString();

        if (buffer.includes("\n")) {
          const line = buffer.trim();
          buffer = "";
          
          try {
            const msg = JSON.parse(line);
            resolve(msg);
          } catch (err) {
            console.error("[tcp_client] Invalid JSON:", line);
          }

          socket.end();
        }
      });

      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("TCP connection timeout"));
      });

      socket.on("error", reject);

      socket.on("close", () => {
        if (!connected) reject(new Error("Unable to connect to peer"));
      });
    });
  }
}

module.exports = TCPClient;

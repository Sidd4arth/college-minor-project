// run_backend.js
// const backend = require("./");

// print peers every 3s
// setInterval(() => {
//   console.log("PEERS:", backend.getPeers());
// }, 3000);

// send test message after 5s
// setTimeout(() => {
//   backend.sendMessage("peerID_here", "hello");
// }, 5000);
// run_backend.js
console.log("Starting backend...");

const path = require("path");
const fs = require("fs");

const Discovery = require("./backend/discovery");
const TCPServer = require("./backend/tcp_server");
const sendMessage = require("./backend/message_sender");

// Load my_info.json
const myInfoPath = path.join(__dirname, "backend", "my_info.json");

if (!fs.existsSync(myInfoPath)) {
  console.error("ERROR: backend/my_info.json not found!");
  process.exit(1);
}

const myInfo = JSON.parse(fs.readFileSync(myInfoPath, "utf8"));

// Start discovery
const discovery = new Discovery(myInfo);
discovery.start();

// Start TCP Server
const tcpServer = new TCPServer(myInfo.port);
tcpServer.start();

// Handle incoming messages
tcpServer.on("message", (msg, ip) => {
  console.log("[backend] Incoming from", ip, msg);
});

// Re-export so this file can mimic the real backend
module.exports = {
  getPeers: () => discovery.getPeers(),
  sendMessage: (peerId, text) => sendMessage(myInfo, peerId, text),
  onPeerUpdate: (fn) => discovery.events.on("peer-update", fn),
  myInfo
};

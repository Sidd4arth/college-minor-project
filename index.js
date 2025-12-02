// backend/index.js

const fs = require("fs");
const path = require("path");

const Discovery = require("./discovery");
const TCPServer = require("./tcp_server");
const sendMessage = require("./message_sender");

const MY_INFO_FILE = path.join(__dirname, "my_info.json");

// load my info
const myInfo = JSON.parse(fs.readFileSync(MY_INFO_FILE, "utf8"));

// start discovery
const discovery = new Discovery(myInfo);
discovery.start();

// start TCP server
const tcpServer = new TCPServer(myInfo.port);
tcpServer.start();

// handle incoming messages
tcpServer.on("message", (msg, ip) => {
  console.log("[backend] incoming from", ip, msg);
});

// API
module.exports = {
  getPeers: () => discovery.getPeers(),
  sendMessage: (peerId, text) => sendMessage(myInfo, peerId, text),
  onPeerUpdate: (fn) => discovery.events.on("peer-update", fn),
  myInfo
};

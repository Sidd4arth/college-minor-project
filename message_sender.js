// message_sender.js
const TCPClient = require("./tcp_client");
const fs = require("fs");
const path = require("path");

const PEERS_FILE = path.join(__dirname, "peers.json");

function loadPeers() {
  return JSON.parse(fs.readFileSync(PEERS_FILE, "utf8"));
}

async function sendMessage(myInfo, peerId, text) {
  const peers = loadPeers();
  const peer = peers[peerId];

  if (!peer) {
    console.log("[msg] Unknown peer:", peerId);
    return;
  }

  const msg = {
    type: "chat",
    from: myInfo.id,
    text,
    time: Date.now()
  };

  try {
    await TCPClient.send(peer.ip, peer.port, msg);
    console.log(`[msg] Sent to ${peerId}: "${text}"`);
  } catch (err) {
    console.log("[msg] Failed to send:", err.message);
  }
}

module.exports = sendMessage;

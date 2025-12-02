// run_backend.js
const backend = require("./");

// print peers every 3s
setInterval(() => {
  console.log("PEERS:", backend.getPeers());
}, 3000);

// send test message after 5s
setTimeout(() => {
  backend.sendMessage("peerID_here", "hello");
}, 5000);

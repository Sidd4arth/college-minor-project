// api.js
const { ipcMain, BrowserWindow } = require("electron");
const backend = require("./backend");

// -----------------------------------------------------
// GET PEERS
// -----------------------------------------------------
ipcMain.handle("get-peers", async () => {
  try {
    return backend.getPeers();
  } catch (err) {
    console.error("[api] get-peers error:", err);
    return {};
  }
});


// -----------------------------------------------------
// SEND MESSAGE (CORE FIX APPLIED)
// -----------------------------------------------------
// The UI passes (recipientsArray, text)
// Your message_sender.js expects: sendMessage(myInfo, recipientsArray, text)
ipcMain.handle("send-message", async (ev, recipients, text) => {
  try {
    return await backend.sendMessage(recipients, text);  // FIXED
  } catch (err) {
    console.error("[api] send-message error:", err);
    return { ok: false, error: err.message || String(err) };
  }
});


// -----------------------------------------------------
// FORWARD PEER UPDATES TO UI
// -----------------------------------------------------
if (typeof backend.onPeerUpdate === "function") {
  backend.onPeerUpdate((peers) => {
    BrowserWindow.getAllWindows().forEach(win => {
      try { win.webContents.send("peer-update", peers); } catch {}
    });
  });
}


// -----------------------------------------------------
// INCOMING MESSAGE FORWARDING
// -----------------------------------------------------
function forwardIncoming(msg) {
  BrowserWindow.getAllWindows().forEach(win => {
    try { win.webContents.send("incoming-message", msg); } catch {}
  });
}

// 1) backend.onIncomingMessage (ideal)
if (typeof backend.onIncomingMessage === "function") {
  backend.onIncomingMessage((msg) => forwardIncoming(msg));
}
// 2) If backend exposes tcpServer instance
else if (backend.tcpServer && typeof backend.tcpServer.on === "function") {
  backend.tcpServer.on("message", (msg, ip) => forwardIncoming(msg));
}
// 3) Last fallback (rare)
else if (backend.events && typeof backend.events.on === "function") {
  backend.events.on("message", (msg) => forwardIncoming(msg));
}
// No incoming messages available
else {
  console.warn("[api] No incoming-message hook found. Incoming chats won't appear.");
}


module.exports = {};

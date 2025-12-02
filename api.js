// api.js
const { ipcMain, BrowserWindow } = require("electron");
const backend = require("./backend"); // ./backend/index.js

// get-peers
ipcMain.handle("get-peers", async () => {
  try {
    return backend.getPeers();
  } catch (err) {
    console.error("[api] get-peers error:", err);
    return {};
  }
});

// send-message
ipcMain.handle("send-message", async (ev, recipients, text) => {
  if (!Array.isArray(recipients)) recipients = [recipients];
  try {
    for (const id of recipients) {
      // backend.sendMessage should be promise-aware
      await backend.sendMessage(id, text);
    }
    return { ok: true };
  } catch (err) {
    console.error("[api] send-message error:", err);
    return { ok: false, error: err.message || String(err) };
  }
});

// forward peer updates from backend -> renderer(s)
if (typeof backend.onPeerUpdate === "function") {
  backend.onPeerUpdate((peers) => {
    BrowserWindow.getAllWindows().forEach(win => {
      try { win.webContents.send("peer-update", peers); } catch {}
    });
  });
}

// forward incoming messages from backend -> renderer(s)
// Try several hooks (be defensive).
function forwardIncoming(msg) {
  BrowserWindow.getAllWindows().forEach(win => {
    try { win.webContents.send("incoming-message", msg); } catch {}
  });
}

// 1) If backend exposes a direct event emitter or function
if (typeof backend.onIncomingMessage === "function") {
  backend.onIncomingMessage((msg) => forwardIncoming(msg));
} else if (backend.tcpServer && typeof backend.tcpServer.on === "function") {
  // 2) If backend exported tcpServer instance
  backend.tcpServer.on("message", (msg /*, ip */) => forwardIncoming(msg));
} else {
  // 3) Last resort: if backend emits via events property (discovery had events)
  if (backend.events && typeof backend.events.on === "function") {
    backend.events.on("message", (msg) => forwardIncoming(msg));
  } else {
    console.warn("[api] No incoming-message hook found on backend; incoming messages will not be forwarded.");
  }
}

module.exports = {}; // nothing needed here

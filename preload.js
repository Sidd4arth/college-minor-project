// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("CampusAPI", {
  getPeers: () => ipcRenderer.invoke("get-peers"),
  sendMessage: (recipients, text) => ipcRenderer.invoke("send-message", recipients, text),
  onNewMessage: (fn) => {
    ipcRenderer.on("incoming-message", (event, msg) => fn(msg));
  },
  onPeerUpdate: (fn) => {
    ipcRenderer.on("peer-update", (event, peers) => fn(peers));
  }
});

// discovery.js (FIXED + IMPROVED)

const dgram = require("dgram");
const fs = require("fs");
const path = require("path");
const os = require("os");
const EventEmitter = require("events");

const UDP_PORT = process.env.UDP_PORT ? Number(process.env.UDP_PORT) : 41234;
const ANNOUNCE_INTERVAL_MS = 3000;
const OFFLINE_TIMEOUT_MS = 10000; // peer considered offline if no announce for 10s

const PEERS_FILE = path.join(__dirname, "peers.json");

// -----------------------------------------------------
// Helper: Ensure peers.json exists
// -----------------------------------------------------
if (!fs.existsSync(PEERS_FILE)) {
  fs.writeFileSync(PEERS_FILE, "{}");
}

// -----------------------------------------------------
// Auto-detect broadcast address for ANY LAN network
// -----------------------------------------------------
function getBroadcastAddress() {
  const interfaces = os.networkInterfaces();
  for (const ifname in interfaces) {
    for (const iface of interfaces[ifname]) {
      if (iface.family === "IPv4" && !iface.internal) {
        const parts = iface.address.split(".");
        parts[3] = "255";
        return parts.join(".");
      }
    }
  }
  return "255.255.255.255"; // fallback
}

const BROADCAST_ADDR = getBroadcastAddress();

// -----------------------------------------------------
// Discovery Class
// -----------------------------------------------------
class Discovery {
  constructor(myInfo) {
    if (!myInfo || !myInfo.id || !myInfo.port) {
      throw new Error("myInfo must include id and port");
    }

    this.myInfo = myInfo;
    this.events = new EventEmitter(); // notify backend when peers change

    this.sock = dgram.createSocket({ type: "udp4", reuseAddr: true });

    this.knownPeers = this._loadPeers();

    // Bind UDP listeners
    this.sock.on("message", (msg, rinfo) => this._onMessage(msg, rinfo));
    this.sock.on("error", (err) => {
      console.error("[discovery] UDP error:", err.message);
    });

    this._announceTimer = null;
    this._offlineCheckTimer = null;
  }

  // -----------------------------------------------------
  // Load peers.json safely
  // -----------------------------------------------------
  _loadPeers() {
    try {
      const raw = fs.readFileSync(PEERS_FILE, "utf8");
      return JSON.parse(raw || "{}");
    } catch (e) {
      console.error("[discovery] Failed to load peers.json", e.message);
      return {};
    }
  }

  _savePeers() {
    try {
      fs.writeFileSync(PEERS_FILE, JSON.stringify(this.knownPeers, null, 2));
    } catch (e) {
      console.error("[discovery] Failed to save peers.json", e.message);
    }
  }

  // -----------------------------------------------------
  // Start discovery service
  // -----------------------------------------------------
  start() {
    this.sock.bind(UDP_PORT, () => {
      this.sock.setBroadcast(true);
      console.log(`[discovery] Listening on UDP ${UDP_PORT}`);
      console.log(`[discovery] Broadcasting to ${BROADCAST_ADDR}`);
    });

    // Announce every few seconds
    this._announceTimer = setInterval(() => this._announce(), ANNOUNCE_INTERVAL_MS);

    // Check offline peers periodically
    this._offlineCheckTimer = setInterval(() => this._checkOfflinePeers(), 3000);

    // Send immediate announce on startup
    this._announce();
  }

  // -----------------------------------------------------
  // Stop discovery service
  // -----------------------------------------------------
  stop() {
    clearInterval(this._announceTimer);
    clearInterval(this._offlineCheckTimer);
    this.sock.close();
    console.log("[discovery] Stopped.");
  }

  // -----------------------------------------------------
  // Broadcast our presence
  // -----------------------------------------------------
  _announce() {
    const payload = {
      type: "announce",
      id: this.myInfo.id,
      name: this.myInfo.name || null,
      port: this.myInfo.port,
      timestamp: Date.now()
    };

    const buf = Buffer.from(JSON.stringify(payload));

    this.sock.send(buf, 0, buf.length, UDP_PORT, BROADCAST_ADDR, (err) => {
      if (err) {
            console.error("[discovery] Announce error:", err.message);
        } else {
            console.log("[discovery] Announced:", payload);
}
    });
  }

  // -----------------------------------------------------
  // Incoming UDP packets
  // -----------------------------------------------------
  _onMessage(msgBuf, rinfo) {
    let data;
    try {
      data = JSON.parse(msgBuf.toString());
    } catch {
      return; // ignore invalid packet
    }

    if (!data || data.type !== "announce") return;
    if (data.id === this.myInfo.id) return; // ignore self

    const peer = {
      id: data.id,
      name: data.name || `peer-${data.id.slice(0, 6)}`,
      ip: rinfo.address,
      port: data.port,
      lastSeen: Date.now(),
      status: "online"
    };

    const prev = this.knownPeers[peer.id];
    const changed = !prev ||
      prev.ip !== peer.ip ||
      prev.port !== peer.port ||
      prev.name !== peer.name ||
      prev.status === "offline";

    this.knownPeers[peer.id] = peer;
    this._savePeers();

    if (changed) {
      console.log(`[discovery] Peer updated: ${peer.name} ${peer.ip}:${peer.port}`);
      this.events.emit("peer-update", this.knownPeers);
    }
  }

  // -----------------------------------------------------
  // Detect offline peers
  // -----------------------------------------------------
  _checkOfflinePeers() {
    const now = Date.now();
    let changed = false;

    for (const id in this.knownPeers) {
      const peer = this.knownPeers[id];
      if (peer.status === "online" && now - peer.lastSeen > OFFLINE_TIMEOUT_MS) {
        peer.status = "offline";
        changed = true;
        console.log(`[discovery] Peer offline: ${peer.name}`);
      }
    }

    if (changed) {
      this._savePeers();
      this.events.emit("peer-update", this.knownPeers);
    }
  }

  // -----------------------------------------------------
  // External API
  // -----------------------------------------------------
  getPeers() {
    return this.knownPeers;
  }
}

module.exports = Discovery;


// DEBUG RUN
if (require.main === module) {
  console.log("Starting discovery in standalone mode...");
  const myInfo = { id: "test456", name: "Tester2", port: 5051 };

  const d = new Discovery(myInfo);
  d.start();
}

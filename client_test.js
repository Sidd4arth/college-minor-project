const TCPClient = require("./tcp_client");

TCPClient.send("127.0.0.1", 5050, {
  from: "tester-client",
  text: "Hello Server!"
})
.then(res => console.log("[CLIENT] Response:", res))
.catch(err => console.error("[CLIENT] Error:", err));

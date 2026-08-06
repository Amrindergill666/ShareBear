const dgram = require("dgram");

const server = dgram.createSocket("udp4");

server.on("message", (msg, rinfo) => {
    console.log(`Received from ${rinfo.address}: ${msg}`);
});

server.bind(5000, () => {
    console.log("Listening...");
});
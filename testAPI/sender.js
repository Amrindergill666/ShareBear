const dgram = require("dgram");

const client = dgram.createSocket("udp4");

client.bind(() => {
    client.setBroadcast(true);

    const message = Buffer.from("Hello Everyone!");

    client.send(message, 5000, "255.255.255.255", () => {
        console.log("Broadcast sent");
        client.close();
    });
});
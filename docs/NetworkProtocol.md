# ShareBear - Networking Protocol v1

> **Version:** 1.0\
> **Status:** Draft (MVP)\
> **Goal:** Define a stable, versioned LAN protocol for Android (React
> Native + Kotlin) with future support for Windows, macOS, Linux and
> iOS.

------------------------------------------------------------------------

# Objectives

-   Zero configuration on the same LAN
-   Fast discovery
-   Reliable file transfer
-   Versioned protocol for future compatibility
-   Easy debugging
-   Extensible for encryption, pairing, and resumable transfers

------------------------------------------------------------------------

# High-Level Architecture

``` text
+------------------------+
| React Native UI        |
+-----------+------------+
            |
            v
+------------------------+
| Zustand + MMKV         |
+-----------+------------+
            |
            v
+------------------------+
| Kotlin Native Module   |
+-----------+------------+
            |
    +-------+--------+
    |                |
 UDP Discovery   HTTP Control/API
                     |
                     v
             HTTP File Streaming
```

------------------------------------------------------------------------

# Networking Stack

  ------------------------------------------------------------------------
  Purpose                Technology                    Reason
  ---------------------- ----------------------------- -------------------
  Discovery              UDP Broadcast                 Fast LAN discovery

  Control                HTTP/JSON                     Simple, debuggable

  File Transfer          HTTP Streaming (TCP)          Reliable,
                                                       resumable, avoids
                                                       custom TCP protocol
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# Default Ports

  Service     Protocol   Port
  ----------- ---------- -------
  Discovery   UDP        53317
  HTTP API    HTTP       53318

------------------------------------------------------------------------

# Complete Flow

``` text
Device A
   |
   | UDP DISCOVER
   |
Device B
   |
DISCOVER_RESPONSE
   |
GET /info
   |
POST /transfer/request
   |
Accept / Reject
   |
POST /transfer/{id}/file
   |
Streaming Upload
   |
Transfer Complete
```

------------------------------------------------------------------------

# Message Envelope

Every JSON message contains:

``` json
{
  "version": 1,
  "type": "DISCOVER",
  "timestamp": 1754460000
}
```

------------------------------------------------------------------------

# Discovery

## Broadcast

``` json
{
  "version": 1,
  "type": "DISCOVER",
  "deviceId": "abc123",
  "deviceName": "Gill's Pixel",
  "platform": "android",
  "httpPort": 53318
}
```

## Response

``` json
{
  "version": 1,
  "type": "DISCOVER_RESPONSE",
  "deviceId": "xyz789",
  "deviceName": "MacBook Pro",
  "platform": "macos",
  "httpPort": 53318
}
```

------------------------------------------------------------------------

# HTTP API

## GET /info

Returns device capabilities.

``` json
{
  "version":1,
  "deviceId":"xyz789",
  "deviceName":"MacBook",
  "platform":"macos",
  "supportsEncryption":false,
  "supportsResume":false,
  "maxChunkSize":65536
}
```

## POST /transfer/request

``` json
{
  "senderId":"abc123",
  "senderName":"Gill",
  "files":[
    {
      "id":"f1",
      "name":"photo.jpg",
      "size":245678,
      "mime":"image/jpeg",
      "lastModified":1754460000
    }
  ],
  "totalFiles":1,
  "totalSize":245678
}
```

### Success

``` json
{
  "accepted":true,
  "transferId":"TR-001"
}
```

### Reject

``` json
{
  "accepted":false,
  "reason":"USER_DECLINED"
}
```

------------------------------------------------------------------------

## POST /transfer/{transferId}/file

Headers

``` text
Content-Type: application/octet-stream
X-File-Id: f1
X-File-Name: photo.jpg
X-File-Size: 245678
```

Body

Binary stream.

------------------------------------------------------------------------

## POST /transfer/{transferId}/complete

``` json
{
  "transferId":"TR-001"
}
```

------------------------------------------------------------------------

## POST /transfer/{transferId}/cancel

``` json
{
  "transferId":"TR-001",
  "reason":"USER_CANCELLED"
}
```

------------------------------------------------------------------------

# Packet Types

  Type                Purpose
  ------------------- -------------------
  DISCOVER            Find devices
  DISCOVER_RESPONSE   Discovery reply
  TRANSFER_REQUEST    Ask permission
  TRANSFER_ACCEPT     Receiver accepted
  TRANSFER_REJECT     Receiver rejected
  FILE_UPLOAD         Stream file
  TRANSFER_COMPLETE   Finished
  TRANSFER_CANCEL     Cancel transfer
  ERROR               Failure

------------------------------------------------------------------------

# Error Codes

  Code   Meaning
  ------ ---------------------
  100    Unknown request
  101    Unsupported version
  102    Transfer not found
  103    Permission denied
  104    Disk full
  105    File too large
  106    Timeout
  107    Connection closed

------------------------------------------------------------------------

# Security (v1)

-   Local network only
-   Random persistent Device ID
-   Manual receiver approval
-   Reject duplicate transfer IDs
-   Ignore unsupported protocol versions

### Planned for v2

-   TLS
-   End-to-end encryption
-   QR pairing
-   Device trust list
-   Resume interrupted transfers
-   Compression negotiation

------------------------------------------------------------------------

# Recommended Project Structure

``` text
src/
├── protocol/
│   ├── constants.ts
│   ├── packetTypes.ts
│   ├── ports.ts
│   ├── errors.ts
│   ├── validators.ts
│   └── schemas.ts
│
├── discovery/
│   ├── UdpBroadcaster.ts
│   ├── UdpListener.ts
│   └── DeviceRegistry.ts
│
├── transfer/
│   ├── HttpServer.ts
│   ├── TransferManager.ts
│   ├── StreamUploader.ts
│   ├── StreamReceiver.ts
│   └── ProgressTracker.ts
│
├── native/
│   └── KotlinNetworkingModule.kt
│
├── store/
└── storage/
```

------------------------------------------------------------------------

# Implementation Roadmap

-   Phase 1: UDP discovery
-   Phase 2: HTTP API
-   Phase 3: Approval workflow
-   Phase 4: HTTP streaming
-   Phase 5: Progress tracking
-   Phase 6: Background transfers
-   Phase 7: Encryption & pairing (v2)

------------------------------------------------------------------------

# Design Principles

1.  Version every request.
2.  Keep the protocol stateless where possible.
3.  Use JSON for control messages.
4.  Stream binary data over HTTP.
5.  Validate all incoming payloads.
6.  Keep protocol backward compatible.
7.  Separate networking from UI logic.

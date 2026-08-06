# ShareBear Architecture

## Overview

ShareBear is a LocalSend-inspired offline file sharing application built
with **React Native (Android first)** and a **native Kotlin networking
engine**. The UI remains completely separated from networking logic to
maximize maintainability, performance, and future platform support.

------------------------------------------------------------------------

# Technology Stack

  Layer                  Technology
  ---------------------- ----------------------------
  Mobile UI              React Native CLI
  Language               TypeScript
  Native Layer           Kotlin
  State Management       Zustand
  Local Storage          MMKV
  Navigation             React Navigation
  File Access            react-native-fs
  Networking             UDP + TCP
  Protocol               Custom Versioned Protocol
  Background Transfers   Android Foreground Service

------------------------------------------------------------------------

# High-Level Architecture

``` text
                     ShareBear

                React Native UI
                       │
            Presentation Layer
                       │
                Zustand Store
                       │
             Application Layer
                       │
     ┌─────────────────┴─────────────────┐
     │                                   │
Transfer Manager                 Device Manager
     │                                   │
Session Manager              Discovery Manager
     └─────────────────┬─────────────────┘
                       │
                Repository Layer
                       │
        ┌──────────────┼──────────────┐
        │              │              │
 Network Repo    Storage Repo   Settings Repo
        │
        ▼
         Kotlin Native Module
        │
 ┌──────┼───────────┐
 │      │           │
UDP     TCP     File Streams
 │      │           │
 └──────┼───────────┘
        │
    Android OS
```

------------------------------------------------------------------------

# Project Structure

``` text
sharebear/

android/
ios/

docs/
protocol/
native/
tests/

src/
│
├── app/
├── assets/
├── components/
├── navigation/
├── hooks/
├── services/
├── repositories/
├── store/
├── types/
├── utils/
│
├── screens/
│   ├── Home/
│   ├── Devices/
│   ├── Transfers/
│   └── Settings/
│
└── features/
    ├── discovery/
    ├── transfer/
    ├── session/
    └── permissions/
```

------------------------------------------------------------------------

# Native Android Structure

``` text
android/native/

network/
    NetworkEngine.kt
    DiscoveryService.kt
    SocketServer.kt
    SocketClient.kt

transfer/
    FileSender.kt
    FileReceiver.kt
    ChunkManager.kt

security/
    EncryptionManager.kt

storage/
    FileManager.kt

bridge/
    ShareBearModule.kt

service/
    ForegroundTransferService.kt
```

------------------------------------------------------------------------

# Layer Responsibilities

## Presentation Layer

Responsible only for:

-   UI
-   Navigation
-   User interactions
-   Displaying state

Never performs networking.

------------------------------------------------------------------------

## Application Layer

Contains business logic.

Managers:

-   DiscoveryManager
-   TransferManager
-   SessionManager
-   PermissionManager
-   NotificationManager

------------------------------------------------------------------------

## Repository Layer

Acts as the bridge between business logic and implementation.

Repositories:

-   NetworkRepository
-   StorageRepository
-   PreferenceRepository

------------------------------------------------------------------------

## Native Networking Layer

Handles:

-   UDP Discovery
-   TCP Connections
-   File Streaming
-   Background Transfers
-   Encryption
-   Notifications

Large files are streamed directly in Kotlin instead of passing through
the JavaScript bridge.

------------------------------------------------------------------------

# Data Flow

``` text
UI
 ↓
Managers
 ↓
Repositories
 ↓
Native Module
 ↓
Android Networking
```

Dependencies always flow downward.

------------------------------------------------------------------------

# Device Discovery Flow

``` text
App Starts
      ↓
Start UDP Listener
      ↓
Broadcast Discovery Packet
      ↓
Nearby Devices Reply
      ↓
Discovery Manager
      ↓
Store Updated
      ↓
UI Refresh
```

------------------------------------------------------------------------

# File Transfer Flow

``` text
User Selects File
      ↓
Transfer Manager
      ↓
Network Repository
      ↓
Native Module
      ↓
TCP Transfer
      ↓
Receiver
      ↓
Progress Callback
      ↓
Store Updated
      ↓
UI
```

------------------------------------------------------------------------

# State Stores

Create independent Zustand stores:

-   Device Store
-   Transfer Store
-   Session Store
-   Settings Store
-   Logs Store

------------------------------------------------------------------------

# Protocol

Every message is versioned.

Example:

``` json
{
  "version": 1,
  "type": "DISCOVERY_REQUEST",
  "deviceId": "123456",
  "deviceName": "Gill Phone"
}
```

Future packet types:

-   DISCOVERY_RESPONSE
-   TRANSFER_REQUEST
-   TRANSFER_ACCEPT
-   TRANSFER_REJECT
-   TRANSFER_PROGRESS
-   TRANSFER_COMPLETE
-   HEARTBEAT
-   ERROR

------------------------------------------------------------------------

# Documentation

``` text
docs/

Architecture.md
Protocol.md
Roadmap.md
API.md
Performance.md
Security.md
DecisionRecords/
SequenceDiagrams/
```

------------------------------------------------------------------------

# MVP

Version 1 should support:

-   Device discovery
-   Device list
-   Connect to device
-   Send one file
-   Receive one file
-   Transfer progress

------------------------------------------------------------------------

# Future Roadmap

## Phase 2

-   QR Pairing
-   Encryption
-   Resume Transfers
-   Transfer Queue

## Phase 3

-   Folder Transfer
-   Multiple Files
-   Device History

## Phase 4

-   Windows
-   macOS
-   Linux
-   iOS

------------------------------------------------------------------------

# Design Principles

-   UI never performs networking.
-   Business logic is independent of the UI.
-   Native code owns sockets and file streams.
-   Protocol is versioned from day one.
-   Every feature has a single responsibility.
-   Event-driven architecture with no polling.
-   Easy future support for desktop and iOS.

------------------------------------------------------------------------

# Long-Term Vision

Separate the reusable networking engine into **ShareBear Core**,
allowing multiple clients:

``` text
sharebear/

apps/
├── mobile/
├── desktop/
└── cli/

packages/
├── core/
├── protocol/
├── shared/
└── ui/
```

This allows mobile, desktop, and CLI applications to reuse the same
protocol, networking logic, and transfer engine.

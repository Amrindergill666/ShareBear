package com.sharebear.network.server.models

import java.util.concurrent.CountDownLatch

/**
 * Model representing a blocked HTTP request thread waiting for user handshake decision (Accept/Reject).
 */
class HandshakeSession {
    val latch = CountDownLatch(1)
    @Volatile var accepted: Boolean = false
}

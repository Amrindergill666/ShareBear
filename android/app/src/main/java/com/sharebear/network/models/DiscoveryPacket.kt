package com.sharebear.network.models

/**
 * Data class representing a parsed discovery packet.
 */
data class DiscoveryPacket(
    val version: Int,
    val type: String, // "DISCOVER" or "DISCOVER_RESPONSE"
    val deviceId: String,
    val deviceName: String,
    val platform: String,
    val httpPort: Int,
    val timestamp: Long,
    val ipAddress: String // sender's IP address, set during packet reception
)

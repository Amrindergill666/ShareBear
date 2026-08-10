package com.sharebear.network.models

/**
 * Data class representing a discovered device on the local network.
 */
data class DeviceInfo(
    val deviceId: String,
    val deviceName: String,
    val platform: String,
    val ipAddress: String,
    val httpPort: Int,
    var lastSeen: Long = System.currentTimeMillis(),
    val avatarId: String = "main"
)

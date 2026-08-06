package com.sharebear.network.discovery

import android.util.Log
import com.sharebear.network.models.DiscoveryPacket
import org.json.JSONObject

/**
 * Parses raw UDP bytes into structured, validated DiscoveryPackets.
 */
object PacketParser {
    private const val TAG = "PacketParser"

    fun parse(bytes: ByteArray, length: Int, ipAddress: String): DiscoveryPacket? {
        try {
            val jsonString = String(bytes, 0, length, Charsets.UTF_8).trim()
            val json = JSONObject(jsonString)

            // Validation: check protocol version
            val version = json.optInt("version", -1)
            if (version != 1) {
                Log.d(TAG, "Unsupported protocol version: $version")
                return null
            }

            // Validation: check type
            val type = json.optString("type", "")
            if (type != "DISCOVER" && type != "DISCOVER_RESPONSE") {
                Log.d(TAG, "Invalid packet type: $type")
                return null
            }

            // Validation: check deviceId
            val deviceId = json.optString("deviceId", "").trim()
            if (deviceId.isEmpty()) {
                Log.d(TAG, "Missing deviceId")
                return null
            }

            // Validation: check deviceName
            val deviceName = json.optString("deviceName", "").trim()
            if (deviceName.isEmpty()) {
                Log.d(TAG, "Missing deviceName")
                return null
            }

            // Validation: check platform
            val platform = json.optString("platform", "unknown").trim()

            // Validation: check httpPort
            val httpPort = json.optInt("httpPort", -1)
            if (httpPort < 1 || httpPort > 65535) {
                Log.d(TAG, "Invalid httpPort: $httpPort")
                return null
            }

            // Fallback timestamp if not provided
            val timestamp = json.optLong("timestamp", System.currentTimeMillis())

            return DiscoveryPacket(
                version = version,
                type = type,
                deviceId = deviceId,
                deviceName = deviceName,
                platform = platform,
                httpPort = httpPort,
                timestamp = timestamp,
                ipAddress = ipAddress
            )
        } catch (e: Exception) {
            Log.d(TAG, "Error parsing discovery packet: ${e.message}")
            return null
        }
    }
}

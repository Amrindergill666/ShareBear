package com.sharebear.network.discovery

import android.util.Log
import org.json.JSONObject
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Responsible only for receiving a DISCOVER request packet trigger,
 * creating a DISCOVER_RESPONSE payload, and sending it back to the sender's IP.
 */
class DiscoveryResponder(
    private val deviceId: String,
    private val deviceName: String,
    private val httpPort: Int,
    private val discoveryPort: Int = 53317
) {
    private val TAG = "DiscoveryResponder"
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()

    /**
     * Sends a direct DISCOVER_RESPONSE packet to the target IP address.
     */
    fun respond(targetIp: String) {
        if (executor.isShutdown) return
        executor.submit {
            var socket: DatagramSocket? = null
            try {
                socket = DatagramSocket()
                val payload = JSONObject().apply {
                    put("version", 1)
                    put("type", "DISCOVER_RESPONSE")
                    put("deviceId", deviceId)
                    put("deviceName", deviceName)
                    put("platform", "android")
                    put("httpPort", httpPort)
                    put("timestamp", System.currentTimeMillis() / 1000)
                }

                val messageBytes = payload.toString().toByteArray(Charsets.UTF_8)
                val targetAddress = InetAddress.getByName(targetIp)

                val packet = DatagramPacket(
                    messageBytes,
                    messageBytes.size,
                    targetAddress,
                    discoveryPort
                )

                socket.send(packet)
                Log.d(TAG, "Sent DISCOVER_RESPONSE to $targetIp: $payload")
            } catch (e: Exception) {
                Log.e(TAG, "Error sending DISCOVER_RESPONSE to $targetIp: ${e.message}")
            } finally {
                socket?.close()
            }
        }
    }

    fun shutdown() {
        executor.shutdownNow()
    }
}

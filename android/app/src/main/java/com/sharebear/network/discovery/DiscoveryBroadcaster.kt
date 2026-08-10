package com.sharebear.network.discovery

import android.util.Log
import org.json.JSONObject
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Responsible only for opening a UDP socket, constructing DISCOVER payloads,
 * and broadcasting them. Does not listen for responses.
 */
class DiscoveryBroadcaster(
    private val deviceId: String,
    private val deviceName: String,
    private val httpPort: Int,
    private val avatarId: String = "main",
    private val discoveryPort: Int = 53317
) {
    private val TAG = "DiscoveryBroadcaster"
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()

    /**
     * Sends a UDP broadcast packet asynchronously.
     */
    fun broadcast() {
        if (executor.isShutdown) return
        executor.submit {
            var socket: DatagramSocket? = null
            try {
                socket = DatagramSocket()
                socket.broadcast = true

                val payload = JSONObject().apply {
                    put("version", 1)
                    put("type", "DISCOVER")
                    put("deviceId", deviceId)
                    put("deviceName", deviceName)
                    put("platform", "android")
                    put("httpPort", httpPort)
                    put("avatarId", avatarId)
                    put("timestamp", System.currentTimeMillis() / 1000)
                }

                val messageBytes = payload.toString().toByteArray(Charsets.UTF_8)
                val broadcastAddress = InetAddress.getByName("255.255.255.255")

                val packet = DatagramPacket(
                    messageBytes,
                    messageBytes.size,
                    broadcastAddress,
                    discoveryPort
                )

                socket.send(packet)
                Log.d(TAG, "Sent DISCOVER broadcast: $payload")
            } catch (e: Exception) {
                Log.e(TAG, "Error sending broadcast: ${e.message}")
            } finally {
                socket?.close()
            }
        }
    }

    fun shutdown() {
        executor.shutdownNow()
    }
}

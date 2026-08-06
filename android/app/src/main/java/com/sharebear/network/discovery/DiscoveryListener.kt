package com.sharebear.network.discovery

import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import com.sharebear.network.models.DiscoveryPacket
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetSocketAddress
import java.net.SocketException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Responsible only for running a background thread that binds to the UDP port,
 * receives packets, and passes them to the PacketParser.
 */
class DiscoveryListener(
    private val context: Context,
    private val discoveryPort: Int = 53317,
    private val onPacketReceived: (DiscoveryPacket) -> Unit
) {
    private val TAG = "DiscoveryListener"
    private var socket: DatagramSocket? = null
    private var executor: ExecutorService? = null
    private var multicastLock: WifiManager.MulticastLock? = null
    @Volatile private var isRunning = false

    @Synchronized
    fun start() {
        if (isRunning) return
        isRunning = true

        // Acquire MulticastLock to ensure reception of broadcast/multicast packets on Android
        try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            multicastLock = wifiManager.createMulticastLock("ShareBearDiscoveryLock").apply {
                setReferenceCounted(true)
                acquire()
            }
            Log.d(TAG, "MulticastLock acquired")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire MulticastLock: ${e.message}")
        }

        executor = Executors.newSingleThreadExecutor()
        executor?.submit {
            listenLoop()
        }
    }

    @Synchronized
    fun stop() {
        if (!isRunning) return
        isRunning = false

        // Close the socket to interrupt socket.receive() block
        socket?.close()
        socket = null

        executor?.shutdownNow()
        executor = null

        // Release MulticastLock
        try {
            multicastLock?.let {
                if (it.isHeld) {
                    it.release()
                }
            }
            multicastLock = null
            Log.d(TAG, "MulticastLock released")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to release MulticastLock: ${e.message}")
        }
    }

    private fun listenLoop() {
        try {
            // Configure socket with reuseAddress = true
            val datagramSocket = DatagramSocket(null).apply {
                reuseAddress = true
                bind(InetSocketAddress(discoveryPort))
            }
            socket = datagramSocket
            Log.d(TAG, "Listening for UDP discovery packets on port $discoveryPort")

            val buffer = ByteArray(4096)
            while (isRunning) {
                val packet = DatagramPacket(buffer, buffer.size)
                try {
                    datagramSocket.receive(packet)
                    val senderIp = packet.address.hostAddress ?: ""
                    
                    val parsedPacket = PacketParser.parse(
                        packet.data,
                        packet.length,
                        senderIp
                    )

                    if (parsedPacket != null) {
                        onPacketReceived(parsedPacket)
                    }
                } catch (e: SocketException) {
                    if (!isRunning) {
                        Log.d(TAG, "Socket closed; listener stopped.")
                    } else {
                        Log.e(TAG, "SocketException in listen loop: ${e.message}")
                    }
                    break
                } catch (e: Exception) {
                    Log.e(TAG, "Exception receiving UDP packet: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start UDP listener: ${e.message}")
        } finally {
            socket?.close()
            socket = null
        }
    }
}

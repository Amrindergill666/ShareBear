package com.sharebear.network.discovery

import android.content.Context
import android.util.Log
import com.sharebear.network.events.DiscoveryListenerInterface
import com.sharebear.network.models.DeviceInfo
import com.sharebear.network.models.DiscoveryPacket
import com.sharebear.network.registry.DeviceRegistry

/**
 * Main coordinator that aggregates and controls all discovery components:
 * Listener, Broadcaster, Responder, Scheduler, DuplicateFilter, and DeviceRegistry.
 */
class DiscoveryEngine(
    private val context: Context,
    private val deviceId: String,
    private val deviceName: String,
    private val httpPort: Int,
    private val avatarId: String = "main",
    private val discoveryPort: Int = 53317
) {
    private val TAG = "DiscoveryEngine"

    val registry = DeviceRegistry()
    private val duplicateFilter = DuplicateFilter()

    private val broadcaster = DiscoveryBroadcaster(deviceId, deviceName, httpPort, avatarId, discoveryPort)
    private val responder = DiscoveryResponder(deviceId, deviceName, httpPort, avatarId, discoveryPort)
    private val scheduler = DiscoveryScheduler { broadcaster.broadcast() }

    private val listener = DiscoveryListener(context, discoveryPort) { packet ->
        handleIncomingPacket(packet)
    }

    @Volatile private var isRunning = false

    @Synchronized
    fun start() {
        if (isRunning) return
        isRunning = true
        Log.d(TAG, "Starting DiscoveryEngine...")

        duplicateFilter.clear()
        registry.start()
        listener.start()
        scheduler.start()
    }

    @Synchronized
    fun stop() {
        if (!isRunning) return
        isRunning = false
        Log.d(TAG, "Stopping DiscoveryEngine...")

        scheduler.stop()
        listener.stop()
        registry.stop()
        duplicateFilter.clear()
    }

    /**
     * Completely shuts down executors and stops all tasks.
     */
    fun shutdown() {
        stop()
        broadcaster.shutdown()
        responder.shutdown()
    }

    fun addListener(listener: DiscoveryListenerInterface) {
        registry.addListener(listener)
    }

    fun removeListener(listener: DiscoveryListenerInterface) {
        registry.removeListener(listener)
    }

    fun getDiscoveredDevices(): List<DeviceInfo> {
        return registry.getDevices()
    }

    private fun handleIncomingPacket(packet: DiscoveryPacket) {
        // Ignore self-sent packets
        if (packet.deviceId == deviceId) {
            return
        }

        // Deduplicate packets using a unique signature (deviceId + packetType + timestamp)
        val signature = "${packet.deviceId}_${packet.type}_${packet.timestamp}"
        if (duplicateFilter.isDuplicate(signature)) {
            return
        }

        Log.d(TAG, "Received valid discovery packet: ${packet.type} from ${packet.deviceName} (${packet.ipAddress})")

        val device = DeviceInfo(
            deviceId = packet.deviceId,
            deviceName = packet.deviceName,
            platform = packet.platform,
            ipAddress = packet.ipAddress,
            httpPort = packet.httpPort,
            avatarId = packet.avatarId
        )

        when (packet.type) {
            "DISCOVER" -> {
                registry.addOrUpdateDevice(device)
                // Reply directly back to the requester
                responder.respond(packet.ipAddress)
            }
            "DISCOVER_RESPONSE" -> {
                registry.addOrUpdateDevice(device)
            }
        }
    }
}

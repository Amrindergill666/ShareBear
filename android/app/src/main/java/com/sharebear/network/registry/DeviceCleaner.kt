package com.sharebear.network.registry

import com.sharebear.network.models.DeviceInfo
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

/**
 * Scheduled background task that checks device timestamps periodically
 * and removes devices that haven't been seen for a specified timeout duration.
 */
class DeviceCleaner(
    private val cache: DeviceCache,
    private val timeoutMs: Long = 30000L, // 30 seconds timeout
    private val onDeviceTimeout: (DeviceInfo) -> Unit
) {
    private var scheduler: ScheduledExecutorService? = null

    @Synchronized
    fun start() {
        if (scheduler != null) return
        scheduler = Executors.newSingleThreadScheduledExecutor()
        scheduler?.scheduleAtFixedRate({
            clean()
        }, 5, 5, TimeUnit.SECONDS) // Check every 5 seconds
    }

    @Synchronized
    fun stop() {
        scheduler?.shutdownNow()
        scheduler = null
    }

    private fun clean() {
        val now = System.currentTimeMillis()
        for (device in cache.getAll()) {
            if (now - device.lastSeen > timeoutMs) {
                val removed = cache.remove(device.deviceId)
                if (removed != null) {
                    onDeviceTimeout(removed)
                }
            }
        }
    }
}

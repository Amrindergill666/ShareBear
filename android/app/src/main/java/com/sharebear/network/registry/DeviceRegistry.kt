package com.sharebear.network.registry

import com.sharebear.network.events.DiscoveryListenerInterface
import com.sharebear.network.models.DeviceInfo
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Coordinates DeviceCache and DeviceCleaner. Notifies listeners
 * when a device is added, updated, or removed from the registry.
 */
class DeviceRegistry {
    private val cache = DeviceCache()
    private val listeners = CopyOnWriteArrayList<DiscoveryListenerInterface>()
    
    private val cleaner = DeviceCleaner(cache) { removedDevice ->
        notifyDeviceLost(removedDevice)
    }

    fun addListener(listener: DiscoveryListenerInterface) {
        if (!listeners.contains(listener)) {
            listeners.add(listener)
        }
    }

    fun removeListener(listener: DiscoveryListenerInterface) {
        listeners.remove(listener)
    }

    fun start() {
        cleaner.start()
    }

    fun stop() {
        cleaner.stop()
        cache.clear()
    }

    fun addOrUpdateDevice(device: DeviceInfo) {
        val existing = cache.get(device.deviceId)
        if (existing == null) {
            cache.put(device)
            notifyDeviceFound(device)
        } else {
            // Update last seen and properties
            val updated = DeviceInfo(
                deviceId = device.deviceId,
                deviceName = device.deviceName,
                platform = device.platform,
                ipAddress = device.ipAddress,
                httpPort = device.httpPort,
                lastSeen = System.currentTimeMillis()
            )
            cache.put(updated)
            
            // If essential properties changed, notify listeners
            if (existing.deviceName != device.deviceName || 
                existing.platform != device.platform || 
                existing.ipAddress != device.ipAddress || 
                existing.httpPort != device.httpPort) {
                notifyDeviceFound(updated)
            }
        }
    }

    fun getDevices(): List<DeviceInfo> {
        return cache.getAll()
    }

    private fun notifyDeviceFound(device: DeviceInfo) {
        for (listener in listeners) {
            listener.onDeviceFound(device)
        }
    }

    private fun notifyDeviceLost(device: DeviceInfo) {
        for (listener in listeners) {
            listener.onDeviceLost(device)
        }
    }
}

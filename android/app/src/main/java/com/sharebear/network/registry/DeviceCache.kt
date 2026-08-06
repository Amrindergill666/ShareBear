package com.sharebear.network.registry

import com.sharebear.network.models.DeviceInfo
import java.util.concurrent.ConcurrentHashMap

/**
 * Thread-safe cache holding discovered active devices.
 */
class DeviceCache {
    private val devices = ConcurrentHashMap<String, DeviceInfo>()

    fun put(device: DeviceInfo): DeviceInfo? {
        return devices.put(device.deviceId, device)
    }

    fun get(deviceId: String): DeviceInfo? {
        return devices[deviceId]
    }

    fun remove(deviceId: String): DeviceInfo? {
        return devices.remove(deviceId)
    }

    fun getAll(): List<DeviceInfo> {
        return devices.values.toList()
    }

    fun clear() {
        devices.clear()
    }
}

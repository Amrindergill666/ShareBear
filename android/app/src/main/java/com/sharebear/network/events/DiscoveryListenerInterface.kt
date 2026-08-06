package com.sharebear.network.events

import com.sharebear.network.models.DeviceInfo

/**
 * Interface to listen for discovery events.
 */
interface DiscoveryListenerInterface {
    fun onDeviceFound(device: DeviceInfo)
    fun onDeviceLost(device: DeviceInfo)
    fun onDiscoveryStarted()
    fun onDiscoveryStopped()
}

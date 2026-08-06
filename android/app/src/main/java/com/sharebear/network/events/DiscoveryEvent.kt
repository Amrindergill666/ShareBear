package com.sharebear.network.events

import com.sharebear.network.models.DeviceInfo

/**
 * Events related to device discovery.
 */
sealed class DiscoveryEvent {
    data class DeviceFound(val device: DeviceInfo) : DiscoveryEvent()
    data class DeviceLost(val device: DeviceInfo) : DiscoveryEvent()
    object DiscoveryStarted : DiscoveryEvent()
    object DiscoveryStopped : DiscoveryEvent()
}

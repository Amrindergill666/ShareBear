package com.sharebear.network

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.sharebear.network.discovery.DiscoveryEngine
import com.sharebear.network.events.DiscoveryListenerInterface
import com.sharebear.network.models.DeviceInfo

/**
 * Native module exposing discovery controller APIs to React Native.
 */
class NetworkModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), DiscoveryListenerInterface {

    private var engine: DiscoveryEngine? = null

    override fun getName(): String {
        return "NetworkModule"
    }

    /**
     * Starts the discovery engine with the given device specifications.
     */
    @ReactMethod
    fun startDiscovery(deviceId: String, deviceName: String, httpPort: Int, promise: Promise) {
        try {
            // Stop and shut down any previous instance
            engine?.shutdown()

            val newEngine = DiscoveryEngine(
                context = reactContext,
                deviceId = deviceId,
                deviceName = deviceName,
                httpPort = httpPort
            )
            newEngine.addListener(this)
            newEngine.start()
            engine = newEngine

            promise.resolve(null)
        } catch (e: java.lang.Exception) {
            promise.reject("START_DISCOVERY_ERROR", e.message, e)
        }
    }

    /**
     * Stops the discovery engine.
     */
    @ReactMethod
    fun stopDiscovery(promise: Promise) {
        try {
            engine?.stop()
            engine?.removeListener(this)
            engine?.shutdown()
            engine = null
            promise.resolve(null)
        } catch (e: java.lang.Exception) {
            promise.reject("STOP_DISCOVERY_ERROR", e.message, e)
        }
    }

    /**
     * Resolves currently active devices in the registry.
     */
    @ReactMethod
    fun getDiscoveredDevices(promise: Promise) {
        try {
            val devices = engine?.getDiscoveredDevices() ?: emptyList()
            val array = Arguments.createArray()
            for (device in devices) {
                array.pushMap(deviceToMap(device))
            }
            promise.resolve(array)
        } catch (e: java.lang.Exception) {
            promise.reject("GET_DEVICES_ERROR", e.message, e)
        }
    }

    // Callbacks from DiscoveryListenerInterface
    override fun onDeviceFound(device: DeviceInfo) {
        emitEvent("DeviceFound", deviceToMap(device))
    }

    override fun onDeviceLost(device: DeviceInfo) {
        emitEvent("DeviceLost", deviceToMap(device))
    }

    override fun onDiscoveryStarted() {
        emitEvent("DiscoveryStarted", null)
    }

    override fun onDiscoveryStopped() {
        emitEvent("DiscoveryStopped", null)
    }

    /**
     * Clean up native executors on module invalidate (e.g. app reload)
     */
    override fun invalidate() {
        super.invalidate()
        engine?.shutdown()
        engine = null
    }

    private fun deviceToMap(device: DeviceInfo): WritableMap {
        val map = Arguments.createMap()
        map.putString("deviceId", device.deviceId)
        map.putString("deviceName", device.deviceName)
        map.putString("platform", device.platform)
        map.putString("ipAddress", device.ipAddress)
        map.putInt("httpPort", device.httpPort)
        return map
    }

    private fun emitEvent(eventName: String, params: WritableMap?) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}

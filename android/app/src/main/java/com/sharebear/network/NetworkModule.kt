package com.sharebear.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.sharebear.network.discovery.DiscoveryEngine
import com.sharebear.network.events.DiscoveryListenerInterface
import com.sharebear.network.models.DeviceInfo
import com.sharebear.network.server.HttpServer

/**
 * Native module exposing discovery controller APIs to React Native.
 */
class NetworkModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), DiscoveryListenerInterface {

    private var engine: DiscoveryEngine? = null
    private var server: HttpServer? = null

    override fun getName(): String {
        return "NetworkModule"
    }

    /**
     * Starts the HTTP Server on the specified port.
     */
    @ReactMethod
    fun startServer(port: Int, deviceId: String, deviceName: String, promise: Promise) {
        try {
            server?.stop()

            val newServer = HttpServer(
                context = reactContext,
                port = port,
                deviceId = deviceId,
                deviceName = deviceName,
                onIncomingTransferRequest = { transferId, body ->
                    val map = Arguments.createMap().apply {
                        putString("transferId", transferId)
                        putString("body", body)
                    }
                    emitEvent("TransferRequestReceived", map)
                },
                onStatsUpdated = { requests, lastIp ->
                    val map = Arguments.createMap().apply {
                        putBoolean("isRunning", true)
                        putInt("port", port)
                        putInt("requestsReceived", requests)
                        putString("lastRequestIp", lastIp)
                    }
                    emitEvent("ServerStatsUpdated", map)
                },
                onDownloadProgress = { transferId, bytesReceived, totalBytes ->
                    val map = Arguments.createMap().apply {
                        putString("transferId", transferId)
                        putDouble("bytesSent", bytesReceived.toDouble())
                        putDouble("totalBytes", totalBytes.toDouble())
                        putString("direction", "download")
                    }
                    emitEvent("TransferProgress", map)
                },
                onDownloadComplete = { transferId, filePath, fileSize ->
                    val map = Arguments.createMap().apply {
                        putString("transferId", transferId)
                        putString("filePath", filePath)
                        putDouble("fileSize", fileSize.toDouble())
                    }
                    emitEvent("TransferSuccess", map)
                },
                onDownloadError = { transferId, error ->
                    val map = Arguments.createMap().apply {
                        putString("transferId", transferId)
                        putString("error", error)
                    }
                    emitEvent("TransferError", map)
                },
                onTextReceived = { transferId, text, transferType, senderIp ->
                    val map = Arguments.createMap().apply {
                        putString("transferId", transferId)
                        putString("text", text)
                        putString("transferType", transferType)
                        putString("senderIp", senderIp)
                    }
                    emitEvent("TextTransferReceived", map)
                }
            )
            newServer.start()
            server = newServer
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("START_SERVER_ERROR", e.message, e)
        }
    }

    /**
     * Sends pure text or clipboard payload to a peer via HTTP POST /transfer/{transferId}/text
     */
    @ReactMethod
    fun sendTextPayload(
        transferId: String,
        peerIp: String,
        peerPort: Int,
        text: String,
        transferType: String,
        promise: Promise
    ) {
        Thread {
            try {
                val url = java.net.URL("http://$peerIp:$peerPort/transfer/$transferId/text")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.requestMethod = "POST"
                connection.doOutput = true
                val bodyBytes = text.toByteArray(Charsets.UTF_8)
                connection.setFixedLengthStreamingMode(bodyBytes.size)
                connection.connectTimeout = 10000
                connection.readTimeout = 15000

                connection.setRequestProperty("Content-Type", "text/plain; charset=utf-8")
                connection.setRequestProperty("X-Transfer-Type", transferType)

                val outputStream = connection.outputStream
                outputStream.write(bodyBytes)
                outputStream.flush()
                outputStream.close()

                val responseCode = connection.responseCode
                if (responseCode == 200) {
                    val responseBody = connection.inputStream.bufferedReader().use { it.readText() }
                    promise.resolve(responseBody)
                } else {
                    promise.reject("TEXT_SEND_ERROR", "HTTP response code: $responseCode")
                }
            } catch (e: Exception) {
                promise.reject("TEXT_SEND_ERROR", e.message, e)
            }
        }.start()
    }

    /**
     * Streams a local file to the receiver over HTTP POST in 64 KB chunks.
     */
    @ReactMethod
    fun startUpload(
        transferId: String,
        fileUri: String,
        peerIp: String,
        peerPort: Int,
        fileName: String,
        fileSize: Double,
        mimeType: String,
        promise: Promise
    ) {
        val size = fileSize.toLong()
        Thread {
            try {
                val url = java.net.URL("http://$peerIp:$peerPort/transfer/$transferId/file")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.requestMethod = "POST"
                connection.doOutput = true
                if (size > 0) {
                    connection.setFixedLengthStreamingMode(size)
                } else {
                    connection.setChunkedStreamingMode(64 * 1024)
                }
                connection.connectTimeout = 10000
                connection.readTimeout = 60000

                connection.setRequestProperty("Content-Type", "application/octet-stream")
                connection.setRequestProperty("X-File-Name", fileName)
                connection.setRequestProperty("X-File-Size", size.toString())
                connection.setRequestProperty("X-Mime-Type", mimeType)

                val outputStream = connection.outputStream
                val fileInputStream = reactContext.contentResolver.openInputStream(android.net.Uri.parse(fileUri))
                    ?: throw java.io.FileNotFoundException("Could not open file URI: $fileUri")

                val buffer = ByteArray(64 * 1024)
                var bytesRead: Int
                var totalBytesSent: Long = 0

                while (true) {
                    bytesRead = fileInputStream.read(buffer)
                    if (bytesRead == -1) break
                    outputStream.write(buffer, 0, bytesRead)
                    totalBytesSent += bytesRead

                    // Emit progress
                    val map = Arguments.createMap().apply {
                        putString("transferId", transferId)
                        putDouble("bytesSent", totalBytesSent.toDouble())
                        putDouble("totalBytes", size.toDouble())
                        putString("direction", "upload")
                    }
                    emitEvent("TransferProgress", map)
                }

                outputStream.flush()
                outputStream.close()
                fileInputStream.close()

                val responseCode = connection.responseCode
                if (responseCode == 200) {
                    val responseBody = connection.inputStream.bufferedReader().use { it.readText() }
                    val map = Arguments.createMap().apply {
                        putString("transferId", transferId)
                        putString("filePath", fileUri)
                        putDouble("fileSize", size.toDouble())
                    }
                    emitEvent("TransferSuccess", map)
                    promise.resolve(responseBody)
                } else {
                    val errorMsg = "HTTP error code: $responseCode"
                    val map = Arguments.createMap().apply {
                        putString("transferId", transferId)
                        putString("error", errorMsg)
                    }
                    emitEvent("TransferError", map)
                    promise.reject("UPLOAD_HTTP_ERROR", errorMsg)
                }
            } catch (e: Exception) {
                val map = Arguments.createMap().apply {
                    putString("transferId", transferId)
                    putString("error", e.message ?: "Unknown upload error")
                }
                emitEvent("TransferError", map)
                promise.reject("UPLOAD_ERROR", e.message, e)
            }
        }.start()
    }

    /**
     * Responds to a blocked incoming handshake request.
     */
    @ReactMethod
    fun respondToTransfer(transferId: String, accept: Boolean, promise: Promise) {
        try {
            val session = com.sharebear.network.server.endpoints.TransferRequestHandler.activeSessions[transferId]
            if (session != null) {
                session.accepted = accept
                session.latch.countDown()
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("RESPOND_TRANSFER_ERROR", e.message, e)
        }
    }

    /**
     * Stops the HTTP Server.
     */
    @ReactMethod
    fun stopServer(promise: Promise) {
        try {
            server?.stop()
            server = null

            val map = Arguments.createMap().apply {
                putBoolean("isRunning", false)
                putInt("port", 0)
                putInt("requestsReceived", 0)
                putString("lastRequestIp", "none")
            }
            emitEvent("ServerStatsUpdated", map)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("STOP_SERVER_ERROR", e.message, e)
        }
    }

    /**
     * Returns snapshot statistics of the server.
     */
    @ReactMethod
    fun getServerStats(promise: Promise) {
        try {
            val stats = server?.getStats()
            val map = Arguments.createMap()
            if (stats != null) {
                map.putBoolean("isRunning", stats["isRunning"] as Boolean)
                map.putInt("port", stats["port"] as Int)
                map.putInt("requestsReceived", stats["requestsReceived"] as Int)
                map.putString("lastRequestIp", stats["lastRequestIp"] as String)
                map.putDouble("uptime", (stats["uptime"] as Long).toDouble())
            } else {
                map.putBoolean("isRunning", false)
                map.putInt("port", 0)
                map.putInt("requestsReceived", 0)
                map.putString("lastRequestIp", "none")
                map.putDouble("uptime", 0.0)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("GET_STATS_ERROR", e.message, e)
        }
    }

    /**
     * Starts the discovery engine with the given device specifications.
     */
    @ReactMethod
    fun startDiscovery(deviceId: String, deviceName: String, httpPort: Int, avatarId: String, promise: Promise) {
        try {
            // Stop and shut down any previous instance
            engine?.shutdown()

            val newEngine = DiscoveryEngine(
                context = reactContext,
                deviceId = deviceId,
                deviceName = deviceName,
                httpPort = httpPort,
                avatarId = avatarId
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
        server?.stop()
        server = null
    }

    @ReactMethod
    fun getLocalIpAddress(promise: Promise) {
        try {
            val ip = getLocalIpAddressInternal()
            promise.resolve(ip)
        } catch (e: Exception) {
            promise.reject("IP_ERROR", e.message, e)
        }
    }

    private fun cleanSSID(rawSSID: String?): String? {
        if (rawSSID == null) return null
        var s = rawSSID.trim()
        if (s.startsWith("\"") && s.endsWith("\"") && s.length >= 2) {
            s = s.substring(1, s.length - 1)
        }
        if (s.isEmpty() || s == "<unknown ssid>" || s == "0x" || s.equals("unknown", ignoreCase = true)) {
            return null
        }
        return s
    }

    @ReactMethod
    fun getWifiName(promise: Promise) {
        try {
            val connectivityManager = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val wifiManager = reactContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager

            var wifiName: String? = null

            // 1. Android 10+ (API 29+) NetworkCapabilities.transportInfo
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                val activeNetwork = connectivityManager?.activeNetwork
                val caps = connectivityManager?.getNetworkCapabilities(activeNetwork)
                val wifiInfo = caps?.transportInfo as? WifiInfo
                if (wifiInfo != null) {
                    wifiName = cleanSSID(wifiInfo.ssid)
                }
            }

            // 2. WifiManager connectionInfo
            if (wifiName == null) {
                val wifiInfo = wifiManager?.connectionInfo
                if (wifiInfo != null) {
                    wifiName = cleanSSID(wifiInfo.ssid)
                }
            }

            // 3. Legacy extraInfo
            if (wifiName == null) {
                try {
                    @Suppress("DEPRECATION")
                    val netInfo = connectivityManager?.getNetworkInfo(ConnectivityManager.TYPE_WIFI)
                    if (netInfo != null) {
                        wifiName = cleanSSID(netInfo.extraInfo)
                    }
                } catch (ignored: Exception) {}
            }

            // 4. Fallback from NetworkCapabilities if connected to Wi-Fi/Cellular/Hotspot
            if (wifiName == null) {
                val activeNetwork = connectivityManager?.activeNetwork
                val caps = connectivityManager?.getNetworkCapabilities(activeNetwork)
                if (caps != null) {
                    if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                        wifiName = "Wi-Fi"
                    } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                        wifiName = "Cellular Data"
                    } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                        wifiName = "Ethernet"
                    }
                }
            }

            promise.resolve(wifiName ?: "Wi-Fi")
        } catch (e: Exception) {
            promise.resolve("Wi-Fi")
        }
    }

    private fun getLocalIpAddressInternal(): String {
        try {
            val interfaces = java.util.Collections.list(java.net.NetworkInterface.getNetworkInterfaces())
            for (intf in interfaces) {
                val addrs = java.util.Collections.list(intf.inetAddresses)
                for (addr in addrs) {
                    if (!addr.isLoopbackAddress) {
                        val sAddr = addr.hostAddress ?: continue
                        val isIPv4 = sAddr.indexOf(':') < 0
                        if (isIPv4) {
                            return sAddr
                        }
                    }
                }
            }
        } catch (ex: Exception) {
            // ignore
        }
        return "127.0.0.1"
    }

    private fun deviceToMap(device: DeviceInfo): WritableMap {
        val map = Arguments.createMap()
        map.putString("deviceId", device.deviceId)
        map.putString("deviceName", device.deviceName)
        map.putString("platform", device.platform)
        map.putString("ipAddress", device.ipAddress)
        map.putInt("httpPort", device.httpPort)
        map.putString("avatarId", device.avatarId)
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

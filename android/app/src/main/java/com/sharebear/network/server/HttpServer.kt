package com.sharebear.network.server

import android.content.Context
import android.util.Log
import com.sharebear.network.server.endpoints.CapabilityEndpoint
import com.sharebear.network.server.endpoints.HealthEndpoint
import com.sharebear.network.server.endpoints.InfoEndpoint
import com.sharebear.network.server.endpoints.PingEndpoint
import com.sharebear.network.server.endpoints.TransferRequestHandler
import com.sharebear.network.server.endpoints.FileTransferEndpoint
import com.sharebear.network.server.endpoints.TextTransferEndpoint
import com.sharebear.network.server.models.Request
import com.sharebear.network.server.models.Response
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

/**
 * Custom lightweight TCP HttpServer that binds to a port and handles GET/POST requests on a thread pool.
 */
class HttpServer(
    private val context: Context,
    val port: Int,
    private val deviceId: String,
    private val deviceName: String,
    private val onIncomingTransferRequest: (transferId: String, requestBody: String) -> Unit,
    private val onStatsUpdated: (requests: Int, lastRequestIp: String) -> Unit,
    private val onDownloadProgress: (transferId: String, bytesReceived: Long, totalBytes: Long) -> Unit,
    private val onDownloadComplete: (transferId: String, filePath: String, fileSize: Long) -> Unit,
    private val onDownloadError: (transferId: String, error: String) -> Unit,
    private val onTextReceived: (transferId: String, text: String, transferType: String, senderIp: String) -> Unit
) {
    private val TAG = "HttpServer"
    
    private var serverSocket: ServerSocket? = null
    private var executor: ExecutorService? = null
    
    private val startTimeMs = System.currentTimeMillis()
    private val requestsReceived = AtomicInteger(0)
    private val activeConnections = AtomicInteger(0)
    @Volatile private var lastRequestIp = "none"
    @Volatile private var isRunning = false

    private val router = Router()

    init {
        router.register("/info", InfoEndpoint(deviceId, deviceName))
        router.register("/ping", PingEndpoint())
        router.register("/health", HealthEndpoint(startTimeMs) { activeConnections.get() })
        router.register("/capabilities", CapabilityEndpoint())
        router.register("/transfer/request", TransferRequestHandler(onIncomingTransferRequest))
        router.register("/transfer/*/file", FileTransferEndpoint(context, onDownloadProgress, onDownloadComplete, onDownloadError))
        router.register("/transfer/*/text", TextTransferEndpoint(onTextReceived))
    }

    /**
     * Starts the HTTP Server on a background thread pool.
     */
    @Synchronized
    fun start() {
        if (isRunning) return
        isRunning = true

        executor = Executors.newCachedThreadPool()
        executor?.submit {
            runServer()
        }
    }

    /**
     * Stops the HTTP Server and releases sockets.
     */
    @Synchronized
    fun stop() {
        if (!isRunning) return
        isRunning = false
        
        try {
            serverSocket?.close()
        } catch (e: Exception) {
            // ignore
        }
        serverSocket = null

        executor?.shutdownNow()
        executor = null
    }

    private fun runServer() {
        try {
            val ss = ServerSocket(port)
            serverSocket = ss
            Log.i(TAG, "HTTP Control Server running on port $port")

            while (isRunning) {
                val socket = ss.accept()
                executor?.submit {
                    handleClient(socket)
                }
            }
        } catch (e: SocketException) {
            if (!isRunning) {
                Log.i(TAG, "Server socket closed; HTTP server stopped.")
            } else {
                Log.e(TAG, "SocketException: ${e.message}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in HTTP server loop: ${e.message}")
        } finally {
            stop()
        }
    }

    private fun handleClient(socket: Socket) {
        activeConnections.incrementAndGet()
        val clientIp = socket.inetAddress.hostAddress ?: "unknown"
        try {
            val inputStream = socket.getInputStream()
            val outputStream = socket.getOutputStream()

            val request = Request.parse(inputStream, clientIp)
            val response = if (request != null) {
                // Update stats
                requestsReceived.incrementAndGet()
                lastRequestIp = clientIp
                onStatsUpdated(requestsReceived.get(), lastRequestIp)

                Log.d(TAG, "Incoming request: ${request.method} ${request.path} from $clientIp")
                router.route(request)
            } else {
                Response.error(400, "Bad Request")
            }

            response.writeTo(outputStream)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling HTTP client: ${e.message}")
        } finally {
            try {
                socket.close()
            } catch (e: Exception) {
                // ignore
            }
            activeConnections.decrementAndGet()
        }
    }

    /**
     * Returns a snapshot map of the server metrics.
     */
    fun getStats(): Map<String, Any> {
        return mapOf(
            "isRunning" to isRunning,
            "port" to port,
            "requestsReceived" to requestsReceived.get(),
            "lastRequestIp" to lastRequestIp,
            "uptime" to (System.currentTimeMillis() - startTimeMs) / 1000
        )
    }
}

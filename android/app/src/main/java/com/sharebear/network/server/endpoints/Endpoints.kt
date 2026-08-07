package com.sharebear.network.server.endpoints

import com.sharebear.network.server.RequestHandler
import com.sharebear.network.server.models.Request
import com.sharebear.network.server.models.Response
import org.json.JSONArray
import org.json.JSONObject

/**
 * Endpoint: GET /info
 */
class InfoEndpoint(
    private val deviceId: String,
    private val deviceName: String
) : RequestHandler {
    override fun handle(request: Request): Response {
        val json = JSONObject().apply {
            put("deviceId", deviceId)
            put("deviceName", deviceName)
            put("platform", "android")
            put("appVersion", "1.0.0")
            put("protocolVersion", 1)
            put("capabilities", JSONArray(listOf("discovery", "file-transfer")))
        }
        return Response.json(200, json.toString())
    }
}

/**
 * Endpoint: GET /ping
 */
class PingEndpoint : RequestHandler {
    override fun handle(request: Request): Response {
        val json = JSONObject().apply {
            put("status", "ok")
            put("timestamp", System.currentTimeMillis() / 1000)
        }
        return Response.json(200, json.toString())
    }
}

/**
 * Endpoint: GET /health
 */
class HealthEndpoint(
    private val startTimeMs: Long,
    private val activeConnectionsProvider: () -> Int
) : RequestHandler {
    override fun handle(request: Request): Response {
        val uptimeSeconds = (System.currentTimeMillis() - startTimeMs) / 1000
        val json = JSONObject().apply {
            put("server", "running")
            put("uptime", uptimeSeconds)
            put("activeConnections", activeConnectionsProvider())
        }
        return Response.json(200, json.toString())
    }
}

/**
 * Endpoint: GET /capabilities
 */
class CapabilityEndpoint : RequestHandler {
    override fun handle(request: Request): Response {
        val json = JSONObject().apply {
            put("features", JSONArray(listOf("udp-discovery", "http-control")))
        }
        return Response.json(200, json.toString())
    }
}

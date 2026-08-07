package com.sharebear.network.server.endpoints

import com.sharebear.network.server.RequestHandler
import com.sharebear.network.server.models.HandshakeSession
import com.sharebear.network.server.models.Request
import com.sharebear.network.server.models.Response
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/**
 * Handles incoming POST /transfer/request, dispatches events to React Native,
 * and blocks the thread waiting for user acceptance or rejection.
 */
class TransferRequestHandler(
    private val onIncomingRequest: (transferId: String, requestBody: String) -> Unit
) : RequestHandler {

    companion object {
        // Global registry of active blocked handshake sessions by transferId
        val activeSessions = ConcurrentHashMap<String, HandshakeSession>()
    }

    override fun handle(request: Request): Response {
        val transferId = "TR-${System.currentTimeMillis()}"
        val session = HandshakeSession()
        activeSessions[transferId] = session

        try {
            // Trigger callback to notify React Native bridge of incoming transfer request
            onIncomingRequest(transferId, request.body)

            // Block HTTP thread for up to 30 seconds waiting for user action
            val completed = session.latch.await(30, TimeUnit.SECONDS)

            if (!completed) {
                // Timeout occurred
                activeSessions.remove(transferId)
                return Response.json(200, JSONObject().apply {
                    put("accepted", false)
                    put("reason", "TIMEOUT")
                }.toString())
            }

            // Unblocked by user action
            val accepted = session.accepted
            activeSessions.remove(transferId)

            val jsonResponse = JSONObject().apply {
                put("accepted", accepted)
                if (accepted) {
                    put("transferId", transferId)
                } else {
                    put("reason", "USER_DECLINED")
                }
            }

            return Response.json(200, jsonResponse.toString())
        } catch (e: Exception) {
            activeSessions.remove(transferId)
            return Response.error(500, "Handshake failed: ${e.message}")
        }
    }
}

package com.sharebear.network.server.endpoints

import android.util.Log
import com.sharebear.network.server.RequestHandler
import com.sharebear.network.server.models.Request
import com.sharebear.network.server.models.Response
import org.json.JSONObject

class TextTransferEndpoint(
    private val onTextReceived: (transferId: String, text: String, transferType: String, senderIp: String) -> Unit
) : RequestHandler {

    private val TAG = "TextTransferEndpoint"

    override fun handle(request: Request): Response {
        // Path is like: /transfer/{transferId}/text
        val pathParts = request.path.split("/")
        if (pathParts.size < 4 || pathParts[3] != "text") {
            return Response.error(400, "Invalid text endpoint path")
        }
        val transferId = pathParts[2]
        val transferType = request.headers["x-transfer-type"] ?: "text"
        val text = request.body

        Log.i(TAG, "Received pure text payload for Transfer ID: $transferId (${text.length} chars, type=$transferType)")

        onTextReceived(transferId, text, transferType, request.clientIp)

        val json = JSONObject().apply {
            put("status", "success")
            put("transferId", transferId)
            put("receivedLength", text.length)
        }
        return Response.json(200, json.toString())
    }
}

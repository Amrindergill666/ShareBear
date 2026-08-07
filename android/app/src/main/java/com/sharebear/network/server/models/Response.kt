package com.sharebear.network.server.models

import java.io.OutputStream
import java.io.PrintWriter
import java.util.Locale

/**
 * Data class representing an HTTP Response, with builder helpers.
 */
class Response(
    val statusCode: Int,
    val statusText: String,
    val contentType: String,
    val body: ByteArray
) {
    /**
     * Serializes the HTTP response status, headers, and body to the TCP output stream.
     */
    fun writeTo(outputStream: OutputStream) {
        val writer = PrintWriter(outputStream, false)
        writer.print("HTTP/1.1 $statusCode $statusText\r\n")
        writer.print("Content-Type: $contentType\r\n")
        writer.print("Content-Length: ${body.size}\r\n")
        writer.print("Connection: close\r\n")
        writer.print("Server: ShareBear\r\n")
        writer.print("\r\n")
        writer.flush()
        
        outputStream.write(body)
        outputStream.flush()
    }

    companion object {
        fun json(statusCode: Int, bodyJson: String): Response {
            val statusText = getStatusText(statusCode)
            return Response(
                statusCode,
                statusText,
                "application/json; charset=utf-8",
                bodyJson.toByteArray(Charsets.UTF_8)
            )
        }

        fun error(statusCode: Int, errorMsg: String): Response {
            val statusText = getStatusText(statusCode)
            val json = "{\"status\": \"error\", \"code\": $statusCode, \"message\": \"$errorMsg\"}"
            return Response(
                statusCode,
                statusText,
                "application/json; charset=utf-8",
                json.toByteArray(Charsets.UTF_8)
            )
        }

        private fun getStatusText(statusCode: Int): String {
            return when (statusCode) {
                200 -> "OK"
                201 -> "Created"
                400 -> "Bad Request"
                404 -> "Not Found"
                405 -> "Method Not Allowed"
                500 -> "Internal Server Error"
                else -> "Unknown"
            }
        }
    }
}

package com.sharebear.network.server.models

import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.util.Locale

/**
 * Data class representing a parsed HTTP Request.
 */
class Request(
    val method: String,
    val path: String,
    val headers: Map<String, String>,
    val clientIp: String,
    val body: String
) {
    companion object {
        /**
         * Parses an HTTP Request from a TCP input stream.
         */
        fun parse(inputStream: InputStream, clientIp: String): Request? {
            try {
                val reader = BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8))
                val firstLine = reader.readLine() ?: return null
                val parts = firstLine.split(" ")
                if (parts.size < 2) return null

                val method = parts[0].uppercase(Locale.US)
                val path = parts[1]

                val headers = mutableMapOf<String, String>()
                var headerLine: String?
                while (true) {
                    headerLine = reader.readLine()
                    if (headerLine.isNullOrEmpty()) {
                        break
                    }
                    val colonIdx = headerLine.indexOf(":")
                    if (colonIdx != -1) {
                        val key = headerLine.substring(0, colonIdx).trim().lowercase(Locale.US)
                        val value = headerLine.substring(colonIdx + 1).trim()
                        headers[key] = value
                    }
                }

                // Parse request body for POST/PUT if Content-Length is provided
                var bodyString = ""
                val lengthHeader = headers["content-length"]
                if (lengthHeader != null) {
                    val contentLength = lengthHeader.toIntOrNull() ?: 0
                    if (contentLength > 0) {
                        val bodyChars = CharArray(contentLength)
                        var read = 0
                        while (read < contentLength) {
                            val result = reader.read(bodyChars, read, contentLength - read)
                            if (result == -1) break
                            read += result
                        }
                        bodyString = String(bodyChars)
                    }
                }

                return Request(method, path, headers, clientIp, bodyString)
            } catch (e: Exception) {
                return null
            }
        }
    }
}

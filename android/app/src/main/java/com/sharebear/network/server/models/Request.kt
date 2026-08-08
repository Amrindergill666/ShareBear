package com.sharebear.network.server.models

import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.util.Locale

/**
 * Data class representing a parsed HTTP Request.
 */
class Request(
    val method: String,
    val path: String,
    val headers: Map<String, String>,
    val clientIp: String,
    val body: String,
    val rawInputStream: InputStream
) {
    companion object {
        /**
         * Reads headers from the raw InputStream byte-by-byte until CRLF CRLF (\r\n\r\n) or LF LF (\n\n).
         * This ensures we do not buffer and lose any subsequent binary body bytes from the TCP stream.
         */
        private fun readHeaders(inputStream: InputStream): ByteArray {
            val headerStream = ByteArrayOutputStream()
            val buffer = mutableListOf<Byte>()
            while (true) {
                val b = inputStream.read()
                if (b == -1) break
                headerStream.write(b)
                buffer.add(b.toByte())
                
                val size = buffer.size
                if (size >= 4 && 
                    buffer[size - 4] == '\r'.toByte() && buffer[size - 3] == '\n'.toByte() &&
                    buffer[size - 2] == '\r'.toByte() && buffer[size - 1] == '\n'.toByte()) {
                    break
                }
                if (size >= 2 && 
                    buffer[size - 2] == '\n'.toByte() && buffer[size - 1] == '\n'.toByte()) {
                    break
                }
                if (size > 16384) { // safety limit
                    break
                }
            }
            return headerStream.toByteArray()
        }

        /**
         * Parses an HTTP Request from a TCP input stream.
         */
        fun parse(inputStream: InputStream, clientIp: String): Request? {
            try {
                val headerBytes = readHeaders(inputStream)
                if (headerBytes.isEmpty()) return null

                val headerText = String(headerBytes, Charsets.UTF_8)
                val lines = headerText.split("\r\n", "\n")
                if (lines.isEmpty()) return null

                val firstLine = lines[0]
                val parts = firstLine.split(" ")
                if (parts.size < 2) return null

                val method = parts[0].uppercase(Locale.US)
                val path = parts[1]

                val headers = mutableMapOf<String, String>()
                for (i in 1 until lines.size) {
                    val line = lines[i]
                    if (line.isEmpty()) continue
                    val colonIdx = line.indexOf(":")
                    if (colonIdx != -1) {
                        val key = line.substring(0, colonIdx).trim().lowercase(Locale.US)
                        val value = line.substring(colonIdx + 1).trim()
                        headers[key] = value
                    }
                }

                // Parse request body for POST/PUT if Content-Length is provided
                var bodyString = ""
                val isFileStreamEndpoint = path.startsWith("/transfer/") && path.endsWith("/file")
                
                if (!isFileStreamEndpoint) {
                    val lengthHeader = headers["content-length"]
                    if (lengthHeader != null) {
                        val contentLength = lengthHeader.toIntOrNull() ?: 0
                        if (contentLength > 0) {
                            val bodyBytes = ByteArray(contentLength)
                            var read = 0
                            while (read < contentLength) {
                                val result = inputStream.read(bodyBytes, read, contentLength - read)
                                if (result == -1) break
                                read += result
                            }
                            bodyString = String(bodyBytes, Charsets.UTF_8)
                        }
                    }
                }

                return Request(method, path, headers, clientIp, bodyString, inputStream)
            } catch (e: Exception) {
                return null
            }
        }
    }
}

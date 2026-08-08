package com.sharebear.network.server.endpoints

import android.content.Context
import android.util.Log
import com.sharebear.network.server.RequestHandler
import com.sharebear.network.server.models.Request
import com.sharebear.network.server.models.Response
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class FileTransferEndpoint(
    private val context: Context,
    private val onDownloadProgress: (transferId: String, bytesReceived: Long, totalBytes: Long) -> Unit,
    private val onDownloadComplete: (transferId: String, filePath: String, fileSize: Long) -> Unit,
    private val onDownloadError: (transferId: String, error: String) -> Unit
) : RequestHandler {

    private val TAG = "FileTransferEndpoint"

    override fun handle(request: Request): Response {
        // Path is like: /transfer/{transferId}/file
        val pathParts = request.path.split("/")
        if (pathParts.size < 4 || pathParts[3] != "file") {
            return Response.error(400, "Invalid file endpoint path")
        }
        val transferId = pathParts[2]

        val fileName = request.headers["x-file-name"] ?: "downloaded_file"
        val fileSizeStr = request.headers["x-file-size"]
        val mimeType = request.headers["x-mime-type"] ?: "application/octet-stream"

        val fileSize = fileSizeStr?.toLongOrNull() ?: 0L

        Log.i(TAG, "Starting dynamic download stream: $fileName ($fileSize bytes) for Transfer ID: $transferId")

        try {
            val downloadDir = File(context.cacheDir, "downloads")
            if (!downloadDir.exists()) {
                downloadDir.mkdirs()
            }
            val destinationFile = File(downloadDir, fileName)
            val fileOutputStream = FileOutputStream(destinationFile)

            val inputStream = request.rawInputStream
            val buffer = ByteArray(64 * 1024)
            var bytesRead: Int
            var totalBytesRead: Long = 0

            while (true) {
                bytesRead = inputStream.read(buffer)
                if (bytesRead == -1) break
                fileOutputStream.write(buffer, 0, bytesRead)
                totalBytesRead += bytesRead

                // Emit progress to React Native
                onDownloadProgress(transferId, totalBytesRead, fileSize)
                
                // Break early if we've read everything (to prevent waiting indefinitely on socket)
                if (fileSize > 0 && totalBytesRead >= fileSize) {
                    break
                }
            }

            fileOutputStream.flush()
            fileOutputStream.close()

            // File verification
            if (totalBytesRead == fileSize) {
                Log.i(TAG, "Download complete and verified: ${destinationFile.absolutePath}")
                onDownloadComplete(transferId, destinationFile.absolutePath, totalBytesRead)
                
                val json = JSONObject().apply {
                    put("status", "success")
                    put("bytesReceived", totalBytesRead)
                }
                return Response.json(200, json.toString())
            } else {
                val errorMsg = "File verification failed. Expected $fileSize bytes, got $totalBytesRead"
                Log.e(TAG, errorMsg)
                onDownloadError(transferId, errorMsg)
                if (destinationFile.exists()) {
                    destinationFile.delete()
                }
                return Response.error(400, errorMsg)
            }
        } catch (e: Exception) {
            val errorMsg = e.message ?: "Download failed"
            Log.e(TAG, "Error in downloading stream: $errorMsg", e)
            onDownloadError(transferId, errorMsg)
            return Response.error(500, "Download failed: $errorMsg")
        }
    }
}

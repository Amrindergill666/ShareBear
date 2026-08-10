package com.sharebear.network.server.endpoints

import android.content.Context
import android.media.MediaScannerConnection
import android.os.Environment
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

    private fun getUniqueDestinationFile(dir: File, name: String): File {
        var file = File(dir, name)
        if (!file.exists()) return file

        val dotIndex = name.lastIndexOf('.')
        val baseName = if (dotIndex != -1) name.substring(0, dotIndex) else name
        val extension = if (dotIndex != -1) name.substring(dotIndex) else ""

        var count = 1
        while (file.exists()) {
            file = File(dir, "$baseName ($count)$extension")
            count++
        }
        return file
    }

    override fun handle(request: Request): Response {
        // Path is like: /transfer/{transferId}/file
        val pathParts = request.path.split("/")
        if (pathParts.size < 4 || pathParts[3] != "file") {
            return Response.error(400, "Invalid file endpoint path")
        }
        val transferId = pathParts[2]

        val rawFileName = request.headers["x-file-name"] ?: "downloaded_file"
        val fileName = File(rawFileName).name // sanitize path traversal
        val fileSizeStr = request.headers["x-file-size"]
        val mimeType = request.headers["x-mime-type"] ?: "application/octet-stream"

        val fileSize = fileSizeStr?.toLongOrNull() ?: 0L

        Log.i(TAG, "Starting dynamic download stream: $fileName ($fileSize bytes) for Transfer ID: $transferId")

        try {
            // Priority: Public Downloads/ShareBear -> App External Downloads -> App Cache
            val downloadDir = try {
                val publicDir = File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "ShareBear"
                )
                if (!publicDir.exists()) {
                    publicDir.mkdirs()
                }
                if (publicDir.exists() && publicDir.canWrite()) {
                    publicDir
                } else {
                    val extDir = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "ShareBear")
                    if (!extDir.exists()) extDir.mkdirs()
                    extDir
                }
            } catch (e: Exception) {
                val fallback = File(context.cacheDir, "downloads")
                if (!fallback.exists()) fallback.mkdirs()
                fallback
            }

            val destinationFile = getUniqueDestinationFile(downloadDir, fileName)
            val fileOutputStream = FileOutputStream(destinationFile)

            val inputStream = request.rawInputStream
            val buffer = ByteArray(64 * 1024)
            var totalBytesRead: Long = 0

            while (fileSize <= 0 || totalBytesRead < fileSize) {
                val bytesToRead = if (fileSize > 0) {
                    Math.min(buffer.size.toLong(), fileSize - totalBytesRead).toInt()
                } else {
                    buffer.size
                }

                val bytesRead = inputStream.read(buffer, 0, bytesToRead)
                if (bytesRead == -1) break
                fileOutputStream.write(buffer, 0, bytesRead)
                totalBytesRead += bytesRead

                // Emit progress to React Native
                onDownloadProgress(transferId, totalBytesRead, fileSize)
            }

            fileOutputStream.flush()
            fileOutputStream.close()

            // File verification
            if (totalBytesRead == fileSize) {
                Log.i(TAG, "Download complete and verified: ${destinationFile.absolutePath}")

                // Scan into Android MediaStore so Gallery & Downloads immediately list it
                try {
                    MediaScannerConnection.scanFile(
                        context,
                        arrayOf(destinationFile.absolutePath),
                        arrayOf(mimeType),
                        null
                    )
                } catch (ignored: Exception) {}

                onDownloadComplete(transferId, destinationFile.absolutePath, totalBytesRead)
                
                val json = JSONObject().apply {
                    put("status", "success")
                    put("filePath", destinationFile.absolutePath)
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

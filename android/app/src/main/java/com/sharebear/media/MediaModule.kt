package com.sharebear.media

import android.content.ContentUris
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File

class MediaModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MediaModule"
    }

    @ReactMethod
    fun getMediaFiles(category: String, limit: Int, promise: Promise) {
        try {
            val contentResolver = reactContext.contentResolver
            val list = WritableNativeArray()

            when (category.lowercase()) {
                "photo", "photos", "image", "images" -> {
                    val projection = arrayOf(
                        MediaStore.Images.Media._ID,
                        MediaStore.Images.Media.DISPLAY_NAME,
                        MediaStore.Images.Media.SIZE,
                        MediaStore.Images.Media.MIME_TYPE,
                        MediaStore.Images.Media.DATE_MODIFIED
                    )
                    val sortOrder = "${MediaStore.Images.Media.DATE_MODIFIED} DESC"
                    val cursor: Cursor? = contentResolver.query(
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                        projection,
                        null,
                        null,
                        sortOrder
                    )

                    cursor?.use {
                        val idColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
                        val nameColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME)
                        val sizeColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE)
                        val mimeColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media.MIME_TYPE)

                        var count = 0
                        while (it.moveToNext() && (limit <= 0 || count < limit)) {
                            val id = it.getLong(idColumn)
                            val name = it.getString(nameColumn) ?: "photo_${id}.jpg"
                            val size = it.getLong(sizeColumn)
                            val mime = it.getString(mimeColumn) ?: "image/jpeg"
                            val contentUri: Uri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id)

                            val map = WritableNativeMap().apply {
                                putString("id", "img_$id")
                                putString("name", name)
                                putDouble("size", size.toDouble())
                                putString("mime", mime)
                                putString("uri", contentUri.toString())
                                putString("type", "photo")
                            }
                            list.pushMap(map)
                            count++
                        }
                    }
                }
                "video", "videos" -> {
                    val projection = arrayOf(
                        MediaStore.Video.Media._ID,
                        MediaStore.Video.Media.DISPLAY_NAME,
                        MediaStore.Video.Media.SIZE,
                        MediaStore.Video.Media.MIME_TYPE,
                        MediaStore.Video.Media.DATE_MODIFIED
                    )
                    val sortOrder = "${MediaStore.Video.Media.DATE_MODIFIED} DESC"
                    val cursor: Cursor? = contentResolver.query(
                        MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                        projection,
                        null,
                        null,
                        sortOrder
                    )

                    cursor?.use {
                        val idColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media._ID)
                        val nameColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME)
                        val sizeColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE)
                        val mimeColumn = it.getColumnIndexOrThrow(MediaStore.Video.Media.MIME_TYPE)

                        var count = 0
                        while (it.moveToNext() && (limit <= 0 || count < limit)) {
                            val id = it.getLong(idColumn)
                            val name = it.getString(nameColumn) ?: "video_${id}.mp4"
                            val size = it.getLong(sizeColumn)
                            val mime = it.getString(mimeColumn) ?: "video/mp4"
                            val contentUri: Uri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id)

                            val map = WritableNativeMap().apply {
                                putString("id", "vid_$id")
                                putString("name", name)
                                putDouble("size", size.toDouble())
                                putString("mime", mime)
                                putString("uri", contentUri.toString())
                                putString("type", "video")
                            }
                            list.pushMap(map)
                            count++
                        }
                    }
                }
                "music", "audio" -> {
                    val projection = arrayOf(
                        MediaStore.Audio.Media._ID,
                        MediaStore.Audio.Media.DISPLAY_NAME,
                        MediaStore.Audio.Media.SIZE,
                        MediaStore.Audio.Media.MIME_TYPE,
                        MediaStore.Audio.Media.DATE_MODIFIED
                    )
                    val sortOrder = "${MediaStore.Audio.Media.DATE_MODIFIED} DESC"
                    val cursor: Cursor? = contentResolver.query(
                        MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                        projection,
                        null,
                        null,
                        sortOrder
                    )

                    cursor?.use {
                        val idColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                        val nameColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)
                        val sizeColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE)
                        val mimeColumn = it.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)

                        var count = 0
                        while (it.moveToNext() && (limit <= 0 || count < limit)) {
                            val id = it.getLong(idColumn)
                            val name = it.getString(nameColumn) ?: "audio_${id}.mp3"
                            val size = it.getLong(sizeColumn)
                            val mime = it.getString(mimeColumn) ?: "audio/mpeg"
                            val contentUri: Uri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id)

                            val map = WritableNativeMap().apply {
                                putString("id", "aud_$id")
                                putString("name", name)
                                putDouble("size", size.toDouble())
                                putString("mime", mime)
                                putString("uri", contentUri.toString())
                                putString("type", "music")
                            }
                            list.pushMap(map)
                            count++
                        }
                    }
                }
                "doc", "docs", "documents" -> {
                    val projection = arrayOf(
                        MediaStore.Files.FileColumns._ID,
                        MediaStore.Files.FileColumns.DISPLAY_NAME,
                        MediaStore.Files.FileColumns.SIZE,
                        MediaStore.Files.FileColumns.MIME_TYPE,
                        MediaStore.Files.FileColumns.DATE_MODIFIED
                    )
                    val mimeSelection = "${MediaStore.Files.FileColumns.MIME_TYPE} LIKE 'application/%' OR ${MediaStore.Files.FileColumns.MIME_TYPE} LIKE 'text/%'"
                    val sortOrder = "${MediaStore.Files.FileColumns.DATE_MODIFIED} DESC"
                    val cursor: Cursor? = contentResolver.query(
                        MediaStore.Files.getContentUri("external"),
                        projection,
                        mimeSelection,
                        null,
                        sortOrder
                    )

                    cursor?.use {
                        val idColumn = it.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
                        val nameColumn = it.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DISPLAY_NAME)
                        val sizeColumn = it.getColumnIndexOrThrow(MediaStore.Files.FileColumns.SIZE)
                        val mimeColumn = it.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MIME_TYPE)

                        var count = 0
                        while (it.moveToNext() && (limit <= 0 || count < limit)) {
                            val id = it.getLong(idColumn)
                            val name = it.getString(nameColumn) ?: "doc_${id}"
                            val size = it.getLong(sizeColumn)
                            val mime = it.getString(mimeColumn) ?: "application/pdf"
                            val contentUri: Uri = ContentUris.withAppendedId(MediaStore.Files.getContentUri("external"), id)

                            val map = WritableNativeMap().apply {
                                putString("id", "doc_$id")
                                putString("name", name)
                                putDouble("size", size.toDouble())
                                putString("mime", mime)
                                putString("uri", contentUri.toString())
                                putString("type", "doc")
                            }
                            list.pushMap(map)
                            count++
                        }
                    }
                }
            }

            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("MEDIA_QUERY_ERROR", e.message, e)
        }
    }
}

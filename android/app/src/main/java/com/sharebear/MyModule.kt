package com.sharebear

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.*

class MyModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MyModule"
    }

    @ReactMethod
    fun hello(name: String, promise: Promise) {
        promise.resolve("Hello $name from Kotlin")
    }

    @ReactMethod
    fun getClipboardText(promise: Promise) {
        reactContext.runOnUiQueueThread {
            try {
                val clipboard = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                if (clipboard != null && clipboard.hasPrimaryClip()) {
                    val clip = clipboard.primaryClip
                    if (clip != null && clip.itemCount > 0) {
                        val text = clip.getItemAt(0).coerceToText(reactContext).toString()
                        promise.resolve(text)
                        return@runOnUiQueueThread
                    }
                }
                promise.resolve("")
            } catch (e: Exception) {
                promise.reject("CLIPBOARD_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun setClipboardText(text: String, promise: Promise) {
        reactContext.runOnUiQueueThread {
            try {
                val clipboard = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                val clip = ClipData.newPlainText("ShareBear", text)
                clipboard?.setPrimaryClip(clip)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("CLIPBOARD_SET_ERROR", e.message, e)
            }
        }
    }
}
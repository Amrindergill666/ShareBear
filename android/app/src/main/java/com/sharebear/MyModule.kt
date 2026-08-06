package com.sharebear

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
}
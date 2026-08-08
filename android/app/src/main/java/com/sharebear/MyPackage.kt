package com.sharebear

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.sharebear.network.NetworkModule
import com.sharebear.theme.DynamicColorsModule

class MyPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> {

        return listOf(
            MyModule(reactContext),
            NetworkModule(reactContext),
            DynamicColorsModule(reactContext)
        )
    }

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> {

        return emptyList()
    }
}
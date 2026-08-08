package com.sharebear.theme

import android.content.res.Configuration
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class DynamicColorsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DynamicColorsModule"
    }

    private val shades = intArrayOf(0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000)

    private fun isDarkMode(): Boolean {
        val currentNightMode = reactContext.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        return currentNightMode == Configuration.UI_MODE_NIGHT_YES
    }

    private fun getNamedColorHex(name: String, fallback: String): String {
        return try {
            val resId = reactContext.resources.getIdentifier(name, "color", "android")
            if (resId != 0) {
                val color = ContextCompat.getColor(reactContext, resId)
                String.format("#%06X", 0xFFFFFF and color)
            } else {
                fallback
            }
        } catch (e: Exception) {
            fallback
        }
    }

    private fun getTonalPalette(prefix: String, defaultHueHex: String): WritableMap {
        val map = Arguments.createMap()
        for (shade in shades) {
            val resName = "${prefix}_$shade"
            val hex = getNamedColorHex(resName, defaultHueHex)
            map.putString(shade.toString(), hex)
        }
        return map
    }

    private fun buildColorsMap(): WritableMap {
        val root = Arguments.createMap()
        val isSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
        val isDark = isDarkMode()

        root.putBoolean("isSupported", isSupported)
        root.putBoolean("isDarkMode", isDark)

        if (isSupported) {
            root.putMap("accent1", getTonalPalette("system_accent1", "#3B82F6"))
            root.putMap("accent2", getTonalPalette("system_accent2", "#10B981"))
            root.putMap("accent3", getTonalPalette("system_accent3", "#F59E0B"))
            root.putMap("neutral1", getTonalPalette("system_neutral1", "#0F172A"))
            root.putMap("neutral2", getTonalPalette("system_neutral2", "#1E293B"))

            // Pre-computed Semantic Tokens for easy immediate styling
            val primary = getNamedColorHex(if (isDark) "system_accent1_200" else "system_accent1_600", "#3B82F6")
            val primaryContainer = getNamedColorHex(if (isDark) "system_accent1_800" else "system_accent1_100", "#1E3A8A")
            val onPrimary = getNamedColorHex(if (isDark) "system_accent1_900" else "system_accent1_0", "#FFFFFF")
            val onPrimaryContainer = getNamedColorHex(if (isDark) "system_accent1_100" else "system_accent1_900", "#DBEAFE")

            val secondary = getNamedColorHex(if (isDark) "system_accent2_200" else "system_accent2_600", "#57B5B6")
            val secondaryContainer = getNamedColorHex(if (isDark) "system_accent2_800" else "system_accent2_100", "#0F2938")
            val onSecondary = getNamedColorHex(if (isDark) "system_accent2_900" else "system_accent2_0", "#FFFFFF")
            val onSecondaryContainer = getNamedColorHex(if (isDark) "system_accent2_100" else "system_accent2_900", "#CCFBF1")

            val tertiary = getNamedColorHex(if (isDark) "system_accent3_200" else "system_accent3_600", "#FBBF24")
            val tertiaryContainer = getNamedColorHex(if (isDark) "system_accent3_800" else "system_accent3_100", "#451A03")

            val background = getNamedColorHex(if (isDark) "system_neutral1_900" else "system_neutral1_50", "#051521")
            val surface = getNamedColorHex(if (isDark) "system_neutral1_800" else "system_neutral1_10", "#0B1D2C")
            val surfaceVariant = getNamedColorHex(if (isDark) "system_neutral2_700" else "system_neutral2_100", "#172E42")
            val surfaceElevated = getNamedColorHex(if (isDark) "system_neutral1_700" else "system_neutral1_100", "#1E3A52")

            val outline = getNamedColorHex(if (isDark) "system_neutral2_500" else "system_neutral2_400", "#2D475D")
            val outlineVariant = getNamedColorHex(if (isDark) "system_neutral2_700" else "system_neutral2_200", "#1E3345")

            val textPrimary = getNamedColorHex(if (isDark) "system_neutral1_50" else "system_neutral1_900", "#F8FAFC")
            val textSecondary = getNamedColorHex(if (isDark) "system_neutral2_200" else "system_neutral2_700", "#94A3B8")
            val textMuted = getNamedColorHex(if (isDark) "system_neutral2_400" else "system_neutral2_500", "#64748B")

            val semantic = Arguments.createMap().apply {
                putString("primary", primary)
                putString("primaryContainer", primaryContainer)
                putString("onPrimary", onPrimary)
                putString("onPrimaryContainer", onPrimaryContainer)
                putString("secondary", secondary)
                putString("secondaryContainer", secondaryContainer)
                putString("onSecondary", onSecondary)
                putString("onSecondaryContainer", onSecondaryContainer)
                putString("tertiary", tertiary)
                putString("tertiaryContainer", tertiaryContainer)
                putString("background", background)
                putString("surface", surface)
                putString("surfaceVariant", surfaceVariant)
                putString("surfaceElevated", surfaceElevated)
                putString("outline", outline)
                putString("outlineVariant", outlineVariant)
                putString("textPrimary", textPrimary)
                putString("textSecondary", textSecondary)
                putString("textMuted", textMuted)
            }
            root.putMap("semantic", semantic)
        }

        return root
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getDynamicColorsSync(): WritableMap {
        return buildColorsMap()
    }

    @ReactMethod
    fun getDynamicColors(promise: Promise) {
        try {
            val colors = buildColorsMap()
            promise.resolve(colors)
        } catch (e: Exception) {
            promise.reject("ERROR_DYNAMIC_COLORS", e.message, e)
        }
    }

    @ReactMethod
    fun isDynamicColorAvailable(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
    }

    fun emitColorsChanged() {
        if (reactContext.hasActiveReactInstance()) {
            val colors = buildColorsMap()
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onDynamicColorsChanged", colors)
        }
    }
}

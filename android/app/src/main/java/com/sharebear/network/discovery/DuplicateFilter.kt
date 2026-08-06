package com.sharebear.network.discovery

import java.util.Collections
import java.util.LinkedHashMap

/**
 * Thread-safe filter that tracks recently processed message signatures
 * to prevent duplicate packet processing.
 */
class DuplicateFilter(private val maxEntries: Int = 100) {
    private val processedSignatures = Collections.synchronizedMap(
        object : LinkedHashMap<String, Boolean>(maxEntries, 0.75f, true) {
            override fun removeEldestEntry(eldest: Map.Entry<String, Boolean>?): Boolean {
                return size > maxEntries
            }
        }
    )

    /**
     * Checks if the signature was already processed. If not, marks it as processed.
     */
    fun isDuplicate(signature: String): Boolean {
        if (processedSignatures.containsKey(signature)) {
            return true
        }
        processedSignatures[signature] = true
        return false
    }

    fun clear() {
        processedSignatures.clear()
    }
}

package com.sharebear.network.discovery

import android.util.Log
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

/**
 * Handles the timing and interval scheduling of UDP broadcasts:
 * Immediate broadcast on start, then delays of 2s, 5s, 10s, and repeating at a 15s interval.
 */
class DiscoveryScheduler(private val broadcastAction: () -> Unit) {
    private val TAG = "DiscoveryScheduler"
    private var scheduler: ScheduledExecutorService? = null
    @Volatile private var isRunning = false

    private val progressionDelays = listOf(2000L, 5000L, 10000L)

    @Synchronized
    fun start() {
        if (isRunning) return
        isRunning = true
        scheduler = Executors.newSingleThreadScheduledExecutor()

        // Send the initial broadcast immediately
        try {
            broadcastAction()
        } catch (e: Exception) {
            Log.e(TAG, "Initial broadcast failed: ${e.message}")
        }

        // Kick off scheduling sequence
        scheduleNext(0)
    }

    @Synchronized
    fun stop() {
        isRunning = false
        scheduler?.shutdownNow()
        scheduler = null
    }

    private fun scheduleNext(index: Int) {
        val currentScheduler = scheduler ?: return
        if (!isRunning || currentScheduler.isShutdown) return

        val delayMs = if (index < progressionDelays.size) {
            progressionDelays[index]
        } else {
            15000L // Keep a constant 15s interval once the sequence finishes
        }

        currentScheduler.schedule({
            if (isRunning) {
                try {
                    broadcastAction()
                } catch (e: Exception) {
                    Log.e(TAG, "Scheduled broadcast failed: ${e.message}")
                }
                scheduleNext(index + 1)
            }
        }, delayMs, TimeUnit.MILLISECONDS)
    }
}

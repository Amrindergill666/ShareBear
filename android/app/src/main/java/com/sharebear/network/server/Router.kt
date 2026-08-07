package com.sharebear.network.server

import com.sharebear.network.server.models.Request
import com.sharebear.network.server.models.Response
import java.util.concurrent.ConcurrentHashMap

/**
 * Interface that all endpoint handlers must implement.
 */
interface RequestHandler {
    fun handle(request: Request): Response
}

/**
 * Registers routes and routes incoming requests to their respective handlers.
 */
class Router {
    private val routes = ConcurrentHashMap<String, RequestHandler>()

    /**
     * Registers a RequestHandler for a specific path.
     */
    fun register(path: String, handler: RequestHandler) {
        routes[path] = handler
    }

    /**
     * Routes a Request and returns a Response.
     */
    fun route(request: Request): Response {
        val handler = routes[request.path] ?: return Response.error(404, "Endpoint not found: ${request.path}")

        // For this Phase, we allow GET and POST requests
        if (request.method != "GET" && request.method != "POST") {
            return Response.error(405, "Method ${request.method} is not allowed")
        }

        return try {
            handler.handle(request)
        } catch (e: Exception) {
            Response.error(500, "Internal Server Error: ${e.message}")
        }
    }
}

#!/usr/bin/env bun

/**
 * Simple CORS Proxy for LM Studio (Bun Version)
 *
 * This proxy server solves CORS issues when accessing LM Studio from GitHub Pages.
 *
 * Usage:
 * 1. Run: bun cors-proxy.js
 * 2. Configure your GitHub Pages chat to use "LM Studio (via CORS Proxy)"
 */

const PORT = process.env.PORT || 8080;
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || "http://localhost:1234";

// CORS configuration - add your GitHub Pages URL here
const allowedOrigins = [
  "https://yourusername.github.io", // Replace with your actual GitHub Pages URL
  "http://localhost:3000", // For local development
  "http://localhost:5173", // For Vite dev server
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

function isOriginAllowed(origin) {
  if (!origin) return true; // Allow requests with no origin
  return allowedOrigins.some((allowed) => origin.startsWith(allowed));
}

function addCORSHeaders(headers, origin) {
  if (isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin || "*");
  }
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, x-stainless-os, x-stainless-arch, x-stainless-lang, x-stainless-package-version, x-stainless-runtime, x-stainless-retry-count,x-stainless-runtime-version, User-Agent",
  );
  headers.set("Access-Control-Allow-Credentials", "true");
  return headers;
}

async function proxyRequest(request, targetPath) {
  const url = new URL(request.url);
  const targetUrl = `${LM_STUDIO_URL}${targetPath}`;

  console.log(`Proxying: ${request.method} ${url.pathname} -> ${targetUrl}`);

  try {
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.blob()
          : undefined,
    });

    const response = await fetch(proxyRequest);

    // Clone the response to modify headers
    const responseHeaders = new Headers(response.headers);
    addCORSHeaders(responseHeaders, request.headers.get("Origin"));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error.message);

    const errorHeaders = new Headers();
    addCORSHeaders(errorHeaders, request.headers.get("Origin"));

    return new Response(
      JSON.stringify({
        error: "Proxy error",
        message:
          "Unable to connect to LM Studio. Make sure it's running on port 1234.",
        target: LM_STUDIO_URL,
      }),
      {
        status: 500,
        headers: {
          ...Object.fromEntries(errorHeaders),
          "Content-Type": "application/json",
        },
      },
    );
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      const headers = new Headers();
      addCORSHeaders(headers, origin);
      return new Response(null, { status: 204, headers });
    }

    // Check origin for non-preflight requests
    if (origin && !isOriginAllowed(origin)) {
      console.log("CORS blocked origin:", origin);
      return new Response("Not allowed by CORS", { status: 403 });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      const headers = new Headers({ "Content-Type": "application/json" });
      addCORSHeaders(headers, origin);

      return new Response(
        JSON.stringify(
          {
            status: "ok",
            timestamp: new Date().toISOString(),
            proxyTarget: LM_STUDIO_URL,
            allowedOrigins,
          },
          null,
          2,
        ),
        { headers },
      );
    }

    // Proxy /api/v1/* requests to LM Studio
    if (url.pathname.startsWith("/api/v1/")) {
      const targetPath = url.pathname.replace("/api/v1", "/v1") + url.search;
      return proxyRequest(request, targetPath);
    }

    // Default response for unknown paths
    const headers = new Headers({ "Content-Type": "application/json" });
    addCORSHeaders(headers, origin);

    return new Response(
      JSON.stringify(
        {
          message: "LM Studio CORS Proxy Server",
          version: "1.0.0",
          endpoints: {
            health: "/health",
            proxy: "/api/v1/*",
          },
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
      { headers },
    );
  },
});

console.log("\n🚀 CORS Proxy Server Started (Bun)!");
console.log("=".repeat(50));
console.log(`📡 Proxy URL: http://localhost:${server.port}`);
console.log(`🎯 LM Studio: ${LM_STUDIO_URL}`);
console.log(`🌐 Allowed Origins:`);
allowedOrigins.forEach((origin) => console.log(`   - ${origin}`));
console.log("=".repeat(50));
console.log("💡 Usage:");
console.log("   1. Make sure LM Studio is running on port 1234");
console.log('   2. In your chat app, select "LM Studio (via CORS Proxy)"');
console.log("   3. Start chatting!");
console.log(`\n📊 Health check: http://localhost:${server.port}/health`);
console.log("\n" + "=".repeat(50));

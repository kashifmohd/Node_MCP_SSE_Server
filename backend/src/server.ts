import express from "express";
import { config } from "dotenv";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import cors from "cors";

// Node.js fetch polyfill for older Node versions
import fetch from "node-fetch";

// Load environment variables
config();

const server = new McpServer({
  name: "mcp-sse-server",
  version: "1.0.0",
});

// Add an addition tool
server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

// Weather tool using Open-Meteo API (no API key required)
server.tool(
  "weather",
  { city: z.string() },
  async ({ city }: { city: string }) => {
    // Step 1: Geocode city to get latitude and longitude
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    if (!geoRes.ok) {
      return {
        content: [
          { type: "text", text: `Failed to fetch location for city: ${city}` },
        ],
      };
    }
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return {
        content: [
          { type: "text", text: `City not found: ${city}` },
        ],
      };
    }
    const { latitude, longitude, name, country } = geoData.results[0];

    // Step 2: Fetch current weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    if (!weatherRes.ok) {
      return {
        content: [
          { type: "text", text: `Failed to fetch weather for city: ${city}` },
        ],
      };
    }
    const weatherData = await weatherRes.json();
    if (!weatherData.current_weather) {
      return {
        content: [
          { type: "text", text: `Weather data not available for: ${city}` },
        ],
      };
    }
    const w = weatherData.current_weather;
    return {
      content: [
        {
          type: "text",
          text: `Weather for ${name}, ${country}:\nTemperature: ${w.temperature}°C\nWindspeed: ${w.windspeed} km/h\nWeather code: ${w.weathercode}`,
        },
      ],
    };
  }
);

server.tool(
  "search",
  { query: z.string(), count: z.number().optional() },
  async ({ query, count = 5 }: { query: string; count?: number }) => {
    console.log("query==========>", query, count, process.env.BRAVE_API_KEY);
    if (!process.env.BRAVE_API_KEY) {
      throw new Error("BRAVE_API_KEY environment variable is not set");
    }

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
      )}&count=${count}`,
      {
        headers: {
          "X-Subscription-Token": process.env.BRAVE_API_KEY,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data.web?.results || [], null, 2),
        },
      ],
    };
  }
);
// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`,
      },
    ],
  })
);

const app = express();

// Configure CORS middleware to allow all origins
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  })
);

// Add a simple root route handler
app.get("/", (req, res) => {
  res.json({
    name: "MCP SSE Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      "/": "Server information (this response)",
      "/sse": "Server-Sent Events endpoint for MCP connection",
      "/messages": "POST endpoint for MCP messages",
    },
    tools: [
      { name: "add", description: "Add two numbers together" },
      { name: "search", description: "Search the web using Brave Search API" },
    ],
  });
});

let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  // Note: to support multiple simultaneous connections, these messages will
  // need to be routed to a specific matching transport. (This logic isn't
  // implemented here, for simplicity.)
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP SSE Server running on port ${PORT}`);
});

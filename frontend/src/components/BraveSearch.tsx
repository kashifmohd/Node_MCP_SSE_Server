import React, { useEffect, useState } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface Tool {
  name: string;
  description: string;
}

interface ToolDefinition {
  description?: string;
  parameters?: unknown;
}

interface Capabilities {
  tools?: Record<string, ToolDefinition>;
}

export function BraveSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [transport, setTransport] = useState<SSEClientTransport | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [showTools, setShowTools] = useState(false);

  useEffect(() => {
    const setupClient = async () => {
      const newClient = new Client(
        { name: "Brave Search Client", version: "1.0.0" },
        { capabilities: { tools: {} } }
      );

      const newTransport = new SSEClientTransport(
        // new URL("/sse", window.location.origin),
        new URL("/sse", "http://localhost:3001"),
        // new URL("/sse", "https://v4480gc4go8gookgok088w0s.nerding.cloud"),
        {
          requestInit: {
            headers: {
              Accept: "text/event-stream",
            },
          },
        }
      );

      try {
        await newClient.connect(newTransport);
        setClient(newClient);
        setTransport(newTransport);
        console.log("Connected to MCP server");

        // Get tools from server capabilities
        const capabilities = await newClient.listTools();
        console.log("capabilities==========>", capabilities);
        const availableTools = capabilities.tools.map((tool) => ({
          name: tool.name,
          description: tool.description || "No description available",
        }));
        setTools(availableTools);
      } catch (err) {
        setError(`Failed to connect to MCP server: ${(err as Error).message}`);
        console.error("Connection error:", err);
      }
    };

    setupClient();

    return () => {
      transport?.close();
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) {
      setError("Client not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.callTool({
        name: "search",
        arguments: {
          query,
          count: 5,
        },
      });

      if (response.content?.[0]?.text) {
        const searchResults: SearchResult[] = JSON.parse(
          response.content[0].text
        );
        setResults(searchResults);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(`Search failed: ${(err as Error).message}`);
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto px-4 flex flex-col h-[90vh] ${
        results.length === 0 ? "justify-center" : ""
      }`}
    >
      <div className="flex-shrink-0">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Brave Search
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  client ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {client ? "Connected to MCP" : "Connecting to MCP..."}
              </p>
            </div>
            <button
              onClick={() => setShowTools(!showTools)}
              className="text-sm text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300 transition-colors p-2 rounded-full"
            >
              {showTools ? "Hide Tools" : "Show Tools"}
            </button>
          </div>
        </header>

        {showTools && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Available Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map((tool, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the web..."
              className="w-full border h-12 shadow p-4 rounded-full dark:text-gray-800 dark:border-gray-700 dark:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              type="submit"
              disabled={loading || !client}
              className="absolute top-1.5 right-2.5 transition-colors duration-200 bg-gray-200 dark:bg-gray-900 p-2 rounded-full"
            >
              <svg
                className={`h-5 w-5 fill-current ${
                  loading || !client
                    ? "text-gray-400"
                    : "text-teal-400 dark:text-teal-300 hover:text-teal-500 dark:hover:text-teal-400"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 56.966 56.966"
              >
                <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17s-17-7.626-17-17S14.61,6,23.984,6z" />
              </svg>
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-8 text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center mb-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-6 overflow-y-auto flex-grow">
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <h2 className="text-xl font-bold mb-2">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {result.title}
                </a>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 truncate">
                {result.url}
              </p>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                {result.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

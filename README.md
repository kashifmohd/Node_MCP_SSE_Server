# MCP Server-Sent Events (SSE) - Example

A reference implementation for integrating Model Context Protocol (MCP) capabilities into web applications using Server-Sent Events (SSE) as the transport layer.

## Overview

This project demonstrates how to create an MCP server that communicates with clients using the SSE transport protocol. It enables web applications to access powerful MCP capabilities while maintaining a persistent connection for real-time communication with AI models.

Key features:

- Implement MCP servers using Server-Sent Events for web compatibility
- Create custom MCP tools that can be accessed from web clients
- Connect any MCP-compatible client to your SSE-based server
- Extend AI assistants with web-based capabilities through standardized protocols

## What is MCP SSE?

The Model Context Protocol (MCP) supports multiple transport mechanisms, with SSE being ideal for web applications:

- **Server-Sent Events (SSE)**: A web standard for establishing a unidirectional connection where servers can push updates to clients
- **MCP over SSE**: Implements the MCP protocol using SSE as the transport layer, enabling web clients to interact with MCP servers
- **Real-time AI interactions**: Allows continuous streaming of AI responses while maintaining tool execution capabilities

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- NPM or Yarn
- A Brave Search API key for the example search tool

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-sse-example.git
cd mcp-sse-example

# Install backend dependencies
cd backend
npm install
```

### Configuration

Create a `.env` file in the backend directory with your API credentials:

```
BRAVE_API_KEY=your_api_key_here
```

## Usage

### Starting the Server

```bash
# Build and start the server
npm run build
npm run start
```

The MCP SSE server will be available at `http://localhost:3001`.

### Docker Deployment

```bash
# From the project root
docker-compose up -d
```

## How It Works

This implementation uses:

1. **Express.js** as the web server
2. **SSEServerTransport** from the MCP SDK to handle the SSE protocol
3. **McpServer** to register and manage tools

The server exposes two main endpoints:

- `/sse` - For establishing SSE connections
- `/messages` - For receiving messages from clients

## Example Implementation

The core server implementation:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const server = new McpServer({
  name: "Example SSE Server",
  version: "1.0.0",
});

// Register tools
server.tool("example_tool", { param: z.string() }, async ({ param }) => ({
  content: [{ type: "text", text: `Processed: ${param}` }],
}));

const app = express();
let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  await transport.handlePostMessage(req, res);
});

app.listen(3001);
```

## Compatible Clients

Many MCP clients support the SSE transport protocol, including:

- [Claude Desktop App](https://claude.ai/download)
- [Continue](https://github.com/continuedev/continue)
- [Cursor](https://cursor.com)
- [LibreChat](https://github.com/danny-avila/LibreChat)
- And many others listed at [modelcontextprotocol.io/clients](https://modelcontextprotocol.io/clients)

## Debugging

When debugging your MCP SSE implementation:

```bash
# Follow logs in real-time (for MacOS)
tail -n 20 -F ~/Library/Logs/Claude/mcp*.log
```

For more detailed debugging instructions, see the [MCP debugging guide](https://modelcontextprotocol.io/docs/tools/debugging).

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Resources

- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP documentation
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official TypeScript implementation
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Interactive tool for testing MCP servers

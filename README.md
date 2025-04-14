# Apollo.io MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Apollo.io API](https://img.shields.io/badge/Apollo.io%20API-v1-orange.svg)](https://docs.apollo.io/reference/introduction)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.8.0-green.svg)](https://github.com/modelcontextprotocol/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful Model Context Protocol (MCP) server implementation for seamless Apollo.io API integration, enabling AI assistants to interact with Apollo.io data.

## Overview

This MCP server provides a comprehensive set of tools for interacting with the Apollo.io API, allowing AI assistants to:

- Enrich data for people and organizations
- Search for people and organizations
- Find job postings for specific organizations
- Perform Apollo.io operations without leaving your AI assistant interface

## Why Use This MCP Server?

- **Seamless AI Integration**: Connect your AI assistants directly to Apollo.io data
- **Simplified API Operations**: Perform common Apollo.io tasks through natural language commands
- **Real-time Data Access**: Get up-to-date information from Apollo.io
- **Secure Authentication**: Uses Apollo.io's secure API token authentication
- **Extensible Design**: Easily add more Apollo.io API capabilities as needed

## Installation

```bash
# Clone the repository
git clone https://github.com/lkm1developer/apollo-io-mcp-server.git
cd apollo-io-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

The server requires an Apollo.io API access token. You can obtain one by:

1. Going to your [Apollo.io Account](https://app.apollo.io/)
2. Navigating to Settings > API
3. Generating an API key

You can provide the token in two ways:

1. As an environment variable:
   ```
   APOLLO_IO_API_KEY=your-api-key
   ```

2. As a command-line argument:
   ```
   npm start -- --api-key=your-api-key
   ```

For development, create a `.env` file in the project root to store your environment variables:

```
APOLLO_IO_API_KEY=your-api-key
```

## Usage

### Starting the Server

```bash
# Start the server
npm start

# Or with a specific API key
npm start -- --api-key=your-api-key

# Run the SSE server with authentication
npx mcp-proxy-auth node dist/index.js
```

### Implementing Authentication in SSE Server

The SSE server uses the [mcp-proxy-auth](https://www.npmjs.com/package/mcp-proxy-auth) package for authentication. To implement authentication:

1. Install the package:
   ```bash
   npm install mcp-proxy-auth
   ```

2. Set the `AUTH_SERVER_URL` environment variable to point to your API key verification endpoint:
   ```bash
   export AUTH_SERVER_URL=https://your-auth-server.com/verify
   ```

3. Run the SSE server with authentication:
   ```bash
   npx mcp-proxy-auth node dist/index.js
   ```

4. The SSE URL will be available at:
   ```
   localhost:8080/sse?apiKey=apikey
   ```

   Replace `apikey` with your actual API key for authentication.

The `mcp-proxy-auth` package acts as a proxy that:
- Intercepts requests to your SSE server
- Verifies API keys against your authentication server
- Only allows authenticated requests to reach your SSE endpoint

### Integrating with AI Assistants

This MCP server is designed to work with AI assistants that support the Model Context Protocol. Once running, the server exposes a set of tools that can be used by compatible AI assistants to interact with Apollo.io data.

### Available Tools

The server exposes the following powerful Apollo.io integration tools:

1. **people_enrichment**
   - Use the People Enrichment endpoint to enrich data for 1 person
   - Parameters:
     - `first_name` (string, optional): Person's first name
     - `last_name` (string, optional): Person's last name
     - `email` (string, optional): Person's email address
     - `domain` (string, optional): Company domain
     - `organization_name` (string, optional): Organization name
   - Example:
     ```json
     {
       "first_name": "John",
       "last_name": "Doe",
       "email": "john.doe@example.com"
     }
     ```

2. **organization_enrichment**
   - Use the Organization Enrichment endpoint to enrich data for 1 company
   - Parameters:
     - `domain` (string, optional): Company domain
     - `name` (string, optional): Company name
   - Example:
     ```json
     {
       "domain": "apollo.io"
     }
     ```

3. **people_search**
   - Use the People Search endpoint to find people
   - Parameters:
     - `q_organization_domains_list` (array, optional): List of organization domains to search within
     - `person_titles` (array, optional): List of job titles to search for
     - `person_seniorities` (array, optional): List of seniority levels to search for
   - Example:
     ```json
     {
       "person_titles": ["Marketing Manager"],
       "person_seniorities": ["vp"],
       "q_organization_domains_list": ["apollo.io"]
     }
     ```

4. **organization_search**
   - Use the Organization Search endpoint to find organizations
   - Parameters:
     - `q_organization_domains_list` (array, optional): List of organization domains to search for
     - `organization_locations` (array, optional): List of organization locations to search for
   - Example:
     ```json
     {
       "organization_locations": ["Japan", "Ireland"]
     }
     ```

5. **organization_job_postings**
   - Use the Organization Job Postings endpoint to find job postings for a specific organization
   - Parameters:
     - `organization_id` (string, required): Apollo.io organization ID
   - Example:
     ```json
     {
       "organization_id": "5e60b6381c85b4008c83"
     }
     ```

## Extending the Server

The server is designed to be easily extensible. To add new Apollo.io API capabilities:

1. Add new methods to the `ApolloClient` class in `src/apollo-client.ts`
2. Register new tools in the `setupToolHandlers` method in `src/index.ts`
3. Rebuild the project with `npm run build`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Keywords

Apollo.io, Model Context Protocol, MCP, AI Assistant, TypeScript, API Integration, Apollo.io API, People Enrichment, Organization Enrichment, People Search, Organization Search, Job Postings, AI Tools

#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ApolloClient, BulkPeopleEnrichmentQuery } from "./apollo-client.js";
import dotenv from "dotenv";
import { parseArgs } from "node:util";

// Load environment variables
dotenv.config();

// Parse command line arguments
const { values } = parseArgs({
  options: {
    "api-key": { type: "string" },
  },
});

// Initialize Apollo.io client
const apiKey = values["api-key"] || process.env.APOLLO_IO_API_KEY;
if (!apiKey) {
  throw new Error("APOLLO_IO_API_KEY environment variable is required");
}

// Utility function to sanitize range formats
function sanitizeRanges(ranges: string[] | undefined): string[] | undefined {
  if (!ranges || !Array.isArray(ranges)) return ranges;

  return ranges.map((range) => {
    // If the range contains a hyphen, convert it to a comma
    if (typeof range === "string" && range.includes("-")) {
      return range.replace("-", ",");
    }
    return range;
  });
}

class ApolloServer {
  // Core server properties
  private server: Server;
  private apollo: ApolloClient;

  constructor() {
    this.server = new Server(
      {
        name: "apollo-io-manager",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.apollo = new ApolloClient(apiKey);

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on("uncaughtException", (error) => {
      console.error("Uncaught exception:", error);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled rejection at:", promise, "reason:", reason);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Define available tools
      const tools: Tool[] = [
        {
          name: "people_enrichment",
          description:
            "Use the People Enrichment endpoint to enrich data for 1 person",
          inputSchema: {
            type: "object",
            properties: {
              first_name: {
                type: "string",
                description: "Person's first name",
              },
              last_name: {
                type: "string",
                description: "Person's last name",
              },
              email: {
                type: "string",
                description: "Person's email address",
              },
              domain: {
                type: "string",
                description: "Company domain",
              },
              organization_name: {
                type: "string",
                description: "Organization name",
              },
              linkedin_url: {
                type: "string",
                description: "Person's LinkedIn profile URL",
              },
            },
          },
        },
        {
          name: "organization_enrichment",
          description:
            "Use the Organization Enrichment endpoint to enrich data for 1 company",
          inputSchema: {
            type: "object",
            properties: {
              domain: {
                type: "string",
                description: "Company domain",
              },
              name: {
                type: "string",
                description: "Company name",
              },
            },
          },
        },
        {
          name: "people_search",
          description: "Use the People Search endpoint to find people",
          inputSchema: {
            type: "object",
            properties: {
              q_organization_domains_list: {
                type: "array",
                items: { type: "string" },
                description:
                  "The domain names for the person's employer (current or previous). Do not include www. Up to 1,000 domains per request.",
              },
              person_titles: {
                type: "array",
                items: { type: "string" },
                description:
                  "Job titles held by the people you want to find. Results include similar titles unless include_similar_titles is set to false.",
              },
              include_similar_titles: {
                type: "boolean",
                description:
                  "When false, only returns exact matches for titles specified in person_titles. Default is true.",
              },
              person_locations: {
                type: "array",
                items: { type: "string" },
                description:
                  "Locations where people live. Can search cities, US states, and countries.",
              },
              person_seniorities: {
                type: "array",
                items: { type: "string" },
                description:
                  "Job seniority levels. Options: owner, founder, c_suite, partner, vp, head, director, manager, senior, entry, intern.",
              },
              organization_locations: {
                type: "array",
                items: { type: "string" },
                description:
                  "Location of company headquarters for a person's current employer.",
              },
              contact_email_status: {
                type: "array",
                items: { type: "string" },
                description:
                  "Email statuses to search for. Options: verified, unverified, likely to engage, unavailable.",
              },
              organization_ids: {
                type: "array",
                items: { type: "string" },
                description:
                  "Apollo IDs for specific companies to include in search results.",
              },
              organization_num_employees_ranges: {
                type: "array",
                items: { type: "string" },
                description:
                  "Number ranges of employees at the person's company. Format: 'min,max' or 'min-max' (e.g., '1,10' or '1-10').",
              },
              q_keywords: {
                type: "string",
                description: "String of words to filter results by.",
              },
              page: {
                type: "number",
                description: "The page number of results to retrieve.",
              },
              per_page: {
                type: "number",
                description: "Number of search results to return per page.",
              },
            },
          },
        },
        {
          name: "organization_search",
          description:
            "Use the Organization Search endpoint to find organizations",
          inputSchema: {
            type: "object",
            properties: {
              q_organization_domains_list: {
                type: "array",
                items: { type: "string" },
                description: "List of organization domains to search for",
              },
              organization_locations: {
                type: "array",
                items: { type: "string" },
                description: "List of organization locations to search for",
              },
              organization_num_employees_ranges: {
                type: "array",
                items: { type: "string" },
                description:
                  'List of employee count ranges to filter by. Format: "min,max" (e.g., "1,10", "11,50", "51,200", etc.) or "min-max" (e.g., "1-10", "11-50", "51-200", etc.)',
              },
              organization_not_locations: {
                type: "array",
                items: { type: "string" },
                description:
                  'List of locations to exclude from search (e.g., "ireland", "minnesota", etc.)',
              },
              revenue_range: {
                type: "object",
                properties: {
                  min: {
                    type: "number",
                    description: "Minimum revenue (e.g., 300000)",
                  },
                  max: {
                    type: "number",
                    description: "Maximum revenue (e.g., 50000000)",
                  },
                },
                description:
                  "Revenue range to filter by (do not include currency symbols or commas)",
              },
              currently_using_any_of_technology_uids: {
                type: "array",
                items: { type: "string" },
                description:
                  'Technologies the company is using (e.g., "salesforce", "google_analytics", etc.)',
              },
              q_organization_keyword_tags: {
                type: "array",
                items: { type: "string" },
                description:
                  'Keywords associated with companies (e.g., "mining", "consulting", etc.)',
              },
              q_organization_name: {
                type: "string",
                description:
                  'Filter results by company name (e.g., "apollo" or "mining")',
              },
              organization_ids: {
                type: "array",
                items: { type: "string" },
                description:
                  "Specific Apollo organization IDs to include in search",
              },
              page: {
                type: "number",
                description: "Page number for pagination",
              },
              per_page: {
                type: "number",
                description: "Number of results per page",
              },
            },
          },
        },
        {
          name: "organization_job_postings",
          description:
            "Use the Organization Job Postings endpoint to find job postings for a specific organization",
          inputSchema: {
            type: "object",
            properties: {
              organization_id: {
                type: "string",
                description: "Apollo.io organization ID",
              },
            },
            required: ["organization_id"],
          },
        },
        {
          name: "get_person_email",
          description: "Get email address for a person using their Apollo ID",
          inputSchema: {
            type: "object",
            properties: {
              apollo_id: {
                type: "string",
                description: "Apollo.io person ID",
              },
            },
            required: ["apollo_id"],
          },
        },
        {
          name: "employees_of_company",
          description:
            "Find employees of a company using company name or website/LinkedIn URL",
          inputSchema: {
            type: "object",
            properties: {
              company: {
                type: "string",
                description: "Company name",
              },
              website_url: {
                type: "string",
                description: "Company website URL",
              },
              linkedin_url: {
                type: "string",
                description: "Company LinkedIn URL",
              },
              person_seniorities: {
                type: "string",
                description:
                  "Comma-separated list of seniority levels to filter by",
              },
            },
            required: ["company"],
          },
        },
        {
          name: "bulk_people_enrichment",
          description:
            "Use the Bulk People Enrichment endpoint to enrich data for up to 10 people with a single API call",
          inputSchema: {
            type: "object",
            properties: {
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    first_name: {
                      type: "string",
                      description: "Person's first name",
                    },
                    last_name: {
                      type: "string",
                      description: "Person's last name",
                    },
                    email: {
                      type: "string",
                      description: "Person's email address",
                    },
                    domain: {
                      type: "string",
                      description: "Company domain",
                    },
                    organization_name: {
                      type: "string",
                      description: "Organization name",
                    },
                    linkedin_url: {
                      type: "string",
                      description: "Person's LinkedIn profile URL",
                    },
                  },
                },
                description: "Array of people to enrich (max 10)",
              },
              reveal_personal_emails: {
                type: "boolean",
                description:
                  "Set to true to enrich with personal emails (may consume credits). Default is false.",
              },
              reveal_phone_number: {
                type: "boolean",
                description:
                  "Set to true to enrich with phone numbers (may consume credits). Requires webhook_url. Default is false.",
              },
              webhook_url: {
                type: "string",
                description:
                  "Webhook URL where Apollo will send phone number data (required if reveal_phone_number is true)",
              },
            },
            required: ["details"],
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments ?? {};

        // Apply sanitization for organization search params
        if (
          request.params.name === "organization_search" &&
          args.organization_num_employees_ranges
        ) {
          args.organization_num_employees_ranges = sanitizeRanges(
            args.organization_num_employees_ranges as string[]
          );
        }

        switch (request.params.name) {
          case "bulk_people_enrichment": {
            // Asserting that args has the required 'details' property
            if (!args.details || !Array.isArray(args.details)) {
              throw new Error(
                "The 'details' array is required for bulk people enrichment"
              );
            }

            // Type assertion to tell TypeScript that args matches the required interface
            const result = await this.apollo.bulkPeopleEnrichment(
              args as BulkPeopleEnrichmentQuery
            );
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }
          case "people_enrichment": {
            const result = await this.apollo.peopleEnrichment(args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "organization_enrichment": {
            const result = await this.apollo.organizationEnrichment(args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "people_search": {
            const result = await this.apollo.peopleSearch(args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "organization_search": {
            const result = await this.apollo.organizationSearch(args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "organization_job_postings": {
            const result = await this.apollo.organizationJobPostings(
              args.organization_id as string
            );
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "get_person_email": {
            const result = await this.apollo.getPersonEmail(
              args.apollo_id as string
            );
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "employees_of_company": {
            const result = await this.apollo.employeesOfCompany(args as any);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error: any) {
        console.error(`Error executing tool ${request.params.name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Apollo.io API error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Apollo.io MCP server started");
  }
}

export async function serve(): Promise<void> {
  const server = new ApolloServer();
  await server.run();
}

const server = new ApolloServer();
server.run().catch(console.error);

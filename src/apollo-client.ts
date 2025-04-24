import axios, { AxiosInstance } from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Helper function to strip URL
const stripUrl = (url?: string): string | undefined => {
  if (!url) return undefined;

  try {
    // Remove protocol (http://, https://)
    let stripped = url.replace(/^https?:\/\//, "");

    // Remove www.
    stripped = stripped.replace(/^www\./, "");

    // Remove trailing slash
    stripped = stripped.replace(/\/$/, "");

    // Convert to lowercase
    stripped = stripped.toLowerCase();

    return stripped;
  } catch (error) {
    console.error("Error stripping URL:", error);
    return url;
  }
};

export interface BulkPeopleEnrichmentQuery {
  details: Array<{
    first_name?: string;
    last_name?: string;
    email?: string;
    domain?: string;
    organization_name?: string;
    linkedin_url?: string;
    [key: string]: any;
  }>;
  reveal_personal_emails?: boolean;
  reveal_phone_number?: boolean;
  webhook_url?: string;
  [key: string]: any;
}
// Type definitions for Apollo.io API responses
export interface PeopleEnrichmentQuery {
  first_name?: string;
  last_name?: string;
  email?: string;
  domain?: string;
  organization_name?: string;
  [key: string]: any;
}

export interface OrganizationEnrichmentQuery {
  domain?: string;
  name?: string;
  [key: string]: any;
}

export interface PeopleSearchQuery {
  person_titles?: string[];
  include_similar_titles?: boolean;
  person_locations?: string[];
  person_seniorities?: string[];
  organization_locations?: string[];
  q_organization_domains_list?: string[];
  contact_email_status?: string[];
  organization_ids?: string[];
  organization_num_employees_ranges?: string[];
  q_keywords?: string;
  page?: number;
  per_page?: number;
  [key: string]: any;
}

export interface OrganizationSearchQuery {
  q_organization_domains_list?: string[];
  organization_locations?: string[];
  organization_not_locations?: string[];
  organization_num_employees_ranges?: string[]; // Employee size ranges in format "1,10", "11,50", etc.
  revenue_range?: {
    min?: number;
    max?: number;
  };
  currently_using_any_of_technology_uids?: string[];
  q_organization_keyword_tags?: string[];
  q_organization_name?: string;
  organization_ids?: string[];
  page?: number;
  per_page?: number;
  [key: string]: any;
}

export interface EmployeesOfCompanyQuery {
  company: string;
  website_url?: string;
  linkedin_url?: string;
  [key: string]: any;
}

export class ApolloClient {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;
  private axiosInstance: AxiosInstance;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APOLLO_IO_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("APOLLO_IO_API_KEY environment variable is required");
    }

    this.baseUrl = "https://api.apollo.io/api/v1";
    this.headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": this.apiKey,
    };

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: this.headers,
    });
  }

  /**
   * Use the People Enrichment endpoint to enrich data for 1 person.
   * https://docs.apollo.io/reference/people-enrichment
   */
  async peopleEnrichment(query: PeopleEnrichmentQuery): Promise<any> {
    try {
      const url = `${this.baseUrl}/people/match`;
      console.log("url", url);
      console.log("query", query);
      const response = await this.axiosInstance.post(url, query);

      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return null;
      }
    } catch (error: any) {
      console.error(
        `Error: ${error.response?.status} - ${
          error.response?.statusText || error.message
        }`
      );
      return null;
    }
  }

  /**
   * Use the Bulk People Enrichment endpoint to enrich data for up to 10 people.
   * https://docs.apollo.io/reference/bulk-people-enrichment
   */
  async bulkPeopleEnrichment(query: BulkPeopleEnrichmentQuery): Promise<any> {
    try {
      const url = `${this.baseUrl}/people/bulk_match`;
      const response = await this.axiosInstance.post(url, query);

      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return null;
      }
    } catch (error: any) {
      console.error(
        `Error: ${error.response?.status} - ${
          error.response?.statusText || error.message
        }`
      );
      return null;
    }
  }

  /**
   * Use the Organization Enrichment endpoint to enrich data for 1 company.
   * https://docs.apollo.io/reference/organization-enrichment
   */
  async organizationEnrichment(
    query: OrganizationEnrichmentQuery
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/organizations/enrich`;
      const response = await this.axiosInstance.get(url, { params: query });

      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return null;
      }
    } catch (error: any) {
      console.error(
        `Error: ${error.response?.status} - ${
          error.response?.statusText || error.message
        }`
      );
      return null;
    }
  }

  async peopleSearch(query: PeopleSearchQuery): Promise<any> {
    try {
      const url = `${this.baseUrl}/mixed_people/search`;

      // Format parameters in the way the API expects
      const formattedParams = this.formatQueryParams(query);

      // Use the same approach as organizationSearch
      const response = await this.axiosInstance.post(
        url,
        {},
        {
          params: formattedParams,
        }
      );

      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return null;
      }
    } catch (error: any) {
      console.error(
        `Error: ${error.response?.status} - ${
          error.response?.statusText || error.message
        }`
      );
      return null;
    }
  }

  /**
   * Use the Organization Search endpoint to find organizations.
   * https://docs.apollo.io/reference/organization-search
   *
   * Supported organization size ranges (organization_num_employees_ranges):
   * Format: "min,max" - Example: "1,10", "11,50", "51,200", etc.
   *
   * revenue_range: Use min and max properties to specify revenue range (in numbers without commas)
   * Example: { min: 300000, max: 50000000 }
   */
  async organizationSearch(query: OrganizationSearchQuery): Promise<any> {
    try {
      const url = `${this.baseUrl}/mixed_companies/search`;

      // Format parameters in the way the API expects
      const formattedParams = this.formatQueryParams(query);

      const response = await this.axiosInstance.post(
        url,
        {},
        {
          params: formattedParams,
        }
      );

      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return null;
      }
    } catch (error: any) {
      console.error(
        `Error: ${error.response?.status} - ${
          error.response?.statusText || error.message
        }`
      );
      return null;
    }
  }

  /**
   * Formats query parameters to match the Apollo API's expected format
   * Handles arrays with [] suffix and nested objects like revenue_range[min]
   */
  private formatQueryParams(query: any): any {
    const formattedParams: Record<string, any> = {};

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        // Handle array parameters (add [] suffix)
        value.forEach((item) => {
          // Use bracket notation for arrays
          const paramKey = `${key}[]`;
          if (!formattedParams[paramKey]) {
            formattedParams[paramKey] = [];
          }
          formattedParams[paramKey].push(item);
        });
      } else if (typeof value === "object") {
        // Handle nested objects like revenue_range
        for (const [subKey, subValue] of Object.entries(value)) {
          if (subValue !== undefined && subValue !== null) {
            formattedParams[`${key}[${subKey}]`] = subValue;
          }
        }
      } else {
        // Regular parameters
        formattedParams[key] = value;
      }
    }

    return formattedParams;
  }

  /**
   * Use the Organization Job Postings endpoint to find job postings for a specific organization.
   * https://docs.apollo.io/reference/organization-jobs-postings
   */
  async organizationJobPostings(organizationId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/organizations/${organizationId}/job_postings`;
      const response = await this.axiosInstance.get(url);

      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return null;
      }
    } catch (error: any) {
      console.error(
        `Error: ${error.response?.status} - ${
          error.response?.statusText || error.message
        }`
      );
      return null;
    }
  }

  /**
   * Get email address for a person using their Apollo ID
   */
  async getPersonEmail(apolloId: string): Promise<any> {
    try {
      if (!apolloId) {
        throw new Error("Apollo ID is required");
      }

      const baseUrl = `https://app.apollo.io/api/v1/mixed_people/add_to_my_prospects`;
      const payload = {
        entity_ids: [apolloId],
        analytics_context: "Searcher: Individual Add Button",
        skip_fetching_people: true,
        cta_name: "Access email",
        cacheKey: Date.now(),
      };

      const response = await axios.post(baseUrl, payload, {
        headers: {
          "X-Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.data) {
        throw new Error("No data received from Apollo API");
      }

      const emails = (response?.data?.contacts ?? []).map(
        (item: any) => item.email
      );
      return emails;
    } catch (error: any) {
      console.error(`Error getting person email: ${error.message}`);
      return null;
    }
  }

  /**
   * Find employees of a company using company name or website/LinkedIn URL
   */
  async employeesOfCompany(query: EmployeesOfCompanyQuery): Promise<any> {
    try {
      const { company, website_url, linkedin_url } = query;

      if (!company) {
        throw new Error("Company name is required");
      }

      const strippedWebsiteUrl = stripUrl(website_url);
      const strippedLinkedinUrl = stripUrl(linkedin_url);

      // First search for the company
      const companySearchPayload = {
        q_organization_name: company,
        page: 1,
        limit: 100,
      };

      const mixedCompaniesResponse = await axios.post(
        "https://api.apollo.io/v1/mixed_companies/search",
        companySearchPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": this.apiKey,
          },
        }
      );

      if (!mixedCompaniesResponse.data) {
        throw new Error("No data received from Apollo API");
      }

      let organizations = mixedCompaniesResponse.data.organizations;
      if (organizations.length === 0) {
        throw new Error("No organizations found");
      }

      // Filter companies by website or LinkedIn URL if provided
      const companyObjs = organizations.filter((item: any) => {
        const companyLinkedin = stripUrl(item.linkedin_url);
        const companyWebsite = stripUrl(item.website_url);

        if (
          strippedLinkedinUrl &&
          companyLinkedin &&
          companyLinkedin === strippedLinkedinUrl
        ) {
          return true;
        } else if (
          strippedWebsiteUrl &&
          companyWebsite &&
          companyWebsite === strippedWebsiteUrl
        ) {
          return true;
        }
        return false;
      });

      // If we have filtered results, use the first one, otherwise use the first from the original search
      const companyObj =
        companyObjs.length > 0 ? companyObjs[0] : organizations[0];
      const companyId = companyObj.id;

      if (!companyId) {
        throw new Error("Could not determine company ID");
      }

      // Now search for employees
      const peopleSearchPayload: any = {
        organization_ids: [companyId],
        page: 1,
        limit: 100,
      };

      // Add optional filters if provided in the tool config
      if (query.person_seniorities) {
        peopleSearchPayload.person_titles = (query.person_seniorities ?? "")
          .split(",")
          .map((item: string) => item.trim());
      }

      if (query.contact_email_status) {
        peopleSearchPayload.contact_email_status_v2 = (
          query.contact_email_status ?? ""
        )
          .split(",")
          .map((item: string) => item.trim());
      }

      const peopleResponse = await axios.post(
        "https://api.apollo.io/v1/mixed_people/search",
        peopleSearchPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": this.apiKey,
          },
        }
      );

      if (!peopleResponse.data) {
        throw new Error("No data received from Apollo API");
      }

      return peopleResponse.data.people || [];
    } catch (error: any) {
      console.error(`Error finding employees: ${error.message}`);
      return null;
    }
  }
}

// Export the client for use in other modules
export default ApolloClient;

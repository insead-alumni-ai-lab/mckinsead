/**
 * MCP Server: Macro Economic Data
 *
 * External data MCP for M0 — pulls from World Bank / IMF public APIs.
 * Feeds into PESTEL analysis (Economic dimension primarily).
 *
 * Exposes tools:
 * - get_gdp: GDP data by country
 * - get_inflation: Inflation rates by country
 * - get_interest_rates: Central bank rates
 * - get_country_indicators: Bundle of key indicators for a country
 */

import { z } from "zod";

const WORLD_BANK_BASE = "https://api.worldbank.org/v2";

export const tools = {
  get_country_indicators: {
    name: "get_country_indicators",
    description:
      "Get key macroeconomic indicators for a country (GDP, inflation, population, etc.)",
    inputSchema: z.object({
      country_code: z
        .string()
        .length(2)
        .describe("ISO 3166-1 alpha-2 country code (e.g., US, GB, FR)"),
      year: z.number().int().optional().describe("Year for data (default: latest)"),
    }),
  },
  get_gdp: {
    name: "get_gdp",
    description: "Get GDP data for a country over time",
    inputSchema: z.object({
      country_code: z.string().length(2),
      start_year: z.number().int().optional(),
      end_year: z.number().int().optional(),
    }),
  },
  search_indicators: {
    name: "search_indicators",
    description: "Search World Bank indicators by keyword",
    inputSchema: z.object({
      query: z.string().describe("Search term (e.g., 'inflation', 'trade')"),
      limit: z.number().int().max(50).default(10),
    }),
  },
};

/**
 * Fetch World Bank indicator data.
 * See: https://datahelpdesk.worldbank.org/knowledgebase/articles/898581
 */
async function fetchWorldBankIndicator(
  countryCode: string,
  indicatorId: string,
  options?: { startYear?: number; endYear?: number }
) {
  const dateParam = options?.startYear && options?.endYear
    ? `&date=${options.startYear}:${options.endYear}`
    : "";

  const url = `${WORLD_BANK_BASE}/country/${countryCode}/indicator/${indicatorId}?format=json&per_page=20${dateParam}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`World Bank API error: ${response.status}`);
    const data = await response.json();

    if (!Array.isArray(data) || data.length < 2) {
      return { error: "No data available", indicator: indicatorId };
    }

    return {
      indicator: indicatorId,
      country: countryCode,
      data: data[1]
        .filter((d: { value: number | null }) => d.value !== null)
        .map((d: { date: string; value: number }) => ({
          year: d.date,
          value: d.value,
        })),
      source: {
        source: "World Bank Open Data",
        url: `https://data.worldbank.org/indicator/${indicatorId}?locations=${countryCode}`,
        retrieved_at: new Date().toISOString(),
        confidence: 0.95,
      },
    };
  } catch (error) {
    return {
      error: `Failed to fetch: ${error instanceof Error ? error.message : "Unknown error"}`,
      indicator: indicatorId,
    };
  }
}

// Key indicators for PESTEL analysis
const KEY_INDICATORS: Record<string, string> = {
  "NY.GDP.MKTP.CD": "GDP (current US$)",
  "NY.GDP.MKTP.KD.ZG": "GDP growth (annual %)",
  "FP.CPI.TOTL.ZG": "Inflation, consumer prices (annual %)",
  "SL.UEM.TOTL.ZS": "Unemployment, total (% of labor force)",
  "BX.KLT.DINV.WD.GD.ZS": "Foreign direct investment (% of GDP)",
  "NE.TRD.GNFS.ZS": "Trade (% of GDP)",
  "SP.POP.TOTL": "Population, total",
  "SP.POP.GROW": "Population growth (annual %)",
  "IT.NET.USER.ZS": "Individuals using the Internet (%)",
  "EG.USE.PCAP.KG.OE": "Energy use (kg oil equivalent per capita)",
};

export async function handleGetCountryIndicators(input: {
  country_code: string;
  year?: number;
}) {
  const results = await Promise.all(
    Object.entries(KEY_INDICATORS).map(async ([id, name]) => {
      const data = await fetchWorldBankIndicator(input.country_code, id);
      return { indicator_name: name, indicator_id: id, ...data };
    })
  );

  return {
    country: input.country_code,
    indicators: results,
    citation: {
      source: "World Bank Open Data",
      url: `https://data.worldbank.org/country/${input.country_code}`,
      retrieved_at: new Date().toISOString(),
      confidence: 0.95,
    },
  };
}

console.log("🌍 MCP Macro server ready (World Bank / IMF data)");

/**
 * MCP Server: CSV Upload
 *
 * Internal data MCP for M0 — accepts CSV files as the simplest way
 * to ingest client data (P&L, product lists, customer segments, etc.)
 *
 * Exposes tools:
 * - upload_csv: Parse a CSV and store in the evidence store
 * - query_csv: Query parsed CSV data with filters
 * - list_uploads: List all uploaded CSVs for the engagement
 */

import { z } from "zod";

// Tool definitions for MCP manifest
export const tools = {
  upload_csv: {
    name: "upload_csv",
    description: "Upload and parse a CSV file into the evidence store",
    inputSchema: z.object({
      engagement_id: z.string().uuid(),
      file_name: z.string(),
      content: z.string().describe("Raw CSV content"),
      description: z.string().optional(),
    }),
  },
  query_csv: {
    name: "query_csv",
    description: "Query a previously uploaded CSV with filters",
    inputSchema: z.object({
      upload_id: z.string(),
      filters: z
        .array(
          z.object({
            column: z.string(),
            operator: z.enum(["eq", "neq", "gt", "lt", "contains"]),
            value: z.string(),
          })
        )
        .optional(),
      columns: z.array(z.string()).optional(),
      limit: z.number().int().max(1000).default(100),
    }),
  },
  list_uploads: {
    name: "list_uploads",
    description: "List all CSV uploads for an engagement",
    inputSchema: z.object({
      engagement_id: z.string().uuid(),
    }),
  },
};

// In-memory store for M0 (replace with DB in M1)
const uploads = new Map<string, { id: string; name: string; headers: string[]; rows: string[][] }>();

export async function handleUploadCsv(input: {
  engagement_id: string;
  file_name: string;
  content: string;
  description?: string;
}) {
  const lines = input.content.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have at least a header and one data row");

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
  );

  const id = `csv_${Date.now()}`;
  uploads.set(id, { id, name: input.file_name, headers, rows });

  return {
    upload_id: id,
    file_name: input.file_name,
    row_count: rows.length,
    columns: headers,
  };
}

export async function handleQueryCsv(input: {
  upload_id: string;
  filters?: Array<{ column: string; operator: string; value: string }>;
  columns?: string[];
  limit?: number;
}) {
  const upload = uploads.get(input.upload_id);
  if (!upload) throw new Error(`Upload ${input.upload_id} not found`);

  let filteredRows = upload.rows;

  if (input.filters) {
    for (const filter of input.filters) {
      const colIdx = upload.headers.indexOf(filter.column);
      if (colIdx === -1) continue;
      filteredRows = filteredRows.filter((row) => {
        const val = row[colIdx];
        switch (filter.operator) {
          case "eq": return val === filter.value;
          case "neq": return val !== filter.value;
          case "gt": return parseFloat(val) > parseFloat(filter.value);
          case "lt": return parseFloat(val) < parseFloat(filter.value);
          case "contains": return val.toLowerCase().includes(filter.value.toLowerCase());
          default: return true;
        }
      });
    }
  }

  const limit = input.limit ?? 100;
  const resultRows = filteredRows.slice(0, limit);

  const selectedHeaders = input.columns ?? upload.headers;
  const colIndices = selectedHeaders.map((h) => upload.headers.indexOf(h)).filter((i) => i >= 0);

  return {
    headers: selectedHeaders.filter((_, i) => colIndices[i] >= 0),
    rows: resultRows.map((row) => colIndices.map((i) => row[i])),
    total_rows: filteredRows.length,
    returned_rows: resultRows.length,
  };
}

console.log("📂 MCP CSV Upload server ready (M0 — in-memory store)");

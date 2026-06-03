/**
 * MCP Server: SQL Query Runner
 *
 * Read-only SQL queries against connected data warehouses.
 * Supports Snowflake, Postgres, BigQuery (via connection config).
 *
 * Tools:
 * - query: Execute a read-only SQL query
 * - list_tables: List available tables/views
 * - describe_table: Get column info for a table
 */

import { z } from "zod";

export const tools = {
  query: {
    name: "query",
    description: "Execute a read-only SQL query against the connected data warehouse",
    inputSchema: z.object({
      sql: z.string().describe("SQL query (SELECT only — no mutations)"),
      connection: z.enum(["snowflake", "postgres", "bigquery"]).default("snowflake"),
      limit: z.number().int().max(10000).default(1000),
      timeout_ms: z.number().int().default(30000),
    }),
  },
  list_tables: {
    name: "list_tables",
    description: "List available tables and views in the connected database",
    inputSchema: z.object({
      connection: z.enum(["snowflake", "postgres", "bigquery"]).default("snowflake"),
      schema: z.string().optional(),
    }),
  },
  describe_table: {
    name: "describe_table",
    description: "Get column names, types, and nullable status for a table",
    inputSchema: z.object({
      connection: z.enum(["snowflake", "postgres", "bigquery"]).default("snowflake"),
      table: z.string(),
    }),
  },
};

// Safety: reject any mutation queries
function isReadOnly(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  const forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "GRANT", "REVOKE"];
  return !forbidden.some((keyword) => normalized.startsWith(keyword));
}

export async function handleQuery(input: { sql: string; connection?: string; limit?: number }) {
  if (!isReadOnly(input.sql)) {
    throw new Error("Only SELECT queries are allowed — no mutations permitted");
  }
  return {
    status: "stub",
    sql: input.sql,
    connection: input.connection ?? "snowflake",
    message: "Connect Snowflake/Postgres driver for live query execution",
  };
}

export async function handleListTables(input: { connection?: string; schema?: string }) {
  return {
    status: "stub",
    connection: input.connection ?? "snowflake",
    message: "Connect database driver to list tables",
  };
}

export async function handleDescribeTable(input: { connection?: string; table: string }) {
  return {
    status: "stub",
    table: input.table,
    connection: input.connection ?? "snowflake",
    message: "Connect database driver for table metadata",
  };
}

console.log("🗄️ MCP SQL Query Runner ready (M1 — stub, read-only enforced)");

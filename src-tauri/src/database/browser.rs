use serde_json::Value;
use sqlx::Row;

use crate::commands::contracts::{
    SchemaSummary, TableColumn, TableDetails, TablePreviewResponse, TableSummary,
};
use crate::commands::errors::{CommandError, CommandResult};

use super::runtime::DatabaseRuntime;

pub const DEFAULT_PREVIEW_LIMIT: u32 = 25;
pub const MAX_PREVIEW_LIMIT: u32 = 100;

#[derive(Debug, Clone)]
pub struct SchemaListing {
    pub schemas: Vec<SchemaSummary>,
}

pub async fn list_schemas(runtime: &DatabaseRuntime) -> CommandResult<SchemaListing> {
    match runtime {
        DatabaseRuntime::MySql(pool) => {
            let rows = sqlx::query(
                r#"
                SELECT
                    table_schema AS schema_name,
                    table_name AS table_name,
                    NULLIF(table_comment, '') AS description,
                    CASE
                        WHEN table_rows IS NULL THEN NULL
                        ELSE CAST(table_rows AS CHAR)
                    END AS row_count_label
                FROM information_schema.tables
                WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
                ORDER BY table_schema, table_name
                "#,
            )
            .fetch_all(pool.as_ref())
            .await
            .map_err(|error| map_browser_error(error.to_string()))?;

            let mut schemas: Vec<SchemaSummary> = Vec::new();

            for row in rows {
                let schema_name = mysql_string(&row, "schema_name")?;
                let table = TableSummary {
                    name: mysql_string(&row, "table_name")?,
                    description: mysql_optional_string(&row, "description")?,
                    row_count_label: mysql_optional_string(&row, "row_count_label")?,
                };

                push_table_summary(&mut schemas, schema_name, table);
            }

            Ok(SchemaListing { schemas })
        }
        DatabaseRuntime::Postgres(pool) => {
            let rows = sqlx::query(
                r#"
                SELECT
                    n.nspname AS schema_name,
                    c.relname AS table_name,
                    NULLIF(obj_description(c.oid, 'pg_class'), '') AS description,
                    CASE
                        WHEN c.reltuples < 0 THEN NULL
                        ELSE CAST(c.reltuples::bigint AS TEXT)
                    END AS row_count_label
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
                  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
                  AND n.nspname NOT LIKE 'pg_toast%'
                ORDER BY n.nspname, c.relname
                "#,
            )
            .fetch_all(pool.as_ref())
            .await
            .map_err(|error| map_browser_error(error.to_string()))?;

            let mut schemas: Vec<SchemaSummary> = Vec::new();

            for row in rows {
                let schema_name: String = row.get("schema_name");
                let table = TableSummary {
                    name: row.get("table_name"),
                    description: row.try_get("description").ok(),
                    row_count_label: row.try_get("row_count_label").ok(),
                };

                push_table_summary(&mut schemas, schema_name, table);
            }

            Ok(SchemaListing { schemas })
        }
        #[cfg(test)]
        DatabaseRuntime::TestStub => Ok(SchemaListing {
            schemas: Vec::new(),
        }),
    }
}

pub async fn get_table_preview(
    runtime: &DatabaseRuntime,
    schema_name: &str,
    table_name: &str,
    limit: Option<u32>,
) -> CommandResult<TablePreviewResponse> {
    let limit = sanitize_limit(limit);

    match runtime {
        DatabaseRuntime::MySql(pool) => {
            get_mysql_table_preview(pool.as_ref(), schema_name, table_name, limit).await
        }
        DatabaseRuntime::Postgres(pool) => {
            get_postgres_table_preview(pool.as_ref(), schema_name, table_name, limit).await
        }
        #[cfg(test)]
        DatabaseRuntime::TestStub => Err(CommandError::session_invalidated("test-stub")),
    }
}

fn sanitize_limit(limit: Option<u32>) -> u32 {
    match limit.unwrap_or(DEFAULT_PREVIEW_LIMIT) {
        0 => DEFAULT_PREVIEW_LIMIT,
        value if value > MAX_PREVIEW_LIMIT => MAX_PREVIEW_LIMIT,
        value => value,
    }
}

fn push_table_summary(schemas: &mut Vec<SchemaSummary>, schema_name: String, table: TableSummary) {
    if let Some(existing) = schemas.iter_mut().find(|schema| schema.name == schema_name) {
        existing.tables.push(table);
    } else {
        schemas.push(SchemaSummary {
            name: schema_name,
            tables: vec![table],
        });
    }
}

fn mysql_string(row: &sqlx::mysql::MySqlRow, column: &str) -> CommandResult<String> {
    row.try_get::<String, _>(column)
        .or_else(|_| {
            row.try_get::<Vec<u8>, _>(column)
                .map(|value| String::from_utf8_lossy(&value).into_owned())
        })
        .map_err(|error| CommandError::unknown(error.to_string()))
}

fn mysql_optional_string(
    row: &sqlx::mysql::MySqlRow,
    column: &str,
) -> CommandResult<Option<String>> {
    match row.try_get::<Option<String>, _>(column) {
        Ok(value) => Ok(value),
        Err(_) => row
            .try_get::<Option<Vec<u8>>, _>(column)
            .map(|value| value.map(|bytes| String::from_utf8_lossy(&bytes).into_owned()))
            .map_err(|error| CommandError::unknown(error.to_string())),
    }
}

async fn get_mysql_table_preview(
    pool: &sqlx::MySqlPool,
    schema_name: &str,
    table_name: &str,
    limit: u32,
) -> CommandResult<TablePreviewResponse> {
    let table_row = sqlx::query(
        r#"
        SELECT
            table_name AS table_name,
            NULLIF(table_comment, '') AS description
        FROM information_schema.tables
        WHERE table_schema = ? AND table_name = ?
        "#,
    )
    .bind(schema_name)
    .bind(table_name)
    .fetch_optional(pool)
    .await
    .map_err(|error| map_browser_error(error.to_string()))?;

    let Some(table_row) = table_row else {
        return Err(table_not_found_error(schema_name, table_name));
    };

    let table = TableDetails {
        id: format!("{schema_name}.{table_name}"),
        name: mysql_string(&table_row, "table_name")?,
        description: mysql_optional_string(&table_row, "description")?,
    };

    let columns = sqlx::query(
        r#"
        SELECT
            c.column_name AS column_name,
            c.data_type AS data_type,
            c.is_nullable = 'YES' AS nullable,
            CASE
                WHEN k.column_name IS NULL THEN FALSE
                ELSE TRUE
            END AS is_primary_key
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage k
          ON c.table_schema = k.table_schema
         AND c.table_name = k.table_name
         AND c.column_name = k.column_name
         AND k.constraint_name = 'PRIMARY'
        WHERE c.table_schema = ? AND c.table_name = ?
        ORDER BY c.ordinal_position
        "#,
    )
    .bind(schema_name)
    .bind(table_name)
    .fetch_all(pool)
    .await
    .map_err(|error| map_browser_error(error.to_string()))?
    .into_iter()
    .map(|row| {
        Ok(TableColumn {
            name: mysql_string(&row, "column_name")?,
            type_name: mysql_string(&row, "data_type")?,
            nullable: row.get("nullable"),
            is_primary_key: row.get("is_primary_key"),
        })
    })
    .collect::<CommandResult<Vec<_>>>()?;

    let preview_rows = if columns.is_empty() {
        Vec::new()
    } else {
        let json_pairs = columns
            .iter()
            .map(|column| {
                format!(
                    "'{}', {}",
                    escape_sql_string(&column.name),
                    quote_mysql_identifier(&column.name)
                )
            })
            .collect::<Vec<_>>()
            .join(", ");

        let query = format!(
            "SELECT JSON_OBJECT({json_pairs}) AS row_json FROM {}.{} LIMIT {limit}",
            quote_mysql_identifier(schema_name),
            quote_mysql_identifier(table_name),
        );

        sqlx::query(&query)
            .fetch_all(pool)
            .await
            .map_err(|error| map_browser_error(error.to_string()))?
            .into_iter()
            .map(|row| row.try_get("row_json").unwrap_or(Value::Null))
            .collect()
    };

    Ok(TablePreviewResponse {
        table,
        columns,
        preview_rows,
    })
}

async fn get_postgres_table_preview(
    pool: &sqlx::PgPool,
    schema_name: &str,
    table_name: &str,
    limit: u32,
) -> CommandResult<TablePreviewResponse> {
    let table_row = sqlx::query(
        r#"
        SELECT
            c.relname AS table_name,
            NULLIF(obj_description(c.oid, 'pg_class'), '') AS description
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relname = $2
          AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
        "#,
    )
    .bind(schema_name)
    .bind(table_name)
    .fetch_optional(pool)
    .await
    .map_err(|error| map_browser_error(error.to_string()))?;

    let Some(table_row) = table_row else {
        return Err(table_not_found_error(schema_name, table_name));
    };

    let table = TableDetails {
        id: format!("{schema_name}.{table_name}"),
        name: table_row.get("table_name"),
        description: table_row.try_get("description").ok(),
    };

    let columns = sqlx::query(
        r#"
        SELECT
            c.column_name,
            c.data_type,
            c.is_nullable = 'YES' AS nullable,
            EXISTS (
                SELECT 1
                FROM pg_index i
                JOIN pg_class cl ON cl.oid = i.indrelid
                JOIN pg_namespace n ON n.oid = cl.relnamespace
                JOIN pg_attribute a ON a.attrelid = i.indrelid
                WHERE i.indisprimary
                  AND n.nspname = $1
                  AND cl.relname = $2
                  AND a.attname = c.column_name
                  AND a.attnum = ANY(i.indkey)
            ) AS is_primary_key
        FROM information_schema.columns c
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
        "#,
    )
    .bind(schema_name)
    .bind(table_name)
    .fetch_all(pool)
    .await
    .map_err(|error| map_browser_error(error.to_string()))?
    .into_iter()
    .map(|row| TableColumn {
        name: row.get("column_name"),
        type_name: row.get("data_type"),
        nullable: row.get("nullable"),
        is_primary_key: row.get("is_primary_key"),
    })
    .collect::<Vec<_>>();

    let preview_rows = if columns.is_empty() {
        Vec::new()
    } else {
        let query = format!(
            "SELECT row_to_json(t) AS row_json FROM (SELECT * FROM {}.{} LIMIT {limit}) t",
            quote_postgres_identifier(schema_name),
            quote_postgres_identifier(table_name),
        );

        sqlx::query(&query)
            .fetch_all(pool)
            .await
            .map_err(|error| map_browser_error(error.to_string()))?
            .into_iter()
            .map(|row| row.try_get("row_json").unwrap_or(Value::Null))
            .collect()
    };

    Ok(TablePreviewResponse {
        table,
        columns,
        preview_rows,
    })
}

fn map_browser_error(message: String) -> CommandError {
    let lowered = message.to_lowercase();

    if lowered.contains("permission denied") || lowered.contains("access denied") {
        return CommandError::permission_denied(message);
    }

    CommandError::classify_driver_message(message)
}

fn table_not_found_error(schema_name: &str, table_name: &str) -> CommandError {
    CommandError::table_not_found(schema_name, table_name)
}

fn quote_mysql_identifier(identifier: &str) -> String {
    format!("`{}`", identifier.replace('`', "``"))
}

fn quote_postgres_identifier(identifier: &str) -> String {
    format!("\"{}\"", identifier.replace('"', "\"\""))
}

fn escape_sql_string(value: &str) -> String {
    value.replace('\'', "''")
}

#[cfg(test)]
mod tests {
    use super::{
        escape_sql_string, quote_mysql_identifier, quote_postgres_identifier, sanitize_limit,
        table_not_found_error, DEFAULT_PREVIEW_LIMIT, MAX_PREVIEW_LIMIT,
    };

    #[test]
    fn sanitize_limit_clamps_values() {
        assert_eq!(sanitize_limit(None), DEFAULT_PREVIEW_LIMIT);
        assert_eq!(sanitize_limit(Some(0)), DEFAULT_PREVIEW_LIMIT);
        assert_eq!(
            sanitize_limit(Some(MAX_PREVIEW_LIMIT + 10)),
            MAX_PREVIEW_LIMIT
        );
        assert_eq!(sanitize_limit(Some(10)), 10);
    }

    #[test]
    fn identifier_quoting_escapes_delimiters() {
        assert_eq!(quote_mysql_identifier("na`me"), "`na``me`");
        assert_eq!(quote_postgres_identifier("na\"me"), "\"na\"\"me\"");
        assert_eq!(escape_sql_string("o'hare"), "o''hare");
    }

    #[test]
    fn missing_table_preview_errors_use_distinct_contract_code() {
        let error = table_not_found_error("public", "missing_table");

        assert_eq!(error.code, "table_not_found");
        assert_eq!(error.message, "Table not found");
        assert_eq!(
            error.details.as_deref(),
            Some("Table `public.missing_table` does not exist")
        );
    }
}

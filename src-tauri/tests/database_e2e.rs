use ferrum_db_lib::commands::contracts::{SchemaSummary, TablePreviewResponse};
use ferrum_db_lib::database::browser::{get_table_preview, list_schemas};
use ferrum_db_lib::database::runtime::DatabaseRuntime;
use ferrum_db_lib::database::ConnectionConfig as DbConnectionConfig;
use ferrum_db_lib::storage::{CreateConnectionInput, Storage};
use sqlx::Executor;
use uuid::Uuid;

const MYSQL_HOST: &str = "127.0.0.1";
const MYSQL_PORT: u16 = 3306;
const MYSQL_USER: &str = "testuser";
const MYSQL_PASSWORD: &str = "testpass";
const MYSQL_DATABASE: &str = "testdb";

const POSTGRES_HOST: &str = "127.0.0.1";
const POSTGRES_PORT: u16 = 5433;
const POSTGRES_USER: &str = "testuser";
const POSTGRES_PASSWORD: &str = "testpass";
const POSTGRES_DATABASE: &str = "testdb";

#[tokio::test]
#[ignore = "requires local docker mysql service"]
async fn mysql_e2e_lists_schema_and_previews_rows() {
    let schema_name = "testdb";
    let table_name = format!("e2e_mysql_{}", Uuid::new_v4().simple());

    seed_mysql_table(schema_name, &table_name)
        .await
        .expect("mysql seed should succeed");

    let runtime = runtime_from_saved_connection(
        "mysql",
        MYSQL_HOST,
        MYSQL_PORT,
        MYSQL_USER,
        MYSQL_PASSWORD,
        Some(MYSQL_DATABASE.to_string()),
    )
    .await
    .expect("mysql runtime should connect");

    let listing = list_schemas(&runtime)
        .await
        .expect("mysql schema listing should succeed");
    assert!(
        contains_table(&listing.schemas, schema_name, &table_name),
        "schema listing should include seeded mysql table"
    );

    let preview = get_table_preview(&runtime, schema_name, &table_name, Some(10))
        .await
        .expect("mysql preview should succeed");
    assert_preview_contains_row(preview, "name", "Ada");

    runtime.close().await;
}

#[tokio::test]
#[ignore = "requires local docker postgres service"]
async fn postgres_e2e_lists_schema_and_previews_rows() {
    let schema_name = format!("e2e_pg_{}", Uuid::new_v4().simple());
    let table_name = "accounts";

    seed_postgres_table(&schema_name, table_name)
        .await
        .expect("postgres seed should succeed");

    let runtime = runtime_from_saved_connection(
        "postgresql",
        POSTGRES_HOST,
        POSTGRES_PORT,
        POSTGRES_USER,
        POSTGRES_PASSWORD,
        Some(POSTGRES_DATABASE.to_string()),
    )
    .await
    .expect("postgres runtime should connect");

    let listing = list_schemas(&runtime)
        .await
        .expect("postgres schema listing should succeed");
    assert!(
        contains_table(&listing.schemas, &schema_name, table_name),
        "schema listing should include seeded postgres table"
    );

    let preview = get_table_preview(&runtime, &schema_name, table_name, Some(10))
        .await
        .expect("postgres preview should succeed");
    assert_preview_contains_row(preview, "email", "ada@example.com");

    runtime.close().await;
}

async fn runtime_from_saved_connection(
    db_type: &str,
    host: &str,
    port: u16,
    username: &str,
    password: &str,
    database: Option<String>,
) -> Result<DatabaseRuntime, Box<dyn std::error::Error>> {
    let db_path = std::env::temp_dir().join(format!("ferrum-db-e2e-{}.db", Uuid::new_v4()));
    let storage = Storage::new(db_path.clone())?;

    let created = storage.create_connection(CreateConnectionInput {
        name: format!("{}-e2e", db_type),
        db_type: db_type.to_string(),
        host: host.to_string(),
        port: i32::from(port),
        username: username.to_string(),
        password: password.to_string(),
        database: database.clone(),
        environment: Some("development".to_string()),
        tags: Some(vec!["e2e".to_string()]),
    })?;

    let saved = storage
        .get_connection_with_password(&created.id)?
        .expect("saved connection should exist");

    let runtime = DatabaseRuntime::connect(
        db_type,
        &DbConnectionConfig {
            host: saved.host,
            port: saved.port as u16,
            username: saved.username,
            password: saved.password,
            database: saved.database,
        },
    )
    .await?;

    drop(storage);
    let _ = std::fs::remove_file(db_path);

    Ok(runtime)
}

async fn seed_mysql_table(
    schema_name: &str,
    table_name: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let dsn = format!(
        "mysql://{}:{}@{}:{}/{}",
        MYSQL_USER, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE
    );
    let pool = sqlx::mysql::MySqlPoolOptions::new()
        .max_connections(1)
        .connect(&dsn)
        .await?;

    let table_ident = format!("`{}`.`{}`", schema_name, table_name);
    pool.execute(format!("DROP TABLE IF EXISTS {table_ident}").as_str())
        .await?;
    pool.execute(
        format!(
            "CREATE TABLE {table_ident} (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE)"
        )
        .as_str(),
    )
    .await?;
    pool.execute(
        format!("INSERT INTO {table_ident} (name, active) VALUES ('Ada', TRUE), ('Grace', FALSE)")
            .as_str(),
    )
    .await?;

    pool.close().await;
    Ok(())
}

async fn seed_postgres_table(
    schema_name: &str,
    table_name: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let dsn = format!(
        "postgres://{}:{}@{}:{}/{}",
        POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DATABASE
    );
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(1)
        .connect(&dsn)
        .await?;

    let schema_ident = quote_pg_identifier(schema_name);
    let table_ident = format!("{}.{}", schema_ident, quote_pg_identifier(table_name));

    pool.execute(format!("CREATE SCHEMA IF NOT EXISTS {schema_ident}").as_str())
        .await?;
    pool.execute(format!("DROP TABLE IF EXISTS {table_ident}").as_str())
        .await?;
    pool.execute(
        format!(
            "CREATE TABLE {table_ident} (id SERIAL PRIMARY KEY, email TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE)"
        )
        .as_str(),
    )
    .await?;
    pool.execute(
        format!(
            "INSERT INTO {table_ident} (email, enabled) VALUES ('ada@example.com', TRUE), ('grace@example.com', FALSE)"
        )
        .as_str(),
    )
    .await?;

    pool.close().await;
    Ok(())
}

fn contains_table(schemas: &[SchemaSummary], schema_name: &str, table_name: &str) -> bool {
    schemas.iter().any(|schema| {
        schema.name == schema_name && schema.tables.iter().any(|table| table.name == table_name)
    })
}

fn assert_preview_contains_row(preview: TablePreviewResponse, key: &str, expected_value: &str) {
    assert!(
        !preview.preview_rows.is_empty(),
        "preview should contain rows"
    );
    let first_row = preview.preview_rows.first().expect("row should exist");
    let actual_value = first_row
        .get(key)
        .and_then(|value| value.as_str())
        .expect("expected preview string value");
    assert_eq!(actual_value, expected_value);
}

fn quote_pg_identifier(identifier: &str) -> String {
    format!("\"{}\"", identifier.replace('"', "\"\""))
}

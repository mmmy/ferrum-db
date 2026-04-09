use ferrum_db_lib::commands::{CommandError, ConnectionRecord, TestConnectionResult};
use ferrum_db_lib::storage::ConnectionConfig;

#[test]
fn connection_records_hide_password_fields() {
    let record = ConnectionRecord::from(ConnectionConfig {
        id: "connection-1".to_string(),
        name: "Primary".to_string(),
        db_type: "mysql".to_string(),
        host: "localhost".to_string(),
        port: 3306,
        username: "root".to_string(),
        password: "***".to_string(),
        database: Some("app".to_string()),
        environment: Some("development".to_string()),
        tags: vec!["local".to_string()],
        created_at: "2026-04-09T00:00:00Z".to_string(),
        updated_at: "2026-04-09T00:00:00Z".to_string(),
    });

    let serialized = serde_json::to_value(record).expect("record should serialize");
    assert!(serialized.get("password").is_none());
    assert_eq!(serialized["environment"], "development");
}

#[test]
fn driver_errors_are_classified_into_contract_codes() {
    let timeout = CommandError::classify_driver_message("connection timed out while dialing");
    let auth = CommandError::classify_driver_message("password authentication failed for user");
    let tls = CommandError::classify_driver_message("SSL certificate verify failed");

    assert_eq!(timeout.code, "timeout");
    assert!(timeout.retryable);
    assert_eq!(auth.code, "authentication_failed");
    assert_eq!(tls.code, "tls_error");
}

#[test]
fn structured_test_results_serialize_success_and_failure_shapes() {
    let success = TestConnectionResult::success("connection-1", Some("Connected".to_string()));
    let failure = TestConnectionResult::failure(
        "connection-1",
        CommandError::connection_not_found("connection-1"),
    );

    let success_json = serde_json::to_value(success).expect("success should serialize");
    let failure_json = serde_json::to_value(failure).expect("failure should serialize");

    assert_eq!(success_json["ok"], true);
    assert_eq!(success_json["status"], "connected");
    assert!(success_json.get("error").is_none());

    assert_eq!(failure_json["ok"], false);
    assert_eq!(failure_json["status"], "failed");
    assert_eq!(failure_json["error"]["code"], "connection_not_found");
}

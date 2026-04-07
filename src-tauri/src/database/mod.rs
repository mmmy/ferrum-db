pub mod errors;
pub mod traits;
pub mod mysql;
pub mod postgres;

pub use errors::{DatabaseError, Result};
pub use traits::{ConnectionConfig, DatabaseConnection};
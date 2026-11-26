//! MemoryBackend trait for all storage backends.

use adner_core::{AdnerError, RetrievalResult};
use serde_json::Value;

pub trait MemoryBackend: Send + Sync {
    fn backend_id(&self) -> &str;
    fn store(
        &self,
        content: &str,
        source: &str,
        metadata: Option<&Value>,
    ) -> Result<String, AdnerError>;
    fn retrieve(
        &self,
        query: &str,
        top_k: usize,
    ) -> Result<Vec<RetrievalResult>, AdnerError>;
    fn delete(&self, doc_id: &str) -> Result<bool, AdnerError>;
    fn clear(&self) -> Result<(), AdnerError>;
    fn count(&self) -> Result<usize, AdnerError>;
}

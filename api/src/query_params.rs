use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct QueryParams {
    #[serde(default = "default_limit")]
    pub limit: i32,
    #[serde(default = "default_offset")]
    pub offset: i32,
    pub event_type: Option<String>,
    pub project_id: Option<i64>,
}

fn default_limit() -> i32 {
    100
}

fn default_offset() -> i32 {
    0
}

impl QueryParams {
    pub fn validate(&mut self) {
        // Clamp limit between 1 and 1000
        self.limit = self.limit.clamp(1, 1000);
        // Ensure offset is non-negative
        if self.offset < 0 {
            self.offset = 0;
        }
    }
}

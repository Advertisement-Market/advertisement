-- V4__index_refresh_tokens_created_ts.sql
-- Index created_ts so the scheduled refresh-token cleanup
-- (DELETE FROM refresh_tokens WHERE created_ts < now() - INTERVAL '30 days')
-- uses an index range scan instead of a full sequential scan.

CREATE INDEX idx_refresh_tokens_created_ts ON refresh_tokens (created_ts);

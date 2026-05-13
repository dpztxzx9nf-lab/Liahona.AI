# Data Planning

This document is future planning only. It does not create database schemas, memory logic, retrieval behavior, source ingestion, or embeddings.

## Future Scopes

### Main/community memory

Public, community, channel, forum, and thread continuity. This should be more archival than DM memory because public conversation often needs durable context.

### DM memory

Private DM-scoped memory. This should be more temporary, noisier, and independently resettable. DM memory should not be treated as permanent by default.

### Cache

Temporary retrieval and runtime cache. This should be safe to clear.

### Logs

Diagnostics and behavior logs. These should be safe to rotate or clear.

## Principles

- Do not store everything equally.
- DM memory should not be treated as permanent by default.
- Public channels, forums, replies, and threads should preserve context relationships later.
- Memory should support understanding, not surveillance.
- Retrieval and memory should be scoped before being searched.
- Data reset tooling should eventually support independent reset categories, especially DMs.

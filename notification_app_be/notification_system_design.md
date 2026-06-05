# Stage 1

## Notification System API Design

This document outlines the REST API for the notification feature. It covers what actions are supported, how the endpoints look, and how real-time delivery works.

---

## Core Actions

- Get all notifications for the logged-in user
- Get a single notification by ID
- Mark one notification as read
- Mark all notifications as read
- Delete a notification

---

## Base URL

/api/v1/notifications

All requests require an Authorization header with a Bearer token.

---

## Endpoints

### Get All Notifications
GET /api/v1/notifications

Optional query params: read (true/false), page, limit

Returns a list of notifications and basic pagination info.

### Get One Notification
GET /api/v1/notifications/:id

Returns the full notification object or a 404 if it doesn't exist.

### Mark One as Read
PATCH /api/v1/notifications/:id/read

No body needed. Returns the updated notification.

### Mark All as Read
PATCH /api/v1/notifications/read-all

Marks everything as read and returns how many were updated.

### Delete a Notification
DELETE /api/v1/notifications/:id

Removes the notification and confirms deletion.

---

## Notification Object Fields

- id — unique identifier
- userId — who the notification belongs to
- type — one of: info, warning, success, error
- title — short heading
- body — the full message
- read — true or false
- createdAt — ISO timestamp

---

## Real-Time Notifications

We use Server-Sent Events (SSE) for live delivery. It's a simple one-way stream from server to client, no WebSocket overhead needed.

Endpoint: GET /api/v1/notifications/stream

The client connects using the browser's EventSource API and listens for "notification" events. Each event contains the notification object as JSON. The front end can then parse it and update the UI immediately.

---

## Errors

All errors follow the same shape: a success field set to false, a human-readable message, and a short error code. Standard HTTP status codes apply (400, 401, 403, 404, 500).

---

# Stage 2

## Database Choice

PostgreSQL is a better choice here. Notifications have a fixed, predictable structure — a clear set of fields that don't really change per record. A relational database fits that well. PostgreSQL also handles indexing well, supports ACID transactions (so marking something as read doesn't get lost), and scales reasonably for this kind of workload. PSQL is also very easy to setup with NodeJS environment and works exceptionally well with structured data. NoSQL like MongoDB can also be used here, but the usage is not needed considering the setup complexity of the mongodb.

---

## DB Schema

Table: notifications

- id — UUID, primary key
- user_id — UUID, foreign key referencing the users table, not null
- type — VARCHAR(20), one of info, warning, success, error
- title — VARCHAR(255), not null
- body — TEXT, not null
- read — BOOLEAN, default false
- created_at — TIMESTAMP, default current timestamp

Index on user_id since almost every query filters by it.
Index on read so filtering unread notifications is fast.

---

## Scaling Problems and Solutions
The notifications table will get large fast, especially for apps with many users. Queries like "get all unread notifications for user X" will slow down. The fix here is partitioning the table by user_id or by created_at (monthly partitions work well). This keeps each partition small and queries fast.

Old notifications pile up and most users never go back to read them. Archiving or deleting notifications older than 90 days keeps the table lean. A background job can handle this on a schedule.

Read/write patterns are uneven. Reads are far more frequent than writes. Adding a read replica for SELECT queries takes load off the primary database.

If the app grows to millions of users, caching unread counts per user in Redis avoids hitting the database on every page load.

---

## Queries

Get all notifications for a user:

SELECT * FROM notifications WHERE user_id = 'user_123' ORDER BY created_at DESC LIMIT 20 OFFSET 0;

Get only unread notifications:

SELECT * FROM notifications WHERE user_id = 'user_123' AND read = false ORDER BY created_at DESC;

Get a single notification:

SELECT * FROM notifications WHERE id = 'notif_01' AND user_id = 'user_123';

Mark one notification as read:

UPDATE notifications SET read = true WHERE id = 'notif_01' AND user_id = 'user_123';

Mark all notifications as read:

UPDATE notifications SET read = true WHERE user_id = 'user_123' AND read = false;

Delete a notification:

DELETE FROM notifications WHERE id = 'notif_01' AND user_id = 'user_123';

Insert a new notification (server-side when an event occurs):

INSERT INTO notifications (id, user_id, type, title, body) VALUES ('notif_99', 'user_123', 'info', 'New message', 'You have a new message from Alex.');

Count unread notifications (for badges/indicators):

SELECT COUNT(*) FROM notifications WHERE user_id = 'user_123' AND read = false;

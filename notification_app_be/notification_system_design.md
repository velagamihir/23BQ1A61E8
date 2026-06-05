# Stage 1

## Notification System API Design

This document outlines the REST API for the notification feature. It covers what actions are supported, how the endpoints look, and how real-time delivery works.

## Core Actions

- Get all notifications for the logged-in user
- Get a single notification by ID
- Mark one notification as read
- Mark all notifications as read
- Delete a notification

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

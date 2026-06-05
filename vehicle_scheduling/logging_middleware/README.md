Logging middleware sample

Usage

- install dependencies:

```sh
cd logging_middleware
npm install
```

- run test server:

```sh
LOG_API_TOKEN=secret-token npm start
```

Files

- logging.js: exports `Log(stack, level, package, message, meta)` and `expressLogger()` middleware.
- test_server.js: small Express server exposing a protected `/logs` endpoint and a sample `/hello` route.

Environment

- `LOG_API_URL` - URL to send log payloads (defaults to http://localhost:3000/logs)
- `LOG_API_TOKEN` - bearer token used for the protected log endpoint (defaults to `secret-token`)

Notes

- The logger sends logs asynchronously and falls back to console output if the protected API is unreachable.

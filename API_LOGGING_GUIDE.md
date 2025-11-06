# API Logging Guide

Comprehensive guide to using the detailed API request logging system for troubleshooting API errors, including 502 Bad Gateway responses.

## Quick Start

### How to See Logs

1. Open your browser DevTools: **Press F12** (or Cmd+Option+I on Mac)
2. Go to the **Console** tab
3. Trigger an API call (create persona, save, chat)
4. Look for logs prefixed with `[functionName]` like `[processPersona]` or `[sendMessage]`

### Example Log Output

```
[processPersona] API Request {
  requestId: "processPersona-1699000000000-abc123de"
  function: "processPersona"
  endpoint: "/.netlify/functions/process-persona"
  type: "API_REQUEST"
  request: {
    url: "https://neuro-twin-app.netlify.app/.netlify/functions/process-persona"
    method: "POST"
    headers: {contentType: "application/json"}
    body: {textBlocks: Array(1), links: Array(0)}
  }
}

[processPersona] API Request - Full request body:
{
  "textBlocks": ["I am a software developer..."],
  "links": []
}

[processPersona] API Response (1234ms) {
  requestId: "processPersona-1699000000000-abc123de"
  function: "processPersona"
  endpoint: "/.netlify/functions/process-persona"
  type: "API_RESPONSE"
  response: {
    status: 200
    statusText: "OK"
    duration: "1234ms"
    bodyPreview: '{"success":true,"persona":{...}}'
  }
}
```

## Troubleshooting 502 Bad Gateway

### What a 502 Error Looks Like in Logs

```
[savePersona] API Error {
  level: "ERROR"
  requestId: "savePersona-1699000000000-xyz789ab"
  function: "savePersona"
  endpoint: "/.netlify/functions/save-persona"
  type: "API_ERROR"
  error: {
    message: "HTTP 502 Bad Gateway"
    code: "HTTP_502"
    status: 502
    timestamp: "2025-11-06T12:34:56.789Z"
  }
}

[savePersona] 🔴 502 BAD GATEWAY - Netlify function may have crashed
[savePersona] Check Netlify function logs for details
[savePersona] Request ID for logs: savePersona-1699000000000-xyz789ab
```

### Common 502 Causes

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| **502 every time** | Netlify function has a runtime error | Check Netlify function logs, check environment variables |
| **502 on save-persona** | Supabase bucket doesn't exist or permissions issue | Create "personas" bucket in Supabase, check RLS policies |
| **502 on process-persona** | OpenAI API error or invalid API key | Check OPENAI_API_KEY in Netlify environment variables |
| **502 after timeout** | Function exceeds time limit (10 seconds) | Reduce input size, optimize OpenAI prompt |
| **502 intermittent** | Memory/resource issue | Check Netlify logs, function may need optimization |

## Log Levels Explained

### INFO Level (Default)
Logs all requests and responses.

**When you see it**: After every API call
**Why**: Normal operation tracking

```
[processPersona] API Request {type: "API_REQUEST", ...}
[processPersona] API Response (1234ms) {type: "API_RESPONSE", ...}
```

### DEBUG Level
Detailed step-by-step logs of the request lifecycle.

**When you see it**: Many entries prefixed with `[function] Step: ...`
**Why**: Tracing each phase of the request

```
[processPersona] Initializing persona processing {textBlocksCount: 1, linksCount: 0}
[processPersona] Sending fetch request to Netlify function
[processPersona] Fetch completed {status: 200, statusText: "OK"}
[processPersona] Parsing response JSON
[processPersona] Successfully processed persona {success: true, hasPersona: true}
```

### WARN Level
Warnings about slow responses or unusual conditions.

**When you see it**: Response takes >3 seconds
**Why**: Performance monitoring

```
[processPersona] ⚠️ Slow response detected: 5432ms (>3s threshold)
```

### ERROR Level
Errors that prevent the operation from completing.

**When you see it**: API call fails, network error, 502, etc.
**Why**: Critical issues that need attention

```
[savePersona] API Error {
  level: "ERROR"
  error: {message: "HTTP 502 Bad Gateway", code: "HTTP_502", status: 502}
  stack: "[stack trace]"
}

[savePersona] 🔴 502 BAD GATEWAY - Netlify function may have crashed
[savePersona] Check Netlify function logs for details
```

## Correlation: Request IDs

Every API call gets a unique **Request ID** that stays the same throughout the entire request lifecycle. Use this to correlate browser logs with server logs.

### Example Flow

1. **Browser Console** (RequestID: `processPersona-1699000000000-abc123de`):
   ```
   [processPersona] API Request {...}
   [processPersona] API Response (1234ms) {...}
   ```

2. **Netlify Function Logs** (same RequestID):
   ```
   [function: process-persona, request_id: processPersona-1699000000000-abc123de]
   Validating input...
   Calling OpenAI API...
   Response received
   ```

3. **To find this request in Netlify logs**:
   - Go to Netlify dashboard → Functions → Logs
   - Search for RequestID: `processPersona-1699000000000-abc123de`

## API Endpoints and Their Logs

### Process Persona

**Function**: `processPersona`
**Endpoint**: `/.netlify/functions/process-persona`
**Method**: POST
**What it does**: Extract persona from text blocks using OpenAI

**Sample successful log sequence**:
```
[processPersona] Initializing persona processing
[processPersona] Sending fetch request to Netlify function
[processPersona] Fetch completed {status: 200}
[processPersona] Parsing response JSON
[processPersona] Successfully processed persona {success: true}
```

**Common errors**:
- `502 Bad Gateway` → OpenAI API error or missing OPENAI_API_KEY
- `400 Bad Request` → Invalid input (text blocks or links format)
- Timeout (>10s) → Request too large or OpenAI slow

### Save Persona

**Function**: `savePersona`
**Endpoint**: `/.netlify/functions/save-persona`
**Method**: POST
**What it does**: Upload persona JSON to Supabase Storage

**Sample successful log sequence**:
```
[savePersona] Starting persona save
[savePersona] Save fetch completed {status: 200}
[savePersona] Persona saved successfully {personaId: "persona_abc123"}
```

**Common errors**:
- `502 Bad Gateway` → Supabase bucket missing or permissions issue
- `403 Forbidden` → Service role key invalid
- `404 Not Found` → Bucket doesn't exist

### Get Persona

**Function**: `getPersona`
**Endpoint**: `/.netlify/functions/get-persona?persona_id=...`
**Method**: GET
**What it does**: Retrieve persona JSON from Supabase Storage

**Sample successful log sequence**:
```
[getPersona] Fetching persona by ID {personaId: "persona_abc123"}
[getPersona] Fetch completed {status: 200}
```

**Common errors**:
- `404 Not Found` → Persona doesn't exist
- `403 Forbidden` → Permissions issue

### Chat

**Function**: `sendMessage`
**Endpoint**: `/.netlify/functions/chat`
**Method**: POST
**What it does**: Send message to persona and get response

**Sample successful log sequence**:
```
[sendMessage] Prepared chat request {messageLength: 45, historyLength: 5}
[sendMessage] Sending chat request to Netlify function
[sendMessage] Chat API response received {status: 200}
[sendMessage] Chat response successful {responseLength: 234}
```

**Common errors**:
- `502 Bad Gateway` → OpenAI API error
- `400 Bad Request` → Invalid persona_id format
- Timeout → Function execution exceeded 10 seconds

## Debugging Specific Issues

### Issue: "502 Bad Gateway on Save"

**Steps to debug**:

1. **Check browser logs**:
   ```
   [savePersona] 🔴 502 BAD GATEWAY
   ```
   Get the Request ID: `savePersona-1699000000000-xyz789ab`

2. **Check Netlify function logs**:
   - Go to Netlify → Functions → Logs
   - Search for the Request ID
   - Look for error messages in the log output
   - Common: `Personas bucket does not exist` or `Not authorized`

3. **Check Supabase**:
   - Go to Supabase dashboard → Storage
   - Verify "personas" bucket exists
   - Check if bucket is private
   - Verify RLS policies allow authenticated users

4. **Check environment variables** in Netlify:
   - `SUPABASE_SERVICE_ROLE_KEY` must be set
   - `SUPABASE_URL` must match your project
   - Re-deploy after updating env vars

### Issue: "502 Bad Gateway on Process Persona"

**Steps to debug**:

1. **Check browser logs**:
   ```
   [processPersona] 🔴 502 BAD GATEWAY
   ```

2. **Check Netlify function logs**:
   - Search for Request ID in Netlify logs
   - Common errors:
     - `OPENAI_API_KEY not set` → Add to Netlify env vars
     - `Invalid API key` → Check key is correct
     - `Rate limited` → Quota exceeded on OpenAI account
     - `Timeout` → Request took too long

3. **Check OpenAI**:
   - Verify API key is valid
   - Check account has credits
   - Check rate limits haven't been exceeded
   - Try a smaller input (fewer text blocks)

4. **Test locally**:
   - Run `npm run dev`
   - Add local `.env.local` with test API keys
   - Try the same input locally to isolate issue

### Issue: "Timeout Error"

**Symptoms**:
```
[sendMessage] Chat failed {errorMessage: "...timed out..."}
```

**Causes**:
- Netlify function exceeded 10 second limit
- OpenAI API is slow
- Network latency

**Solutions**:
- Reduce context history size
- Optimize prompts for faster responses
- Use faster model (gpt-3.5-turbo instead of gpt-4)
- Check Netlify function execution logs

## Sensitive Data Handling

**What gets logged**:
- Request/response bodies (with redaction)
- Headers (with sensitive ones redacted)
- URLs
- Status codes and error messages

**What gets REDACTED**:
- `Authorization` header → `[REDACTED]`
- `X-API-Key` header → `[REDACTED]`
- `password`, `token`, `secret`, `api_key` fields → `[REDACTED]`
- Any header containing "auth" or "key" → `[REDACTED]`

**Example**:
```
Request headers logged as:
{
  "Content-Type": "application/json"
  "Authorization": "[REDACTED]"
  "X-API-Key": "[REDACTED]"
}
```

## Performance Monitoring

The logging system tracks response times and warns about slow requests.

### Response Time Warnings

**Green** (fast): < 1 second
```
[processPersona] API Response (234ms) {...}
```

**Yellow** (normal): 1-3 seconds
```
[processPersona] API Response (1234ms) {...}
```

**Red** (slow): > 3 seconds
```
[processPersona] ⚠️ Slow response detected: 5432ms (>3s threshold)
```

### Tips for Faster Responses

1. **Reduce input size**:
   - Fewer text blocks
   - Shorter text content
   - Fewer links

2. **Use faster model**:
   - gpt-3.5-turbo (faster, cheaper)
   - vs. gpt-4 (slower, more accurate)

3. **Optimize prompts**:
   - Shorter extraction prompts
   - Clear, concise requirements

4. **Reduce context**:
   - Send fewer previous messages in chat
   - Currently sends last 10 messages

## Export Logs for Analysis

### Copy logs to file

1. Right-click console → Save as → HTML or TXT
2. Or use: `copy(document.body.innerText)`
3. Send to team for analysis

### Share with support

Include:
- Request ID (from logs)
- Full error message
- Response status code
- Copy of relevant console logs
- Timestamp when error occurred

## Environment Checklist

Use these logs to verify everything is configured:

```
□ Can make API calls without errors
□ processPersona logs show success
□ savePersona logs show success with persona_id
□ getPersona can retrieve saved personas
□ chat works with responses
□ No 502 errors in logs
□ No 403 "not authorized" errors
□ Response times < 3 seconds (green)
□ All required API keys set (redacted in logs)
```

## Disabling Logs

If logs are too verbose, disable them by commenting out the logger calls in:
- `services/api/apiPersonaService.ts`
- `hooks/useChat.ts`
- `hooks/usePersona.ts`

Or modify `lib/api-logger.ts` to only log errors:
```typescript
public logRequest(request: ApiLogRequest): void {
  // Comment out this method body to disable request logging
}
```

## Questions?

If you see logs you don't understand:
1. Check the function name in brackets: `[functionName]`
2. Look up that function in this guide
3. Check for error keywords: `ERROR`, `502`, `timeout`
4. Collect the full Request ID and logs
5. Share with the development team

---

**Remember**: The detailed logs are your best friend for troubleshooting API errors. Use them to identify exactly where requests fail and why!

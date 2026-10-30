# Senior Developer Implementation Plan: WhatsApp AI Assistant

## 1. Project overview

**Project name:** WhatsApp AI Assistant  
**Project type:** Full-stack AI chatbot  
**Primary interface:** WhatsApp  
**Additional interface:** Web administration dashboard  
**Development approach:** Phased, secure, test-driven implementation

The goal is to build an AI assistant that users can message through WhatsApp. It should answer questions, support study and coding help, maintain relevant conversation context, and later support image understanding, voice, and document assistance.

Google Antigravity is the development environment used to plan, implement, run, and test the application. The deployed application will use its configured AI and WhatsApp services independently of Antigravity.

> **Important:** OpenAI API usage is billed separately from a ChatGPT subscription. Start with a test setup and confirm account requirements before connecting a production WhatsApp number.

## 2. Core user experience

1. A user sends a message to the chatbot on WhatsApp.
2. WhatsApp delivers the message to the backend through its supported API.
3. The backend verifies the webhook and identifies the sender.
4. The application loads the relevant conversation context.
5. The AI service generates a response.
6. The backend sends the response through WhatsApp.
7. The application records the message and processing status in MongoDB.

Example:

**User:** Explain arrays in C in simple language.

**Assistant:** An array is a collection of elements of the same data type stored under one variable name. For example, `int marks[5];` creates an integer array with five elements.

## 3. Recommended technology stack

| Component | Technology | Purpose |
|---|---|---|
| Backend | Node.js + Express | Application logic and APIs |
| AI engine | OpenAI API | Generate responses |
| Messaging | WhatsApp Business Platform / Cloud API | Receive and send WhatsApp messages |
| Database | MongoDB + Mongoose | Store conversations and settings |
| Frontend | React + Vite | Admin dashboard and optional web chat |
| Validation | Zod or equivalent | Validate incoming data |
| Testing | Vitest/Jest + Supertest | Test backend behaviour |
| Deployment | Node.js-compatible hosting | Keep the application available |
| Version control | Git | Track changes and recover from mistakes |

Use maintained, compatible package versions. Keep the first implementation simple. Add Redis, queues, or other infrastructure only when there is a demonstrated need.

## 4. System architecture

```text
                 USER
                   |
                   v
             WhatsApp App
                   |
                   v
        WhatsApp Business Cloud API
                   |
                   v
          Express Webhook Endpoint
                   |
                   v
        Verify and Validate Webhook
                   |
                   v
        Detect Duplicate Message ID
                   |
                   v
          Load Conversation Context
                   |
                   v
              AI Service
              OpenAI API
                   |
                   v
         Validate and Store Response
                   |
                   v
          WhatsApp Messaging API
                   |
                   v
          USER RECEIVES REPLY

                   |
                   v
                 MongoDB
      Users, Conversations, Messages,
        Memories, and Usage Metadata

        React Admin Dashboard
                   |
                   v
       Authenticated Backend APIs
```

### Architecture principles

- Keep WhatsApp integration, AI logic, database access, and dashboard code separate.
- Keep secrets on the server only.
- Isolate each user's conversations.
- Make webhook processing safe against duplicate events.
- Test external integrations with mocks before using real accounts.
- Avoid logging full private conversations by default.

## 5. Development roadmap

### Phase 1 — Project foundation

**Goal:** Create a clean, runnable project.

Tasks:

- Inspect the existing workspace and Git status.
- Initialize frontend and backend if needed.
- Configure environment variables.
- Connect MongoDB.
- Add centralized error handling.
- Add request validation.
- Configure appropriate CORS and security headers.
- Add health-check and configuration-check endpoints.
- Set up safe logging.
- Create a README and setup instructions.

**Deliverables:**

- Running backend.
- Working frontend shell.
- Successful database connection.
- `.env.example` with placeholders only.
- Basic automated tests.

**Acceptance criteria:** The application starts successfully, reports its health, and handles database connection failures gracefully.

### Phase 2 — AI chat engine

**Goal:** Make the AI assistant work before connecting WhatsApp.

Tasks:

1. Integrate the official OpenAI JavaScript SDK.
2. Create a dedicated AI service module.
3. Configure assistant instructions and response style.
4. Create a backend endpoint for text messages.
5. Validate input and limit message length.
6. Handle timeouts, API errors, and rate limits.
7. Add bounded conversation context.
8. Create a simple web chat interface for testing.

**Acceptance criteria:**

- Text questions produce responses.
- Relevant conversation context is handled correctly.
- Invalid input is rejected.
- API failures do not crash the server.
- API keys never appear in frontend code.

### Phase 3 — WhatsApp integration

**Goal:** Receive and answer real WhatsApp messages through the supported platform.

Tasks:

- Set up the supported WhatsApp Business Platform integration.
- Configure the required Meta application and WhatsApp account.
- Start with an available test-number setup.
- Implement webhook verification.
- Verify incoming webhook authenticity using the documented security mechanism.
- Parse incoming text messages.
- Pass messages to the AI service.
- Send replies through the supported messaging API.
- Handle delivery status notifications.
- Prevent duplicate webhook processing.
- Add safe error handling and appropriate retry logic.

**Acceptance criteria:**

- A test WhatsApp message reaches the backend.
- The backend generates an AI response.
- The response reaches the test account.
- Repeated webhook deliveries do not generate duplicate replies.
- Failed requests are recorded safely and can be investigated.

**Important:** Confirm account requirements and messaging policies before using a production number. Do not rely on unofficial WhatsApp Web automation.

### Phase 4 — Conversation memory

**Goal:** Maintain useful context across messages.

Potential MongoDB collections:

| Collection | Purpose |
|---|---|
| `users` | User identifiers, preferences, and status |
| `conversations` | Conversation metadata |
| `messages` | Message history |
| `user_memories` | Explicitly saved preferences and useful facts |
| `usage_logs` | Usage metadata, processing status, and operational metrics |
| `admin_users` | Dashboard authentication and roles |

Requirements:

- Keep each user's conversations isolated.
- Retrieve only relevant context.
- Limit how much history is sent to the AI.
- Let users inspect and delete saved memories.
- Provide a way to clear conversation history.
- Avoid collecting unnecessary personal information.
- Do not treat every statement as a permanent memory.
- Document data-retention and deletion policies.

**Acceptance criteria:** The assistant can refer to relevant earlier messages without mixing information between users.

### Phase 5 — Admin dashboard

**Goal:** Provide a secure interface for managing the assistant.

#### Overview

- Total users and messages processed.
- Successful and failed request counts.
- AI usage statistics when available.
- Recent system errors.
- Backend, database, WhatsApp, and AI service status.

#### Conversation management

- View conversation metadata.
- Inspect messages only when authorized.
- Search conversations using supported fields.
- Apply retention policies.
- Delete conversations when requested.

#### AI settings

- Configure assistant instructions.
- Select a supported AI model.
- Configure response limits.
- Enable or disable supported features.
- Set usage limits.

#### System settings

- Check whether required environment variables are configured without revealing values.
- Check service health and webhook status.
- Display setup instructions for missing configuration.

**Acceptance criteria:** Unauthorized visitors cannot access administrative data or change system settings.

### Phase 6 — Advanced AI features

Implement these only after the text-based MVP is stable.

| Feature | Implementation approach |
|---|---|
| Hindi and Hinglish | Language-aware assistant instructions |
| Image understanding | Process supported image inputs with a compatible model |
| Voice messages | Add supported speech-to-text and text-to-speech services |
| Document assistance | Validate uploads, extract supported content, enforce size limits |
| Study assistant | Add explanations, examples, and learning modes |
| Coding assistant | Add code explanation and debugging workflows |
| Personalization | Add user-controlled preferences and saved memories |
| Usage management | Apply quotas and monitor API consumption |

Implement advanced features as optional modules, not one large block of code.

### Phase 7 — Security and reliability

Before production deployment, test:

- Authentication and authorization.
- Webhook authenticity.
- Input validation.
- Rate limiting.
- Duplicate-message prevention.
- AI API timeout handling.
- WhatsApp API failure handling.
- Database failure handling.
- Secret management.
- Sensitive-data redaction in logs.
- User data deletion.
- Backup and recovery.
- Dependency vulnerabilities.
- Automated tests for important workflows.

Use idempotency controls and a reliable job queue if message volume or webhook time limits require asynchronous processing. Ensure retries cannot unintentionally send duplicate replies.

### Phase 8 — Deployment

Prepare separate development and production configurations.

Possible setup:

- Frontend: static frontend hosting.
- Backend: Node.js-compatible hosting.
- Database: MongoDB Atlas or another managed MongoDB deployment.
- AI: OpenAI API.
- Messaging: WhatsApp Business Platform.

Deployment checklist:

1. Configure production environment variables.
2. Deploy the backend.
3. Confirm the health-check endpoint works.
4. Configure the production webhook URL.
5. Complete WhatsApp verification and setup.
6. Test an end-to-end message.
7. Deploy the dashboard.
8. Confirm authentication and authorization.
9. Review logs, API usage, and error monitoring.
10. Document rollback and recovery procedures.

Do not claim the application is deployed unless it has actually been deployed and the deployed URL has been verified.

## 6. Recommended folder structure

```text
whatsapp-ai-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── env.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── aiService.js
│   │   │   ├── whatsappService.js
│   │   │   └── memoryService.js
│   │   ├── webhooks/
│   │   ├── jobs/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── API.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
│
├── .gitignore
├── README.md
└── package.json
```

Do not create files just to make the project look professional. Every module should have a clear responsibility, and the structure should evolve with actual requirements.

## 7. Master prompt for Google Antigravity

Copy the following prompt into Antigravity. Start with planning, inspect the workspace, and review the plan before major changes.

---

# ROLE AND RESPONSIBILITY

Act as a senior full-stack software engineer, backend architect, AI integration engineer, security reviewer, and QA engineer.

Design and implement a production-minded WhatsApp AI Assistant that behaves like a conversational AI assistant and can be expanded with memory, image understanding, voice support, and a web administration dashboard.

Work like an experienced engineer. Prefer the simplest reliable implementation. Avoid unnecessary abstractions, duplicated logic, oversized files, placeholder functionality, and code that exists only to make the project appear complete.

Do not claim a feature works unless you have implemented and verified it.

## 1. Project objective

Build an application that can:

1. Receive incoming WhatsApp messages through the supported WhatsApp Business Platform API.
2. Process messages securely through a Node.js backend.
3. Generate responses through the official OpenAI API.
4. Send responses back to WhatsApp.
5. Maintain isolated conversation history for each user.
6. Provide a responsive administration dashboard.
7. Support configurable assistant instructions.
8. Record operational metrics and errors without exposing private message content.
9. Provide clear deployment instructions.
10. Support future extension through modular services.

Prioritize a reliable text-based chatbot before advanced features.

## 2. Required technology

Use this stack unless inspection reveals a compelling compatibility issue:

- Backend: Node.js with Express.
- Language: JavaScript using ES modules.
- Frontend: React with Vite.
- Database: MongoDB with Mongoose.
- AI: Official OpenAI JavaScript SDK and OpenAI API.
- Messaging: Supported WhatsApp Business Platform / Cloud API.
- Validation: Zod or an equivalent maintained library.
- Testing: Vitest or Jest and Supertest.
- Version control: Git.

Use maintained, compatible package versions. Check the existing project before replacing dependencies.

Do not add Redis, queues, microservices, or complex infrastructure unless requirements justify them. Explain the reason before adding substantial infrastructure.

## 3. Working method

Before writing code:

1. Inspect the existing workspace and Git status.
2. Identify existing files, dependencies, environment configuration, and reusable functionality.
3. Do not overwrite or delete existing work without a clear reason.
4. Identify risks, missing credentials, external dependencies, and unanswered requirements.
5. Create an implementation plan with milestones, file changes, tests, and acceptance criteria.
6. Create or update architecture and setup documentation.
7. Present the plan for review before major modifications.

If the workspace is empty, initialize the project with the smallest sensible structure.

After approval, implement one phase at a time. Run relevant tests, inspect failures, fix genuine defects, and report outcomes.

Use terminal and browser testing when appropriate. Never report a test as passed unless it actually ran and passed.

## 4. System architecture

Separate these responsibilities:

### WhatsApp integration

- Verify webhook configuration.
- Validate incoming webhook authenticity using the supported mechanism.
- Parse supported incoming messages.
- Normalize provider-specific payloads.
- Handle delivery-status updates.
- Send outbound messages using the supported API.
- Handle API errors and retryable failures.

### AI service

- Call the official OpenAI API from the backend.
- Keep AI configuration separate from HTTP routes.
- Apply assistant instructions.
- Handle conversation context.
- Apply timeouts and usage limits.
- Handle provider errors without exposing credentials.
- Return normalized responses.

### Conversation service

- Create and retrieve conversations.
- Associate each conversation with the correct user.
- Maintain message order.
- Load relevant recent history.
- Enforce retention rules.
- Support conversation deletion.
- Prevent cross-user data access.

### Database layer

- Define explicit schemas and appropriate indexes.
- Validate stored data.
- Avoid storing unnecessary personal information.
- Handle database connection failures.

### Administration API

- Authenticate administrative users.
- Authorize each administrative action.
- Validate requests.
- Apply rate limits.
- Return consistent error responses.

### Frontend

- Display application health and usage metrics.
- Provide protected conversation-management views.
- Provide assistant configuration controls.
- Show loading, empty, success, and error states.
- Work on desktop and mobile.
- Never expose server secrets.

## 5. Initial database design

Create only models needed for the initial implementation.

Potential collections:

- `users`
- `conversations`
- `messages`
- `user_memories`
- `admin_users`
- `usage_logs`

Define relationships and ownership rules. Use timestamps consistently. Add indexes for user identity, conversation identity, provider message ID, and creation time where appropriate.

Do not store passwords in plaintext or API keys in MongoDB. Do not save permanent user memories unless the user has knowingly enabled or requested the relevant functionality.

Document data-retention and deletion strategies.

## 6. WhatsApp webhook requirements

Implement the provider's documented webhook verification and message-receiving procedures.

- Support the documented verification handshake.
- Validate webhook authenticity using the documented signature mechanism where applicable.
- Validate payload structure before processing.
- Ignore unsupported message types safely.
- Extract provider message ID, sender identifier, timestamp, and supported message content.
- Prevent duplicate processing.
- Do not treat delivery-status notifications as new user messages.
- Respond to webhook requests appropriately.
- Avoid slow AI processing inside a request if it risks provider timeouts.
- Use a reliable asynchronous processing strategy when required.
- Record processing status and retryable failures.
- Ensure retries cannot unintentionally send duplicate replies.

Use official provider documentation as the source of truth. Do not invent API endpoints, request fields, permissions, or webhook payload formats.

Start with test-number configuration. Automated tests must not require production credentials.

## 7. AI chat service

Create a dedicated AI service that:

- Uses the official OpenAI SDK.
- Reads its API key exclusively from backend environment variables.
- Accepts validated message input.
- Builds context from the correct conversation only.
- Applies configurable server-side assistant instructions.
- Enforces message and context limits.
- Handles API timeouts, rate limits, and service errors.
- Avoids logging full private conversations by default.
- Returns a normalized response.
- Tracks usage metadata when available.
- Never exposes hidden internal reasoning.
- Never lets a user's message override server-side security controls.

Do not invent a model name or use deprecated SDK methods. Confirm the selected model and API method against current official documentation. Keep the model configurable.

## 8. Conversation memory

For the initial release, support short-term conversation context.

- Keep each user's conversation isolated.
- Limit historical messages included in AI requests.
- Prevent unbounded token consumption.
- Support conversation-history deletion.
- Document what information is stored.
- Do not infer sensitive personal information for permanent storage.
- Do not expose conversations to other users or administrators without proper authorization.
- Document how user-controlled persistent memory can be added later.

Do not confuse saved conversation history with the model inherently remembering information.

## 9. Security requirements

Implement security as a core requirement:

- Environment-based secret management.
- A committed `.env.example` containing placeholders only.
- Git rules excluding real environment files.
- Request validation.
- Appropriate security headers.
- Restrictive CORS configuration.
- Rate limiting on relevant endpoints.
- Authentication and authorization for dashboard APIs.
- Secure password hashing if password authentication is used.
- Safe error handling.
- Webhook authenticity verification.
- Request-size limits.
- Protection against duplicate webhook processing.
- Database query validation.
- Dependency auditing.
- Sensitive-data redaction in logs.

Never expose API keys, access tokens, webhook secrets, database credentials, or administrative secrets to the frontend or Git repository.

Never use hardcoded credentials. Do not disable security checks merely to make a test pass.

## 10. Web dashboard

Create a responsive dashboard with:

### Overview
- Backend health.
- Database connectivity.
- WhatsApp integration status.
- AI integration status.
- Message-processing counts.
- Recent operational errors.

### Conversations
- List conversation metadata.
- Display authorized conversation details.
- Search by supported fields.
- Provide safe deletion controls.

### AI configuration
- Edit assistant instructions.
- Configure supported model selection.
- Set sensible response and usage limits.

### Settings
- Display whether required environment variables are configured without revealing values.
- Display webhook and service health.
- Provide setup instructions for missing configuration.

Use realistic empty states and error messages. Do not fabricate usage statistics or claim integrations are active when they are not.

Protect administrative routes on the server, not just by hiding frontend components.

## 11. Configuration and developer experience

Create an environment-variable template covering only settings actually used by the project.

Potential settings:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- Admin authentication configuration

Use the exact variable names required by the implementation. Do not require unused settings.

Validate required variables at startup and provide helpful errors without revealing values.

Document scripts for installing dependencies, running frontend and backend, running tests, building for production, and performing any necessary database initialization.

Do not automatically create privileged production accounts with known default passwords.

## 12. Testing strategy

Write and run tests for:

- Health-check endpoint.
- Environment validation.
- Invalid request payloads.
- AI service success and failure handling.
- Webhook verification.
- Valid and invalid webhook signatures.
- Incoming text-message parsing.
- Delivery-status event handling.
- Duplicate webhook events.
- Conversation isolation.
- Authentication and authorization.
- Rate limiting.
- Database failures.
- Outbound messaging failures.

Mock external APIs in automated tests. Do not send real WhatsApp messages during the default test suite.

Add integration tests for this internal flow:

`Incoming webhook → validation → duplicate detection → conversation retrieval → mocked AI response → outbound-message service`

Clearly distinguish unit tests, integration tests, and tests requiring real external credentials.

## 13. Implementation phases

Execute in this order:

1. Workspace inspection, requirements, architecture, and plan.
2. Project setup, configuration, database connection, and health checks.
3. AI service and browser-based text chat.
4. WhatsApp webhook integration and outbound messaging.
5. Conversation persistence and duplicate-event protection.
6. Authentication and administration dashboard.
7. Security review, automated testing, and defect fixes.
8. Deployment documentation and production-readiness checklist.
9. Optional memory, image, voice, and document features.

Do not start later phases while earlier critical acceptance criteria remain unmet.

## 14. Deployment

Document a deployment process suitable for a small Node.js application, including:

- Environment-variable setup.
- Database configuration.
- Backend deployment.
- Frontend deployment.
- HTTPS requirements.
- Production webhook configuration.
- WhatsApp account setup.
- External API credentials.
- Smoke tests.
- Logging and error monitoring.
- Backup and recovery considerations.
- Rollback guidance.

Do not claim the application is deployed unless you actually deploy it and verify the deployed URL. Do not make irreversible production changes without approval.

## 15. Completion report

When implementation is finished, provide:

1. Features implemented.
2. Important files created or modified.
3. Architecture decisions and rationale.
4. Environment variables to configure.
5. Setup and run commands.
6. Tests executed and actual results.
7. Features not implemented.
8. External services still requiring configuration.
9. Known limitations.
10. Security considerations.
11. Steps required to connect a real WhatsApp account.
12. Steps required for deployment.

Clearly label incomplete features.

## Final engineering rule

Do not merely generate code and claim success.

**Inspect → Plan → Implement → Run → Test → Verify → Document.**

Prioritize a working, secure, maintainable MVP over unnecessary complexity.

Start by inspecting the workspace and preparing the implementation plan. Do not begin large-scale code modifications until the plan has been reviewed.

---

## 8. How to use this prompt in Antigravity

1. Open [Google Antigravity](https://antigravity.google/) and create or open a dedicated workspace.
2. Paste the master prompt into the agent. If supported in your current interface, begin with `/plan`.
3. Review the proposed plan before approving major changes.
4. Ask Antigravity to complete Phase 1 and Phase 2 first.
5. Verify that the backend starts and the browser-based text chat works.
6. Continue to WhatsApp integration only after the first milestone passes.
7. Before deployment, ask Antigravity to run tests, inspect the code changes, and report actual results.

Consult the official [Antigravity planning guide](https://www.antigravity.google/docs/plan/) for planning workflow details.

## 9. What you need to prepare

| Requirement | When needed |
|---|---|
| Computer with Node.js installed | Development |
| Google Antigravity workspace | Development |
| OpenAI API account and API key | AI integration |
| MongoDB database | Conversation storage |
| Meta developer setup | WhatsApp integration |
| WhatsApp test configuration | Initial integration testing |
| Hosting account | Deployment |
| Production WhatsApp configuration | Moving beyond the test environment |

You do not need to configure everything before starting. Build and test local AI chat first, then configure external services as each phase requires them.

Official resources:

- [Google Antigravity](https://antigravity.google/)
- [Antigravity planning guide](https://www.antigravity.google/docs/plan/)
- [OpenAI API platform](https://platform.openai.com/)
- [WhatsApp Cloud API documentation](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api)

## 10. Senior developer recommendation

Keep the first release small:

- **Version 1:** WhatsApp text messages, AI replies, MongoDB conversation history, and basic administration.
- **Version 2:** User-controlled memory, improved monitoring, usage limits, and robust message processing.
- **Version 3:** Image understanding, voice messages, and document assistance.
- **Version 4:** More advanced user settings, deployment improvements, and additional AI features.

The first milestone is simple: send a text question to the AI service and display its response in the browser. Once that works reliably, connect the WhatsApp test environment.

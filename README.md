# 🛡️ SaucerHedge Backend - Complete Documentation

> **Enterprise-Grade DeFi Hedging Platform with AI-Powered Ability Orchestration**

---

## 📋 Table of Contents

- [🎯 Quick Start](#quick-start)
- [🏗️ Architecture Overview](#architecture-overview)
- [📊 Detailed System Design](#detailed-system-design)
- [🚀 Installation & Setup](#installation--setup)
- [📡 API Documentation](#api-documentation)
- [🔄 Request Flow](#request-flow)
- [🛠️ Services Deep Dive](#services-deep-dive)
- [⚡ Performance Optimization](#performance-optimization)
- [🔐 Security Considerations](#security-considerations)
- [🐛 Troubleshooting](#troubleshooting)
- [🤝 Contributing](#contributing)

---

## 🎯 Quick Start

### Prerequisites
- **Node.js**: 18.0+
- **pnpm**: 8.0+
- **Hedera Account**: Get from https://portal.hedera.com
- **Gemini API Key**: Get from https://aistudio.google.com/apikey
- **Vincent App ID**: Create in https://heyvincent.ai

### Installation (2 minutes)

```bash
# Clone repository
git clone https://github.com/saucerhedgevault/backend.git
cd backend

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
pnpm dev

# Verify health
curl http://localhost:3001/api/health
```

---

## 🏗️ Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SaucerHedge Backend Architecture                      │
└─────────────────────────────────────────────────────────────────────────┘

                          🌐 Frontend (React/Vite)
                                  ▲
                                  │ HTTP/REST
                                  ▼
                  ┌──────────────────────────────────┐
                  │   Express.js HTTP Server         │
                  │   (Port 3001)                    │
                  │   ┌──────────────────────────┐   │
                  │   │  CORS Middleware         │   │
                  │   │  Error Handling          │   │
                  │   │  Request Logging         │   │
                  │   └──────────────────────────┘   │
                  └────────────┬─────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
      ┌──────────────┐  ┌─────────────┐  ┌──────────┐
      │ Chat Routes  │  │ Auth Routes │  │ Health   │
      │              │  │             │  │ Routes   │
      └──────┬───────┘  └──────┬──────┘  └──────────┘
             │                 │
             ▼                 ▼
      ┌──────────────────────────────────┐
      │  HederaAgent (AI Orchestrator)   │
      │  ┌─────────────────────────────┐ │
      │  │ Gemini 2.5 Flash LLM       │ │
      │  │ Tool Selection Logic       │ │
      │  │ Conversation Management    │ │
      │  │ Response Formatting        │ │
      │  └─────────────────────────────┘ │
      └────────┬─────────────────────────┘
               │
   ┌───────────┼───────────┬─────────────┐
   ▼           ▼           ▼             ▼
┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│Ability │ │Transaction│Vincent │ │Response  │
│Loader  │ │Service   │Service │ │Formatter │
│        │ │          │        │ │          │
└───┬────┘ └─────┬────┘ └───┬───┘ └──────────┘
    │            │          │
    ▼            ▼          ▼
┌────────────────────────────────────────┐
│ Ability Executor                       │
│ ┌──────────────────────────────────┐  │
│ │ Dynamic Ability Execution        │  │
│ │ Parameter Building               │  │
│ │ Result Parsing                   │  │
│ └──────────────────────────────────┘  │
└────┬───────────────────────────────────┘
     │
     ├──────────────────┬─────────────┐
     ▼                  ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌─────────────┐
│   Hedera     │ │ NPM Registry │ │ Published   │
│   Network    │ │(@saucerhedge)│ │ Abilities   │
│   Testnet    │ └──────────────┘ │             │
│ & Mainnet    │                  │ 1. open-pos │
└──────────────┘                  │ 2. close-.. │
                                  │ 3. deposit  │
                                  │ 4. get-st.. │
                                  │ 5. open-v.. │
                                  │ 6. close-v. │
                                  └─────────────┘

                ┌──────────────────────────────┐
                │ State Management             │
                │ ├─ Conversation History      │
                │ ├─ Execution Logs            │
                │ ├─ Transaction Cache         │
                │ └─ User Sessions             │
                └──────────────────────────────┘
```

---

## 📊 Detailed System Design

### Component Interaction & Request Processing Pipeline

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       REQUEST PROCESSING PIPELINE                          │
└────────────────────────────────────────────────────────────────────────────┘

USER REQUEST
    │
    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. HTTP Server (Express)                                              │
│    ├─ Parse JSON request body                                         │
│    ├─ Validate CORS headers                                           │
│    └─ Log incoming request                                            │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Route Handler (/api/chat)                                          │
│    ├─ Extract userMessage & conversationHistory                       │
│    ├─ Generate unique userId (session)                                │
│    └─ Pass to HederaAgent.processMessage()                            │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. HederaAgent (Main Orchestrator)                                     │
│    ├─ Load conversation history for user                              │
│    ├─ Build message array with system prompt                          │
│    ├─ Call Gemini 2.5 Flash LLM with tools                           │
│    └─ Parse LLM response (text + tool_use blocks)                     │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ├────────────────────────────────┐
              │                                │
              ▼                                ▼
     ┌──────────────────────┐        ┌──────────────────────┐
     │ NO TOOL SELECTED     │        │ TOOL SELECTED        │
     │                      │        │                      │
     │ Return text response │        │ Execute ability      │
     │ from LLM             │        │                      │
     └──────┬───────────────┘        └────────┬─────────────┘
            │                                │
            └────────────┬───────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Tool Selection & Routing (if tool was used)                        │
│    ├─ Get tool name from LLM response                                 │
│    ├─ Map tool name → ability name                                    │
│    └─ Validate tool inputs against schema                             │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. AbilityExecutor.executeAbility()                                    │
│    ├─ Retrieve ability metadata from cache/NPM                        │
│    ├─ Build ContractExecuteTransaction                                │
│    ├─ Validate parameters                                             │
│    └─ Send to Hedera network                                          │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 6. TransactionService (Hedera Integration)                             │
│    ├─ Execute contract call on testnet/mainnet                        │
│    ├─ Wait for receipt confirmation                                   │
│    ├─ Parse transaction results                                       │
│    └─ Store execution in history                                      │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 7. ResponseFormatter (Dynamic Response Generation)                     │
│    ├─ Get ability-specific template                                   │
│    ├─ Inject dynamic data from execution result                       │
│    ├─ Format as markdown with tables/lists                            │
│    └─ Add transaction hash and metadata                               │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 8. Response Object                                                     │
│    {                                                                   │
│      id: string                   (timestamp)                          │
│      role: 'assistant'                                                │
│      content: string              (markdown)                           │
│      timestamp: Date                                                   │
│      txHash?: string              (transaction link)                  │
│      abilities?: string[]         (tools used)                        │
│    }                                                                   │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 9. Update Conversation History                                         │
│    ├─ Store user message                                              │
│    ├─ Store assistant response                                        │
│    └─ Keep last 50 messages in memory                                 │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 10. Return HTTP Response (JSON)                                        │
│     ├─ Set Content-Type: application/json                             │
│     ├─ Set CORS headers                                               │
│     └─ Send response to frontend                                      │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              ▼
          📱 Frontend
```

### Multi-Layer Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                     LAYERED ARCHITECTURE                               │
└────────────────────────────────────────────────────────────────────────┘

LAYER 7 - Presentation Layer
┌────────────────────────────────────────────────────────────────────────┐
│ HTTP Response Formatting                                               │
│ ├─ JSON Serialization                                                 │
│ ├─ CORS Headers                                                       │
│ └─ Error Response Formatting                                          │
└────────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
LAYER 6 - Application Layer
┌────────────────────────────────────────────────────────────────────────┐
│ HederaAgent (Main Orchestrator)                                        │
│ ├─ LLM Integration (Gemini 2.5 Flash)                                 │
│ ├─ Tool Selection Logic                                               │
│ ├─ Conversation Management                                            │
│ └─ Error Handling & Fallbacks                                         │
└────────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
LAYER 5 - Business Logic Layer
┌────────────────────────────────────────────────────────────────────────┐
│ Services Layer                                                         │
│ ┌──────────────┬─────────────────┬──────────────────────────────────┐ │
│ │AbilityExecutor│ TransactionSvc  │ VincentService                 │ │
│ │              │                 │                                  │ │
│ │• Loader      │ • Builder       │ • Auth URL Gen                  │ │
│ │• Executor    │ • Executor      │ • Delegation Scope              │ │
│ │• Cache       │ • Monitor       │ • Validation                    │ │
│ └──────────────┴─────────────────┴──────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ ResponseFormatter                                                │  │
│ │ • Ability-specific templates                                   │  │
│ │ • Dynamic content injection                                    │  │
│ │ • Markdown formatting                                          │  │
│ └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
LAYER 4 - Data Access Layer
┌────────────────────────────────────────────────────────────────────────┐
│ Tool Management                                                        │
│ ├─ AbilityLoader: Fetch from NPM Registry                             │
│ ├─ ToolDefinitions: Generate tool schemas                             │
│ ├─ ToolMapping: Map names to abilities                                │
│ └─ ToolExecution: Execute with parameters                             │
└────────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
LAYER 3 - External Integration Layer
┌────────────────────────────────────────────────────────────────────────┐
│ External Services                                                      │
│ ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌────────────────────┐   │
│ │Gemini LLM│ │ Hedera SDK   │ │NPM Regist.│ │ Vincent Protocol   │   │
│ │          │ │              │ │           │ │                    │   │
│ │• Chat API│ │• Client      │ │• Packages │ │• Auth              │   │
│ │• Tools   │ │• Contracts   │ │• Metadata │ │• Abilities         │   │
│ └──────────┘ └──────────────┘ └───────────┘ └────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
LAYER 2 - Configuration Layer
┌────────────────────────────────────────────────────────────────────────┐
│ Config Management                                                      │
│ ├─ Environment Variables (.env)                                       │
│ ├─ Hedera Client Initialization                                       │
│ ├─ LLM Configuration                                                  │
│ └─ Constants & Credentials                                            │
└────────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
LAYER 1 - Infrastructure Layer
┌────────────────────────────────────────────────────────────────────────┐
│ HTTP Server & Middleware                                               │
│ ├─ Express.js Server                                                  │
│ ├─ CORS Middleware                                                    │
│ ├─ Error Handler                                                      │
│ ├─ Request Logger                                                     │
│ └─ Route Definitions                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation & Setup

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/saucerhedgevault/backend.git
cd backend

# Install dependencies with pnpm
pnpm install

# Verify installation
pnpm --version  # Should be 8.0+
node --version  # Should be 18.0+
```

### Step 2: Environment Setup

```bash
# Copy example to .env
cp .env.example .env

# Edit with your credentials
nano .env  # or use your favorite editor
```

**Fill these required fields:**

```env
HEDERA_ACCOUNT_ID=0.0.YOUR_ID           # From Hedera Portal
HEDERA_PRIVATE_KEY=YOUR_DER_KEY         # From Hedera Portal
HEDERA_NETWORK=testnet                  # Start with testnet

GEMINI_API_KEY=YOUR_KEY                 # From Google AI Studio
VINCENT_APP_ID=7142827824               # Your Vincent App ID
VINCENT_REDIRECT_URI=http://localhost:8080/callback
```

### Step 3: Verification

```bash
# Test environment loading
pnpm dev

# In another terminal:
curl http://localhost:3001/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-10-26T...",
#   "network": "testnet"
# }
```

### Step 4: Load Abilities

```bash
# The backend automatically loads 6 abilities on startup
# Check logs for:
# ✅ Loaded ability: @saucerhedgevault/open-hedged-position-ability
# ✅ Loaded ability: @saucerhedgevault/close-hedged-position-ability
# ... (4 more abilities)
```

---

## 📡 API Documentation

### 1. Chat Endpoint

**POST** `/api/chat`

Send user message and get AI-powered response with ability execution.

#### Request

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Open a hedged position with 100 USDC and 5 HBAR",
    "history": [
      {
        "role": "user",
        "content": "What can you do?"
      },
      {
        "role": "assistant",
        "content": "I can help you hedge LP positions..."
      }
    ]
  }'
```

#### Response (Success)

```json
{
  "id": "1729959234000",
  "role": "assistant",
  "content": "**Opening Hedged LP Position** 🚀\n\n**Position Details:**\n• Position ID: #4523\n• LP Allocation: $79.00\n• Short Allocation: $21.00\n\n**Status:** ✨ **Successfully Opened!**\n📝 TX: [0x789abc](https://hashscan.io/testnet/transaction/0x789abc)",
  "timestamp": "2025-10-26T21:34:00.000Z",
  "txHash": "0x789abc",
  "abilities": ["open-position"],
  "toolUsed": "open-hedged-position"
}
```

#### Response (Error)

```json
{
  "id": "1729959234000",
  "role": "assistant",
  "content": "I encountered an error processing your request: Invalid input parameters. Please try again.",
  "timestamp": "2025-10-26T21:34:00.000Z"
}
```

### 2. Health Check Endpoint

**GET** `/api/health`

Check backend status and network connection.

#### Response

```json
{
  "status": "ok",
  "timestamp": "2025-10-26T21:34:00.000Z",
  "network": "testnet"
}
```

### 3. Auth Endpoints

**POST** `/api/auth/auth-url`

Generate Vincent authentication URL.

#### Request

```bash
curl -X POST http://localhost:3001/api/auth/auth-url \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x1234..."
  }'
```

#### Response

```json
{
  "authUrl": "https://vincent.hedera.com/auth?app_id=7142827824&...",
  "appId": 7142827824
}
```

---

## 🔄 Request Flow

### Complete Request Flow Diagram

```
User Types Message
    │
    ▼
┌────────────────────────────────────┐
│ Frontend sends POST /api/chat      │
│ Body: {message, history}           │
└──────────┬────────────────────────┘
           │
           ▼
  🖥️ Backend Server
  ┌────────────────────────────────────┐
  │ 1. Parse & Validate Request        │
  │    ✓ Extract message text          │
  │    ✓ Validate JSON format          │
  │    ✓ Check message length          │
  └────────────┬────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────┐
  │ 2. HederaAgent.processMessage()    │
  │    ✓ Load conversation history     │
  │    ✓ Build system prompt           │
  │    ✓ Build message array           │
  └────────────┬────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────┐
  │ 3. Call Gemini 2.5 Flash LLM       │
  │    📡 Send to Google API            │
  │    ⏳ Wait for response (1-3s)     │
  │    ✓ Parse LLM response            │
  └────────────┬────────────────────────┘
               │
        ┌──────┴──────┐
        │ DECISION    │
        ▼             ▼
  [TEXT ONLY]    [TOOL SELECTED]
        │             │
        │             ▼
        │      ┌───────────────────────┐
        │      │ 4. Tool Execution     │
        │      │    ✓ Map tool→ability │
        │      │    ✓ Validate inputs  │
        │      │    ✓ Execute ability  │
        │      │    ✓ Get results      │
        │      └─────────┬─────────────┘
        │                │
        │                ▼
        │      ┌───────────────────────┐
        │      │ 5. Format Response    │
        │      │    ✓ Use template     │
        │      │    ✓ Inject data      │
        │      │    ✓ Add tx hash      │
        │      └─────────┬─────────────┘
        │                │
        └────────┬───────┘
                 │
                 ▼
  ┌────────────────────────────────────┐
  │ 6. Update Conversation History     │
  │    ✓ Save user message             │
  │    ✓ Save assistant response       │
  └────────────┬────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────┐
  │ 7. Return JSON Response            │
  │    ✓ Set CORS headers              │
  │    ✓ Set Content-Type              │
  │    ✓ Send 200 OK                   │
  └──────────────┬──────────────────────┘
                 │
                 ▼
           📱 Frontend
           Display response
           Update chat UI
           Show transaction link
```

---

## 🛠️ Services Deep Dive

### HederaAgent Service

**Purpose**: Main AI orchestration engine using Gemini 2.5 Flash

**Key Methods**:
- `processMessage()` - Main entry point for processing user messages
- `getConversationHistory()` - Retrieve conversation for user
- `updateConversationHistory()` - Save messages
- `getExecutionLogs()` - View execution history
- `getStats()` - Get agent statistics

**Features**:
- ✅ Multi-user support with per-user conversation history
- ✅ Tool calling with dynamic ability selection
- ✅ Execution logging for debugging
- ✅ Memory management (keeps last 50 messages)
- ✅ Error recovery with graceful fallbacks

### AbilityExecutor Service

**Purpose**: Execute Vincent abilities on Hedera network

**Key Methods**:
- `executeAbility()` - Execute any ability with inputs
- `getExecutionHistory()` - View past executions
- `executeAbilityContract()` - Low-level contract execution

**Features**:
- ✅ Dynamic ability loading from NPM
- ✅ Parameter validation
- ✅ Transaction monitoring
- ✅ Result parsing
- ✅ Error handling

### TransactionService

**Purpose**: Hedera blockchain interaction

**Key Methods**:
- `executeContractFunction()` - Call smart contracts
- `getTransactionStatus()` - Check transaction status
- `waitForConfirmation()` - Monitor for completion
- `estimateGas()` - Predict gas usage
- `getHashScanUrl()` - Generate explorer links

**Features**:
- ✅ Parameter building for all ability types
- ✅ Gas estimation
- ✅ Transaction monitoring with retry logic
- ✅ History tracking
- ✅ Explorer URL generation

### ResponseFormatter Service

**Purpose**: Format AI agent responses dynamically

**Key Methods**:
- `formatAbilityResponse()` - Format ability results

**Features**:
- ✅ Ability-specific templates
- ✅ Markdown formatting
- ✅ Dynamic data injection
- ✅ Table formatting
- ✅ Transaction link generation

---

## ⚡ Performance Optimization

### Caching Strategy

```
┌─────────────────────────────────────┐
│ Ability Metadata Cache (3600s TTL)  │
├─────────────────────────────────────┤
│ Key: @saucerhedgevault/ability-name │
│ Value: AbilityMetadata object       │
│ Miss Rate: ~5% (on new abilities)   │
└─────────────────────────────────────┘
```

### Memory Management

```
Conversation History
├─ Max 50 messages per user
├─ Auto-cleanup on overflow
└─ ~1KB per message = ~50KB per active user

Execution Logs
├─ Max 1000 logs total
├─ Auto-cleanup on overflow
└─ ~2KB per log = ~2MB max memory
```

### Response Times (Benchmarks)

| Operation | Time | Notes |
|-----------|------|-------|
| Health Check | 5ms | Direct response |
| Text Response (no tool) | 1-3s | LLM latency |
| Tool Execution | 2-5s | Hedera network |
| Total Chat Response | 3-8s | Combined |

---

## 🔐 Security Considerations

### Environment Variable Protection

```bash
❌ DON'T COMMIT:
- .env files
- Private keys
- API keys
- Account credentials

✅ DO COMMIT:
- .env.example
- Configuration schemas
- Documentation
```

### JWT Tokens (Optional)

```typescript
// For production, implement JWT validation:
const validateToken = (token: string) => {
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};
```

### Rate Limiting

```typescript
// Recommended rate limits:
- 100 requests per minute per IP
- 10 concurrent connections per user
- 5MB max request body size
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "HEDERA_ACCOUNT_ID not found"

```bash
# Solution: Set environment variable
export HEDERA_ACCOUNT_ID=0.0.YOUR_ID
# Or add to .env file
```

#### 2. "Failed to load ability"

```bash
# Check npm registry connection
npm ping

# Clear ability cache
# Delete node_modules/.cache directory

# Verify network
curl -I https://registry.npmjs.org
```

#### 3. "Gemini API error"

```bash
# Verify API key
echo $GEMINI_API_KEY

# Check quota
# Visit: https://console.cloud.google.com

# Test API connectivity
curl -X POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

#### 4. "Transaction timeout"

```bash
# Increase timeout in .env
TRANSACTION_TIMEOUT=60000  # 60 seconds

# Check Hedera network status
curl https://status.hedera.com
```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug pnpm dev

# Watch specific service
NODE_DEBUG=hedera,abilities pnpm dev
```

---

## 🤝 Contributing

### Adding New Abilities

1. **Create ability package**
   ```bash
   mkdir packages/my-ability
   cd packages/my-ability
   pnpm init
   ```

2. **Add to AbilityLoader**
   ```typescript
   const abilities = [
     // ... existing
     '@saucerhedgevault/my-ability',
   ];
   ```

3. **Add to ResponseFormatter**
   ```typescript
   'my-ability': (data, ctx) => `
     **My Ability Response** 🚀
     ${ctx}
     ...
   `
   ```

### Testing

```bash
# Run tests
pnpm test

# Test specific service
pnpm test -- hederaAgent

# Watch mode
pnpm test --watch
```

---

## 📚 Additional Resources

- **Hedera Docs**: https://docs.hedera.com
- **Gemini API**: https://ai.google.dev
- **Vincent Protocol**: https://docs.heyvincent.ai
- **Express.js**: https://expressjs.com
- **TypeScript**: https://www.typescriptlang.org

---

## 📞 Support

- 🐛 **Issues**: Open on GitHub
- 💬 **Discussions**: GitHub Discussions
- 📧 **Email**: support@saucerhedge.com
- 🔗 **Discord**: https://discord.gg/saucerhedge

---

**Built with ❤️ by SaucerHedge Team**

*Last Updated: October 26, 2025*
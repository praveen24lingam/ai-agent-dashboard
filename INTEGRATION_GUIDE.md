# Real-Time Agent Tracking Integration Guide

This guide shows you how to send real-time evaluation data from your AI agents to this evaluation platform.

## 🎯 Overview

Your AI agents need to POST evaluation data to `/api/evals/ingest` after each interaction. The platform will then display real-time metrics on your dashboard.

## 🔑 Authentication

First, get your authentication token:

1. **Login to get JWT token**:
   - Login at `http://localhost:3000/login`
   - Open browser DevTools → Application → Cookies
   - Copy the value of cookie named `sb-<project-ref>-auth-token`

   OR use the API:

   ```javascript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'your@email.com',
     password: 'yourpassword'
   })
   const token = data.session.access_token
   ```

2. **Get your Agent ID**:
   - Go to `/agents` in the UI
   - Click on your agent
   - Copy the Agent ID from the URL or UI

## 📡 Integration Methods

### Method 1: Direct HTTP Request (Any Language)

#### Python Example

```python
import requests
import time
import uuid

PLATFORM_URL = "http://localhost:3000"
AGENT_ID = "your-agent-id-here"  # Get this from /agents page
ACCESS_TOKEN = "your-jwt-token"   # Get from login

def send_evaluation(interaction_id, prompt, response, latency_ms, score=None):
    """Send evaluation data to the platform"""
    
    payload = {
        "agent_id": AGENT_ID,
        "interaction_id": interaction_id,
        "prompt": prompt,
        "response": response,
        "latency_ms": latency_ms,
        "score": score,  # Optional: 0-100
        "flags": {
            "model": "gpt-4",
            "temperature": 0.7,
            "success": True
        },
        "pii_tokens_redacted": 0
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ACCESS_TOKEN}"
    }
    
    response = requests.post(
        f"{PLATFORM_URL}/api/evals/ingest",
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200:
        print(f"✓ Evaluation sent: {response.json()['evaluation_id']}")
    else:
        print(f"✗ Error: {response.status_code} - {response.text}")

# Example: Integrate with your AI agent
def your_ai_agent(user_input):
    """Your existing AI agent logic"""
    
    start_time = time.time()
    interaction_id = str(uuid.uuid4())
    
    # Your AI processing here
    ai_response = "This is the AI response..."
    
    latency = int((time.time() - start_time) * 1000)  # Convert to ms
    
    # Send to evaluation platform
    send_evaluation(
        interaction_id=interaction_id,
        prompt=user_input,
        response=ai_response,
        latency_ms=latency,
        score=85  # Your scoring logic here
    )
    
    return ai_response

# Usage
your_ai_agent("What is the weather today?")
```

#### Node.js/TypeScript Example

```typescript
import fetch from 'node-fetch'
import { v4 as uuidv4 } from 'uuid'

const PLATFORM_URL = 'http://localhost:3000'
const AGENT_ID = 'your-agent-id-here'
const ACCESS_TOKEN = 'your-jwt-token'

async function sendEvaluation(
  interactionId: string,
  prompt: string,
  response: string,
  latencyMs: number,
  score?: number
) {
  const payload = {
    agent_id: AGENT_ID,
    interaction_id: interactionId,
    prompt,
    response,
    latency_ms: latencyMs,
    score,
    flags: {
      model: 'gpt-4',
      temperature: 0.7,
      success: true
    },
    pii_tokens_redacted: 0
  }

  try {
    const res = await fetch(`${PLATFORM_URL}/api/evals/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      const data = await res.json()
      console.log(`✓ Evaluation sent: ${data.evaluation_id}`)
      return data
    } else {
      console.error(`✗ Error: ${res.status} - ${await res.text()}`)
    }
  } catch (error) {
    console.error('Failed to send evaluation:', error)
  }
}

// Example: Integrate with your AI agent
async function yourAIAgent(userInput: string): Promise<string> {
  const startTime = Date.now()
  const interactionId = uuidv4()

  // Your AI processing here
  const aiResponse = 'This is the AI response...'

  const latency = Date.now() - startTime

  // Send to evaluation platform (fire and forget or await)
  await sendEvaluation(
    interactionId,
    userInput,
    aiResponse,
    latency,
    85 // Your scoring logic
  )

  return aiResponse
}

// Usage
yourAIAgent('What is the weather today?')
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/evals/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agent_id": "your-agent-id",
    "interaction_id": "unique-id-12345",
    "prompt": "What is the capital of France?",
    "response": "The capital of France is Paris.",
    "score": 95,
    "latency_ms": 234,
    "flags": {
      "model": "gpt-4",
      "confidence": 0.98,
      "category": "factual"
    },
    "pii_tokens_redacted": 0
  }'
```

### Method 2: SDK Wrapper (Recommended)

Create a reusable SDK for your team:

#### Python SDK

```python
# evaluation_client.py
import requests
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class EvaluationClient:
    """Client for sending evaluations to the AI Agent Evaluation Platform"""
    
    def __init__(self, platform_url: str, agent_id: str, access_token: str):
        self.platform_url = platform_url.rstrip('/')
        self.agent_id = agent_id
        self.access_token = access_token
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        })
    
    def track_interaction(
        self,
        prompt: str,
        response: str,
        latency_ms: int,
        score: Optional[int] = None,
        flags: Optional[Dict[str, Any]] = None,
        pii_tokens_redacted: int = 0,
        interaction_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Track an AI agent interaction
        
        Args:
            prompt: User input to the agent
            response: Agent's response
            latency_ms: Response time in milliseconds
            score: Optional evaluation score (0-100)
            flags: Optional metadata dictionary
            pii_tokens_redacted: Number of PII tokens removed
            interaction_id: Optional custom interaction ID
            
        Returns:
            Response data with evaluation_id
        """
        
        payload = {
            'agent_id': self.agent_id,
            'interaction_id': interaction_id or str(uuid.uuid4()),
            'prompt': prompt,
            'response': response,
            'latency_ms': latency_ms,
            'score': score,
            'flags': flags or {},
            'pii_tokens_redacted': pii_tokens_redacted
        }
        
        try:
            response = self.session.post(
                f'{self.platform_url}/api/evals/ingest',
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f'Failed to send evaluation: {e}')
            raise
    
    def track_batch(self, evaluations: list) -> list:
        """Track multiple interactions (sequential for now)"""
        results = []
        for eval_data in evaluations:
            try:
                result = self.track_interaction(**eval_data)
                results.append(result)
            except Exception as e:
                print(f'Failed to track evaluation: {e}')
                results.append({'error': str(e)})
        return results

# Usage example
if __name__ == '__main__':
    client = EvaluationClient(
        platform_url='http://localhost:3000',
        agent_id='your-agent-id',
        access_token='your-jwt-token'
    )
    
    # Track single interaction
    result = client.track_interaction(
        prompt='Tell me about Python',
        response='Python is a high-level programming language...',
        latency_ms=145,
        score=90,
        flags={'model': 'gpt-4', 'category': 'technical'}
    )
    print(f"Tracked: {result['evaluation_id']}")
```

#### TypeScript SDK

```typescript
// evaluationClient.ts
import fetch from 'node-fetch'
import { v4 as uuidv4 } from 'uuid'

interface EvaluationPayload {
  agent_id: string
  interaction_id: string
  prompt: string
  response: string
  latency_ms: number
  score?: number
  flags?: Record<string, any>
  pii_tokens_redacted?: number
}

interface TrackOptions {
  prompt: string
  response: string
  latencyMs: number
  score?: number
  flags?: Record<string, any>
  piiTokensRedacted?: number
  interactionId?: string
}

export class EvaluationClient {
  private platformUrl: string
  private agentId: string
  private accessToken: string

  constructor(platformUrl: string, agentId: string, accessToken: string) {
    this.platformUrl = platformUrl.replace(/\/$/, '')
    this.agentId = agentId
    this.accessToken = accessToken
  }

  async trackInteraction(options: TrackOptions): Promise<any> {
    const payload: EvaluationPayload = {
      agent_id: this.agentId,
      interaction_id: options.interactionId || uuidv4(),
      prompt: options.prompt,
      response: options.response,
      latency_ms: options.latencyMs,
      score: options.score,
      flags: options.flags || {},
      pii_tokens_redacted: options.piiTokensRedacted || 0
    }

    try {
      const response = await fetch(`${this.platformUrl}/api/evals/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to send evaluation:', error)
      throw error
    }
  }

  async trackBatch(evaluations: TrackOptions[]): Promise<any[]> {
    const results = []
    for (const evalData of evaluations) {
      try {
        const result = await this.trackInteraction(evalData)
        results.push(result)
      } catch (error) {
        results.push({ error: (error as Error).message })
      }
    }
    return results
  }
}

// Usage example
const client = new EvaluationClient(
  'http://localhost:3000',
  'your-agent-id',
  'your-jwt-token'
)

await client.trackInteraction({
  prompt: 'What is TypeScript?',
  response: 'TypeScript is a typed superset of JavaScript...',
  latencyMs: 156,
  score: 92,
  flags: { model: 'gpt-4', language: 'en' }
})
```

## 🔄 Integration Patterns

### Pattern 1: Synchronous Tracking

Track immediately after each interaction (adds ~50-100ms latency):

```python
def handle_user_request(user_input):
    start = time.time()
    
    # Process with your AI
    response = your_ai_model(user_input)
    
    latency = int((time.time() - start) * 1000)
    
    # Send to platform (blocks until sent)
    send_evaluation(str(uuid.uuid4()), user_input, response, latency)
    
    return response
```

### Pattern 2: Asynchronous Tracking (Recommended)

Track in background without blocking response:

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

def handle_user_request(user_input):
    start = time.time()
    
    response = your_ai_model(user_input)
    latency = int((time.time() - start) * 1000)
    
    # Send in background thread
    executor.submit(
        send_evaluation,
        str(uuid.uuid4()),
        user_input,
        response,
        latency
    )
    
    return response  # Return immediately
```

### Pattern 3: Batch Tracking

Accumulate evaluations and send in batches:

```python
from queue import Queue
import threading

eval_queue = Queue()

def background_sender():
    """Background thread that sends batched evaluations"""
    while True:
        batch = []
        while not eval_queue.empty() and len(batch) < 10:
            batch.append(eval_queue.get())
        
        if batch:
            for eval_data in batch:
                send_evaluation(**eval_data)
        
        time.sleep(5)  # Send every 5 seconds

# Start background thread
threading.Thread(target=background_sender, daemon=True).start()

def handle_user_request(user_input):
    start = time.time()
    response = your_ai_model(user_input)
    latency = int((time.time() - start) * 1000)
    
    # Queue for background sending
    eval_queue.put({
        'interaction_id': str(uuid.uuid4()),
        'prompt': user_input,
        'response': response,
        'latency_ms': latency
    })
    
    return response
```

## 📊 Data Flow

```
Your AI Agent → /api/evals/ingest → Supabase → Dashboard (Real-time)
                     ↓
              Stores in evaluations table
                     ↓
              Metrics API processes
                     ↓
              Dashboard updates automatically
```

## 🎨 Viewing Real-Time Data

Once you start sending data:

1. **Dashboard** (`/dashboard`):
   - See total evaluations count update
   - Watch average latency change
   - Monitor success rate
   - View recent activity

2. **Analytics** (`/analytics`):
   - Drill into detailed charts
   - Filter by date range (7/30/90 days)
   - See score distributions
   - Analyze latency trends

3. **Agents Page** (`/agents`):
   - View per-agent statistics
   - Compare performance across agents

## 🚀 Production Deployment

When deploying to production:

1. **Update URLs**:
   ```python
   PLATFORM_URL = "https://your-domain.com"
   ```

2. **Secure Tokens**:
   - Store tokens in environment variables
   - Rotate tokens regularly
   - Use service accounts for automated agents

3. **Error Handling**:
   - Implement retry logic with exponential backoff
   - Log failed submissions
   - Set up alerts for ingestion failures

4. **Rate Limiting**:
   - Respect the `max_eval_per_day` limit set in agent config
   - Implement client-side throttling if needed

## 🧪 Testing Your Integration

```python
# test_integration.py
import time

def test_evaluation_tracking():
    """Test that evaluations are being sent correctly"""
    
    test_data = {
        'interaction_id': 'test-' + str(time.time()),
        'prompt': 'Test prompt',
        'response': 'Test response',
        'latency_ms': 100,
        'score': 85
    }
    
    result = send_evaluation(**test_data)
    assert 'evaluation_id' in result, "Should return evaluation_id"
    
    print("✓ Integration test passed!")

if __name__ == '__main__':
    test_evaluation_tracking()
```

## 📝 Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_id` | UUID | ✓ | Your agent's unique ID from /agents page |
| `interaction_id` | String | ✓ | Unique ID for this interaction (use UUID) |
| `prompt` | String | ✓ | User input sent to agent |
| `response` | String | ✓ | Agent's output response |
| `latency_ms` | Integer | ✓ | Response time in milliseconds |
| `score` | Integer | ✗ | Evaluation score (0-100) |
| `flags` | Object | ✗ | Custom metadata (JSON) |
| `pii_tokens_redacted` | Integer | ✗ | Number of PII tokens masked |

## 🆘 Troubleshooting

**401 Unauthorized**:
- Check your JWT token is valid and not expired
- Re-login to get a fresh token

**404 Agent Not Found**:
- Verify the `agent_id` exists in your account
- Check you're using the correct agent ID

**400 Missing Fields**:
- Ensure all required fields are present
- Check field types match the schema

**500 Server Error**:
- Check server logs for details
- Verify database schema is applied correctly

## 💡 Best Practices

1. **Use unique interaction IDs**: Always generate new UUIDs
2. **Include relevant metadata**: Use the `flags` field for context
3. **Track all interactions**: Don't selectively log - let the platform's sampling handle it
4. **Monitor ingestion**: Set up alerts if evaluations stop arriving
5. **Test in development**: Use the seed script to verify dashboard updates

---

**Ready to track your AI agents? Start by copying one of the code examples above!** 🚀

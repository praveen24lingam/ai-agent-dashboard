// Load environment variables from .env.local (if present) and fallback to .env
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {}
try {
  require('dotenv').config()
} catch (e) {}

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample data generators
const sampleAgentNames = [
  'ChatBot Assistant',
  'Code Review Agent',
  'Customer Support AI',
  'Content Moderator',
  'Translation Bot',
  'Research Assistant',
  'Email Classifier',
  'Sentiment Analyzer'
]

const sampleDescriptions = [
  'General purpose conversational AI assistant',
  'Automated code review and quality assessment',
  'Handles customer inquiries and support tickets',
  'Reviews and moderates user-generated content',
  'Translates text between multiple languages',
  'Assists with research and information gathering',
  'Classifies and routes incoming emails',
  'Analyzes sentiment in text and social media'
]

const samplePrompts = [
  'What is the weather like today?',
  'Can you help me write a Python function to sort an array?',
  'I need help with my order #12345',
  'Please review this code for security vulnerabilities',
  'Translate this text to French: "Hello, how are you?"',
  'What are the latest developments in artificial intelligence?',
  'Classify this email as spam or not spam',
  'Analyze the sentiment of this tweet',
  'Help me debug this JavaScript error',
  'What is the best way to learn machine learning?',
  'Can you explain quantum computing in simple terms?',
  'I want to cancel my subscription',
  'Review this pull request for code quality',
  'Is this content appropriate for children?',
  'Generate a summary of this research paper',
  'What programming language should I learn first?'
]

const sampleResponses = [
  'I don\'t have access to real-time weather data, but I can help you find weather information through various weather services.',
  'Here\'s a simple Python function to sort an array: \\n\\n```python\\ndef sort_array(arr):\\n    return sorted(arr)\\n```',
  'I\'d be happy to help with your order. Let me look up the details for order #12345.',
  'I\'ve reviewed your code and found a few potential security issues. Here are my recommendations...',
  'The French translation is: "Bonjour, comment allez-vous?"',
  'Recent developments in AI include advances in large language models, computer vision, and autonomous systems.',
  'Based on the content and sender patterns, this email appears to be legitimate and not spam.',
  'The sentiment of this text appears to be positive with a confidence score of 0.85.',
  'The JavaScript error is likely caused by a missing variable declaration. Try adding "let" before your variable.',
  'To learn machine learning, I recommend starting with Python, statistics, and linear algebra fundamentals.',
  'Quantum computing uses quantum mechanical phenomena to process information in ways that classical computers cannot.',
  'I can help you with subscription cancellation. Let me guide you through the process.',
  'The pull request looks good overall, but I noticed a few areas for improvement in error handling.',
  'This content is appropriate for general audiences and doesn\'t contain any harmful material.',
  'Here\'s a summary of the key findings from the research paper: [summary content]',
  'For beginners, I recommend starting with Python due to its simplicity and versatility.'
]

const sampleFlags = [
  { 'content_warning': false, 'requires_human_review': false },
  { 'code_detected': true, 'language': 'python' },
  { 'customer_priority': 'high', 'department': 'support' },
  { 'security_scan': true, 'vulnerabilities_found': 2 },
  { 'translation_confidence': 0.95, 'source_language': 'en', 'target_language': 'fr' },
  { 'fact_check_required': true, 'citations_needed': true },
  { 'spam_score': 0.1, 'classification_confidence': 0.92 },
  { 'sentiment': 'positive', 'confidence': 0.85, 'emotions': ['joy', 'satisfaction'] },
  null,
  { 'educational_content': true, 'difficulty_level': 'beginner' },
  { 'topic_complexity': 'high', 'requires_technical_background': true },
  { 'urgency': 'high', 'customer_tier': 'premium' },
  { 'code_quality_score': 8.5, 'suggestions': 3 },
  { 'content_rating': 'safe', 'age_appropriate': true },
  { 'summary_length': 'medium', 'key_topics': ['AI', 'research', 'methodology'] },
  { 'recommendation_type': 'educational', 'skill_level': 'beginner' }
]

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomScore() {
  // Generate scores with a tendency toward higher values (70-95 range mostly)
  const rand = Math.random()
  if (rand < 0.1) return Math.floor(Math.random() * 40) + 40 // 40-79 (poor scores)
  if (rand < 0.3) return Math.floor(Math.random() * 20) + 60 // 60-79 (medium scores)
  return Math.floor(Math.random() * 25) + 70 // 70-94 (good scores)
}

function getRandomLatency() {
  // Generate realistic latency values (50ms to 2000ms)
  const rand = Math.random()
  if (rand < 0.7) return Math.floor(Math.random() * 500) + 100 // Most requests: 100-600ms
  if (rand < 0.9) return Math.floor(Math.random() * 800) + 600 // Some slower: 600-1400ms
  return Math.floor(Math.random() * 600) + 1400 // Few very slow: 1400-2000ms
}

function getRandomDate(daysAgo = 30) {
  const now = new Date()
  const pastDate = new Date(now.getTime() - (Math.random() * daysAgo * 24 * 60 * 60 * 1000))
  return pastDate.toISOString()
}

function getRandomPiiCount() {
  const rand = Math.random()
  if (rand < 0.7) return 0 // Most evaluations have no PII
  if (rand < 0.9) return Math.floor(Math.random() * 3) + 1 // Some have 1-3 PII tokens
  return Math.floor(Math.random() * 5) + 4 // Few have 4-8 PII tokens
}

async function createTestUser() {
  console.log('Creating test user...')
  
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'testpassword123'
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  })

  if (error) {
    console.error('Error creating test user:', error)
    throw error
  }

  console.log(`Created test user: ${testEmail} / ${testPassword}`)
  return data.user
}

async function createAgents(userId, count = 3) {
  console.log(`Creating ${count} test agents...`)
  
  const agents = []
  
  for (let i = 0; i < count; i++) {
    const agentData = {
      user_id: userId,
      name: sampleAgentNames[i % sampleAgentNames.length],
      description: sampleDescriptions[i % sampleDescriptions.length]
    }

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single()

    if (agentError) {
      console.error('Error creating agent:', agentError)
      continue
    }

    // Create agent config
    const configData = {
      agent_id: agent.id,
      user_id: userId,
      run_policy: Math.random() > 0.5 ? 'always' : 'sampled',
      sample_rate_pct: Math.floor(Math.random() * 50) + 50, // 50-100%
      obfuscate_pii: Math.random() > 0.7, // 30% chance
      max_eval_per_day: [100, 500, 1000, 2000][Math.floor(Math.random() * 4)]
    }

    const { error: configError } = await supabase
      .from('agent_configs')
      .insert(configData)

    if (configError) {
      console.error('Error creating agent config:', configError)
      continue
    }

    agents.push(agent)
    console.log(`Created agent: ${agent.name}`)
  }

  return agents
}

async function createEvaluations(userId, agents, count = 100) {
  console.log(`Creating ${count} test evaluations...`)
  
  const evaluations = []
  const batchSize = 20
  
  for (let i = 0; i < count; i += batchSize) {
    const batch = []
    const batchEnd = Math.min(i + batchSize, count)
    
    for (let j = i; j < batchEnd; j++) {
      const agent = getRandomItem(agents)
      const prompt = getRandomItem(samplePrompts)
      const response = getRandomItem(sampleResponses)
      
      const evaluation = {
        agent_id: agent.id,
        user_id: userId,
        interaction_id: `eval_${Date.now()}_${j}_${Math.random().toString(36).substring(7)}`,
        prompt,
        response,
        score: Math.random() > 0.1 ? getRandomScore() : null, // 10% chance of no score
        latency_ms: getRandomLatency(),
        flags: Math.random() > 0.4 ? getRandomItem(sampleFlags) : null, // 60% chance of flags
        pii_tokens_redacted: getRandomPiiCount(),
        created_at: getRandomDate(30)
      }
      
      batch.push(evaluation)
    }

    const { data, error } = await supabase
      .from('evaluations')
      .insert(batch)
      .select()

    if (error) {
      console.error('Error creating evaluation batch:', error)
      continue
    }

    evaluations.push(...data)
    console.log(`Created evaluations ${i + 1} to ${batchEnd}`)
  }

  return evaluations
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...')
    console.log('=================================')

    // Create test user
    const user = await createTestUser()
    
    // Create agents
    const agents = await createAgents(user.id, 4)
    
    if (agents.length === 0) {
      console.error('No agents created, stopping seed process')
      return
    }

    // Create evaluations
    await createEvaluations(user.id, agents, 150)

    console.log('=================================')
    console.log('Database seeding completed successfully!')
    console.log('')
    console.log('You can now:')
    console.log('1. Run the Next.js application: npm run dev')
    console.log('2. Login with the test user credentials shown above')
    console.log('3. Explore the dashboard with the generated data')
    console.log('')
    console.log('To ingest more evaluations, use the API endpoint:')
    console.log('POST /api/evals/ingest')
    console.log('')
    
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase }
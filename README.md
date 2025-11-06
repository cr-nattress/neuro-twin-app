# Neural Twin App

**Create an AI-powered digital persona from your personal data and chat with your digital self.**

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)

---

## 🚀 What is Neural Twin?

Neural Twin is a full-stack web application that transforms your personal information into an AI-powered digital persona. Share details about yourself through text blocks and links, and the system uses advanced AI to extract and structure a comprehensive persona profile. Then chat with your digital twin—an AI that understands and responds as your persona would.

Perfect for:
- Creating AI-powered personal assistants
- Exploring your digital identity
- Building interactive digital personas
- Understanding how AI perceives your information

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+ with npm
- **Supabase** account (free tier available)
- **OpenAI API** key
- **Netlify** account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/neural-twin-app.git
cd neural-twin-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configure Environment

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-proj-your-api-key

# Optional: For Netlify deployment auth redirects
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://your-domain.netlify.app
```

### Run Locally

```bash
# Clean and start dev server (handles port/lock issues)
npm run dev:clean

# Alternative: just start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your email (magic link authentication).

### Your First Persona

1. **Enter personal information** - Add text blocks describing yourself, interests, values
2. **Add reference links** - Include social profiles, portfolio, or relevant URLs
3. **AI processes** - OpenAI extracts structured persona data
4. **Review & save** - Edit if needed, then store your persona
5. **Chat with yourself** - Talk to your AI twin and see how it responds

---

## 🎯 Features

- 🔐 **Magic Link Authentication** - Email-based login with no passwords
- 🧠 **AI-Powered Extraction** - OpenAI converts personal data to structured personas
- 💬 **Real-time Chat** - Conversation with your AI persona
- 🎨 **Modern UI** - Built with React 19 and Tailwind CSS
- 📦 **Serverless Backend** - Netlify Functions for instant scaling
- 🗄️ **Secure Storage** - Supabase for encrypted persona data
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- 🚀 **Type Safe** - Full TypeScript with strict mode
- ⚡ **Production Ready** - Comprehensive error handling and validation

---

## 💡 How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Next.js React)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Login Page   │→ │  Home Page   │→ │  Chat Page   │      │
│  │  (Auth)      │  │  (Persona    │  │  (Messages)  │      │
│  │              │  │   Creation)  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
                           │
                    Middleware (Auth)
                           │
         ┌─────────────────┴──────────────────┐
         │                                    │
    ┌────▼──────────────┐      ┌─────────────▼────┐
    │ Netlify Functions │      │  Supabase Auth   │
    │  ┌──────────────┐ │      │  & Storage       │
    │  │  Process     │ │      │                  │
    │  │  Persona     │ │      │ • User Sessions  │
    │  │  (OpenAI)    │ │      │ • Persona JSON   │
    │  └──────────────┘ │      │  Files           │
    │  ┌──────────────┐ │      └──────────────────┘
    │  │  Save        │ │
    │  │  Persona     │ │
    │  └──────────────┘ │
    │  ┌──────────────┐ │
    │  │  Chat        │ │
    │  │  (OpenAI)    │ │
    │  └──────────────┘ │
    └────────────────────┘
            │
      ┌─────┴──────┐
      │             │
   OpenAI API   Supabase
```

### Data Flow

**Creating a Persona:**
1. User submits text blocks and links
2. Frontend validates input with Zod schemas
3. `process-persona` function sends to OpenAI GPT
4. AI extracts structured persona (traits, interests, communication style)
5. User reviews extracted persona
6. `save-persona` saves to Supabase Storage with unique ID
7. Persona is ready for chatting

**Chatting with Your Persona:**
1. User sends message
2. `chat` function retrieves persona from storage
3. Persona context injected into OpenAI prompt
4. AI generates response in persona's style
5. Response displayed in real-time chat interface

---

## 📚 Usage Examples

### Login with Magic Link

```typescript
// Automatic - just enter your email at /auth/login
// Supabase sends magic link email
// Click link → Session persisted
```

### Creating Your Persona

```typescript
// Frontend - home page
const response = await fetch('/.netlify/functions/process-persona', {
  method: 'POST',
  body: JSON.stringify({
    textBlocks: [
      "I'm a full-stack developer passionate about AI",
      "I love open source and teaching"
    ],
    links: [
      "https://github.com/myprofile",
      "https://twitter.com/myhandle"
    ]
  })
});

const persona = await response.json();
// {
//   id: "abc123",
//   traits: ["innovative", "collaborative", "curious"],
//   interests: ["AI", "web development", "open source"],
//   communicationStyle: "friendly and technical",
//   ...
// }
```

### Chatting with Your Persona

```typescript
// Send message to your AI twin
const response = await fetch('/.netlify/functions/chat', {
  method: 'POST',
  body: JSON.stringify({
    personaId: 'abc123',
    message: 'What are your thoughts on AI ethics?'
  })
});

const { response: aiResponse } = await response.json();
// Response comes from your persona's perspective
```

### Retrieving Personas

```bash
# Get a specific persona
curl https://your-domain/.netlify/functions/get-persona?persona_id=abc123

# List your personas (paginated)
curl https://your-domain/.netlify/functions/list-personas?limit=10
```

See the [examples directory](./examples) for complete code samples.

---

## 🛠️ Development

### Common Commands

```bash
# Start dev server
npm run dev

# Clean locks/ports and start dev
npm run dev:clean

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Project Structure

```
neural-twin-app/
├── app/                    # Next.js pages (App Router)
│   ├── auth/              # Login & auth callback
│   ├── chat/              # Chat interface
│   └── page.tsx           # Persona creation form
├── components/            # React components
│   ├── chat/              # Chat UI components
│   ├── persona/           # Persona form components
│   └── ui/                # shadcn/ui primitives
├── hooks/                 # React hooks (useAuth, useChat, etc.)
├── services/              # Business logic (service layer)
├── types/                 # TypeScript interfaces
├── netlify/
│   └── functions/         # Serverless backend
│       ├── process-persona.ts
│       ├── save-persona.ts
│       ├── chat.ts
│       └── lib/           # Shared utilities
├── middleware.ts          # Auth guards
├── netlify.toml          # Netlify config
└── package.json
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 | Web UI |
| **Styling** | Tailwind CSS 4 | Component styling |
| **Backend** | Netlify Functions | Serverless compute |
| **Database** | Supabase PostgreSQL | User data |
| **Storage** | Supabase Storage | Persona JSON files |
| **Auth** | Supabase Auth | Magic link login |
| **AI** | OpenAI GPT-4 | Persona extraction & chat |
| **Validation** | Zod | Input validation |
| **Language** | TypeScript 5.9 | Type safety |

---

## 🔒 Security

- **Authenticated Routes** - Middleware protects all pages except login
- **Input Validation** - Zod schemas validate all API inputs
- **Row Level Security** - Supabase RLS policies restrict data access
- **API Keys** - All keys stored in environment variables
- **CORS Headers** - Configured for Netlify Functions
- **Type Safety** - Full TypeScript prevents many common vulnerabilities

---

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Codebase guide for AI assistants
- **[Developing Guide](./docs/DEVELOPING.md)** - Local development setup (TODO)
- **[API Reference](./docs/API.md)** - Netlify Functions documentation (TODO)
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to production (TODO)
- **[Architecture](./docs/ARCHITECTURE.md)** - System design deep dive (TODO)

---

## 🚀 Deployment

### Deploy to Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-key
   OPENAI_API_KEY=your-key
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```
4. Deploy automatically on git push

### Supabase Setup

1. Create "personas" storage bucket
2. Set bucket to private
3. Create RLS policy for authenticated users
4. Enable magic link authentication

See [CLAUDE.md](./CLAUDE.md#deployment-notes) for detailed instructions.

---

## 🐛 Troubleshooting

### Dev Server Won't Start

```bash
# Clean locks and kill stale processes
npm run dev:clean
```

### Port Already in Use

The cleanup script handles this, but manually:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Mac/Linux
lsof -i :3000
kill -9 [PID]
```

### Environment Variables Not Loading

- Check `.env.local` exists in project root
- Ensure no trailing spaces in values
- Restart dev server after changes

### OpenAI API Errors

- Verify API key has GPT-4 access
- Check account has sufficient credits
- Review OpenAI rate limits
- Check function logs in Netlify

### Supabase Connection Issues

- Verify bucket exists and is named "personas"
- Check Service Role Key permissions
- Ensure RLS policies allow authenticated access
- Test with Supabase Studio

---

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, features, or documentation, your help makes Neural Twin better.

### Getting Started

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/amazing-feature`
3. **Make your changes** - Follow the code style
4. **Type check** - `npm run type-check`
5. **Lint** - `npm run lint`
6. **Commit** - Use clear commit messages
7. **Push** - `git push origin feature/amazing-feature`
8. **Create a Pull Request**

### Development Setup

```bash
git clone https://github.com/yourusername/neural-twin-app.git
cd neural-twin-app
npm install
npm run dev
```

### Code Style

- Use TypeScript with strict mode
- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Write tests for new features

### Areas We Need Help

- 📝 Documentation improvements
- 🧪 Test coverage
- 🐛 Bug fixes and issue resolution
- ✨ New features and enhancements
- 🎨 UI/UX improvements

See our [Good First Issues](https://github.com/yourusername/neural-twin-app/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) for beginner-friendly tasks.

---

## 📋 Roadmap

Our vision for Neural Twin:

- [x] Core persona creation and processing
- [x] Chat with your persona
- [x] Magic link authentication
- [ ] Multi-language persona support
- [ ] Persona versioning and history
- [ ] Social sharing and persona discovery
- [ ] Advanced personality metrics
- [ ] Integration with external services
- [ ] Mobile app (React Native)
- [ ] Real-time collaborative personas

See our [Project Board](https://github.com/yourusername/neural-twin-app/projects/1) for current progress and upcoming features.

---

## 💬 Community & Support

Get help and connect with other users:

- 📖 **[Discussions](https://github.com/yourusername/neural-twin-app/discussions)** - Ask questions, share ideas, and get help
- 🐛 **[GitHub Issues](https://github.com/yourusername/neural-twin-app/issues)** - Report bugs and request features
- 💬 **[Discord](https://discord.gg/your-server)** - Chat with the community (coming soon)
- 🐦 **[Twitter](https://twitter.com/your-handle)** - Follow for updates and announcements
- 📧 **[Email](mailto:support@example.com)** - Direct support inquiries

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Neural Twin Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- **OpenAI** - For the powerful GPT API that powers persona extraction
- **Supabase** - For auth, storage, and database infrastructure
- **Netlify** - For serverless functions and hosting
- **Next.js** - For the amazing React framework
- **shadcn/ui** - For beautiful, accessible UI components
- **Tailwind CSS** - For utility-first styling

---

## 📊 Project Stats

- **Language:** TypeScript
- **Frontend:** Next.js 16, React 19
- **Backend:** Netlify Functions, Node.js 18+
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Total Files:** 54 TypeScript/JavaScript modules
- **Package Size:** ~250MB (with node_modules)

---

Made with ❤️ by the Neural Twin team

**Questions?** Open an [issue](https://github.com/yourusername/neural-twin-app/issues) or start a [discussion](https://github.com/yourusername/neural-twin-app/discussions)!

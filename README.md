# Architect AI

Architect AI is a collaborative, AI-powered system design tool that helps engineers design, visualize, and document distributed architectures in real-time. By chatting with an AI architect, you can automatically generate rich, tier-aware diagrams of your system and even get starter configuration code.

![Architect AI](https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=1000&auto=format&fit=crop) *(replace with actual screenshot)*

## ✨ Features

- **AI-Powered System Design**: Describe your system requirements in natural language, and the AI (Llama 3.3 70B via NVIDIA NIM) generates a complete architecture with appropriate tiers, tech stacks, and connections.
- **Rich Interactive Canvas**: Built with React Flow, the canvas features a smart tier-aware auto-layout (Client → Gateway → Service → Data → External) preventing messy diagrams.
- **Detailed Nodes & Edges**: Nodes display color-coded tiers, tech stacks, ports, scaling indicators (horizontal/vertical), and method-specific API routes. Edges feature data flow labels, protocol badges, and animated strokes for async connections.
- **Real-time Collaboration**: WebSocket integration allows multiple users to see cursor movements and node drags in real-time.
- **Background Code Generation**: As the AI designs your architecture, a secondary agent (Qwen 2.5 Coder 32B) runs in the background to generate Docker Compose or infrastructure configuration code.
- **Secure Workspaces**: Fully authenticated project environments using Better Auth. Only you can view or modify your architectures.
- **Public Share Links**: Generate secure, read-only links to share your architecture diagrams with team members or the public.

## 🏗️ Architecture & Tech Stack

Architect AI is a monorepo consisting of a Next.js frontend and a Bun/Hono backend.

### Frontend (`nvidia_frontend/`)
- **Framework**: Next.js 15 (App Router)
- **Canvas**: React Flow (`@xyflow/react`)
- **Styling**: Tailwind CSS + Base UI + Lucide React
- **State Management**: Zustand
- **Real-time**: Native WebSockets

### Backend (`nvidia_backend/`)
- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Authentication**: Better Auth
- **AI Integration**: NVIDIA NIMs (OpenAI SDK wrapper)

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed locally
- A PostgreSQL database (e.g., [Neon](https://neon.tech))
- An NVIDIA API Key for NIMs

### Environment Variables
You'll need to set up `.env` files in both the frontend and backend directories.

**Backend (`nvidia_backend/.env`)**
```env
DATABASE_URL=postgresql://user:password@hostname/db
NVIDIA_API_KEY=your_nvidia_nim_api_key
BETTER_AUTH_SECRET=generate_a_random_secret_string
BETTER_AUTH_URL=http://localhost:3000
```

**Frontend (`nvidia_frontend/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
```

### Installation

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   cd nvidia_backend && bun install
   cd ../nvidia_frontend && bun install
   ```
3. **Push the database schema**
   ```bash
   cd nvidia_backend
   bun run db:push
   ```
4. **Start the development servers**
   ```bash
   # Terminal 1: Backend
   cd nvidia_backend
   bun run dev

   # Terminal 2: Frontend
   cd nvidia_frontend
   bun run dev
   ```
5. Open `http://localhost:3001` in your browser.

## 🧠 AI Orchestration Pipeline

The core magic of Architect AI relies on a two-stage agentic pipeline:

1. **Stage 1 (Architect Agent)**: Uses `meta/llama-3.3-70b-instruct`. It receives the user's prompt and current canvas state, thinks through the system requirements, and streams a highly structured JSON graph containing nodes (with tiers, tech stacks, endpoints) and edges (with protocols and data flow).
2. **Stage 2 (Coder Agent)**: Runs asynchronously in the background using `qwen/qwen2.5-coder-32b-instruct`. It takes the completed JSON architecture and generates corresponding configuration files (like `docker-compose.yml`) for the user.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.

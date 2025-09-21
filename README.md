# Skincare Sanctuary

A modern, AI-powered skincare companion that provides personalized guidance through intelligent conversation and mindful rituals.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/tigermcdaniel-6224s-projects/v0-skin-care-app)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

## ✨ Features

- **AI-Powered Conversations**: Natural dialogue with an expert skincare advisor
- **Smart Routines**: AI-built morning & evening skincare rituals
- **Progress Tracking**: Visual transformation insights and photo analysis
- **Product Discovery**: Personalized product recommendations
- **Inventory Management**: Track your skincare collection
- **Calendar Integration**: Schedule and manage your skincare routine
- **Goal Setting**: Set and track skincare objectives

## 🏗️ Architecture

### Project Structure
```
skin-care-app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (RESTful structure)
│   │   ├── chat/          # Chat functionality
│   │   ├── inventory/     # Product management
│   │   ├── photos/        # Photo analysis
│   │   ├── routines/      # Routine management
│   │   └── upload/        # File uploads
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface
│   ├── features/          # Feature-specific components
│   ├── error.tsx          # Global error boundary
│   ├── loading.tsx        # Global loading state
│   └── not-found.tsx      # 404 page
├── components/            # Shared components
│   ├── ui/                # UI component library
│   └── global-navigation.tsx
├── lib/                   # Utilities and configurations
│   ├── uuid.ts           # UUID generation utility
│   ├── utils.ts          # Common utilities
│   └── constants.ts      # App constants
└── integrations/         # External service integrations
    ├── ai/               # AI providers
    ├── supabase/         # Database client
    └── vercel/           # Blob storage
```

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o, Groq Llama
- **Storage**: Vercel Blob
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skin-care-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Database Setup**
   Run the SQL scripts in the `scripts/` directory to set up your database schema.

5. **Start development server**
   ```bash
   pnpm dev
   ```

## 📱 Usage

### Core Features

1. **AI Chat Interface**
   - Natural conversation with skincare advisor
   - Photo analysis and skin condition assessment
   - Personalized product recommendations

2. **Routine Management**
   - Create custom morning/evening routines
   - Day-specific routine scheduling
   - Routine approval workflow

3. **Product Inventory**
   - Track your skincare collection
   - Monitor product usage and expiration
   - AI-powered product suggestions

4. **Progress Tracking**
   - Photo-based progress monitoring
   - Goal setting and tracking
   - Check-in system

## 🛠️ Development

### Code Organization
- **Feature-based structure**: Components organized by functionality
- **Shared utilities**: Common functions in `lib/` directory
- **Type safety**: Full TypeScript implementation
- **Error handling**: Global error boundaries and loading states

### API Structure
- **RESTful design**: Logical endpoint organization
- **Type safety**: Proper TypeScript interfaces
- **Error handling**: Consistent error responses
- **Authentication**: Supabase-based auth

### Key Improvements Made
- ✅ **API Structure**: Reorganized endpoints for better logical grouping
- ✅ **Component Organization**: Consolidated UI components
- ✅ **Utility Consolidation**: Shared utilities and eliminated duplication
- ✅ **Error Handling**: Added global error boundaries and loading states
- ✅ **Type Safety**: Fixed TypeScript errors and improved type definitions

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
pnpm build
pnpm start
```

## 📊 Database Schema

The app uses Supabase with the following main tables:
- `profiles` - User profiles and skin information
- `routines` - Skincare routines
- `routine_steps` - Individual routine steps
- `products` - Product catalog
- `user_inventory` - User's product collection
- `daily_checkins` - Progress tracking
- `goals` - User objectives
- `chat_history` - Conversation history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🔗 Links

- **Live App**: [Vercel Deployment](https://vercel.com/tigermcdaniel-6224s-projects/v0-skin-care-app)
- **Development**: Built with Next.js and TypeScript
- **Database**: Powered by Supabase
- **AI**: OpenAI GPT-4o and Groq integration

---

*Where skincare wisdom meets intelligent conversation* ✨
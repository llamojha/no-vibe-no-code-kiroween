<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://novibenocode.com/icons/icon-512x512.png" />

# No Vibe No Code

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/amllamojha/no-vibe-no-code-kiroween)

**AI-powered product management platform that transforms raw startup ideas into execution-ready documentation and GitHub backlogs.**

[Features](#core-features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing) • [Community](#community)

</div>

---

## 🎯 Why No Vibe No Code?

Building a startup is hard. You have a brilliant idea, but turning it into a structured plan with clear requirements, technical designs, and actionable tasks is time-consuming and requires expertise.

**No Vibe No Code** bridges the gap between ideation and execution:

- 🚀 **Validate Fast**: Get AI-powered analysis of your startup idea in minutes, not days
- 📝 **Document Automatically**: Generate professional PRDs, technical designs, and architecture docs
- 🎯 **Execute Confidently**: Transform analysis into GitHub issues and project boards (coming soon)
- 🏗️ **Built Right**: Hexagonal architecture ensures maintainability and extensibility
- 🧪 **Quality First**: Property-based testing guarantees system correctness

Perfect for indie hackers, product managers, hackathon teams, and innovation labs who want to move from idea to execution quickly.

## Core Features

- **Idea Analysis**: AI-powered startup idea evaluation with detailed scoring and feedback
- **Hackathon Analyzer**: Specialized evaluation for hackathon projects (Kiroween theme)
- **Doctor Frankenstein**: AI-powered mashup idea generator combining tech company or AWS service technologies
- **Idea Panel**: Dedicated workspace for managing ideas with status tracking, notes, tags, and multiple analyses
- **Document Generation**: AI-generated PRDs, Technical Designs, Architecture Documents, and Roadmaps
- **Multi-language Support**: Full English and Spanish localization
- **Credit System**: Usage-based credit system with tier-based limits

## Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Google Gemini API Key** ([Get one free](https://ai.google.dev/))
- **Supabase Account** ([Sign up free](https://supabase.com/)) - or use local storage mode (coming soon)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/amllamojha/no-vibe-no-code-kiroween.git
cd no-vibe-no-code
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

   a. **Create a new project** at [supabase.com](https://supabase.com) (free tier is fine)

   b. **Enable Email Authentication**:

   - Go to Authentication > Providers
   - Enable "Email" provider
   - (Optional) Configure email templates

   c. **Run the database schema**:

   - Go to SQL Editor in your Supabase dashboard
   - Click "New Query"
   - Copy the entire contents of `supabase_seed.sql` from this repo
   - Paste and click "Run"
   - You should see "Success. No rows returned"

   d. **Get your API credentials**:

   - Go to Project Settings > API
   - Copy your "Project URL" (looks like `https://xxxxx.supabase.co`)
   - Copy your "anon public" key (starts with `eyJ...`)

4. **Get a Google Gemini API Key**

   - Visit [Google AI Studio](https://ai.google.dev/)
   - Click "Get API Key"
   - Create a new API key (free tier available)
   - Copy the key

5. **Configure environment variables**

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```bash
# Required: Google Gemini AI
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Required: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=%YOUR_KEY_HERE%

# Optional: Analytics (leave blank to disable - app works fine without it)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Optional: Mock mode (for testing without API costs)
FF_USE_MOCK_API=false
```

6. **Run the development server**

```bash
npm run dev
```

7. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

8. **Create an account**

   - Click "Sign Up"
   - Use any email/password (Supabase will create the account)
   - You'll start with 3 free credits

### Troubleshooting

**"Failed to fetch" or connection errors:**

- Verify your Supabase URL and anon key are correct
- Check that you ran the `supabase_seed.sql` script
- Ensure email auth is enabled in Supabase

**"Invalid API key" errors:**

- Verify your Gemini API key is correct
- Check you have API quota remaining (free tier has limits)

**"Insufficient credits" errors:**

- Default users get 20 credits
- Each analysis costs 1 credit
- You can manually add credits in Supabase (profiles table)

**Database errors:**

- Make sure you ran the complete `supabase_seed.sql` file
- Check the Supabase logs in Dashboard > Logs

**Still having issues?**

- Check [GitHub Issues](https://github.com/amllamojha/no-vibe-no-code-kiroween/issues)
- Ask in [Discussions](https://github.com/amllamojha/no-vibe-no-code-kiroween/discussions)

### Alternative: Local Storage Mode (Coming Soon)

For a simpler setup without Supabase, enable local storage mode:

```bash
# .env.local
FF_LOCAL_STORAGE_MODE=true
LOCAL_AUTH_USERNAME=kiro
LOCAL_AUTH_PASSWORD=kiro
GEMINI_API_KEY=your_gemini_api_key_here
```

This mode stores all data in browser localStorage - perfect for testing and personal use.

## Architecture

The application follows **hexagonal architecture** (Ports and Adapters pattern):

- **Domain Layer** (`src/domain/`): Pure business logic with strongly-typed entities and value objects
- **Application Layer** (`src/application/`): Use cases and application services
- **Infrastructure Layer** (`src/infrastructure/`): External adapters (database, AI services, web)
- **Features** (`features/`): UI components and client-side logic

## Documentation

### Architecture & Development

- **[Architecture Overview](docs/ARCHITECTURE.md)**: Comprehensive architecture documentation
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Step-by-step guide for adding new features
- **[API Documentation](docs/API.md)**: Complete API reference
- **[Database Schema](docs/DATABASE_SCHEMA.md)**: Current database schema and query patterns
- **[Hexagonal Architecture Standards](.kiro/steering/hexagonal-architecture-standards.md)**: Architecture standards and guidelines

### Feature Documentation

- **[Document Generation Guide](docs/DOCUMENT_GENERATION_GUIDE.md)**: Complete guide for AI-generated documentation
- **[Idea Panel User Guide](docs/IDEA_PANEL_USER_GUIDE.md)**: User guide for the Idea Panel feature
- **[Mock System Documentation](docs/SISTEMA_MOCKS_DOCUMENTACION.md)**: Mock system for development without API costs

## Document Generation

Generate professional project documentation from your analyzed ideas:

| Document Type    | Credit Cost | Purpose                                  |
| ---------------- | ----------- | ---------------------------------------- |
| PRD              | 1           | Product requirements and user stories    |
| Technical Design | 1           | Architecture and implementation planning |
| Architecture     | 1           | System architecture and infrastructure   |
| Roadmap          | 1           | Milestones and feature prioritization    |

**Note**: Initial analysis is also 1 credit. Default free tier includes 20 credits.

**Recommended Workflow**: Analysis → PRD → Technical Design → Architecture → Roadmap

## Testing

```bash
# Unit tests
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Property tests
npm run test:properties     # Run property tests
npm run test:properties:coverage  # With coverage

# E2E tests
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Headed browser mode
```

### Mock Mode

Enable mock mode for development without consuming API credits:

```bash
# .env.local
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=true
```

## Feature Flags

Control features via environment variables:

| Flag                                      | Description                   | Default |
| ----------------------------------------- | ----------------------------- | ------- |
| `NEXT_PUBLIC_FF_ENABLE_CLASSIC_ANALYZER`  | Classic analyzer visibility   | `true`  |
| `NEXT_PUBLIC_FF_ENABLE_KIROWEEN_ANALYZER` | Hackathon analyzer visibility | `true`  |
| `FF_USE_MOCK_API`                         | Enable mock mode              | `false` |
| `ENABLE_DOCUMENT_GENERATION`              | Document generation feature   | `true`  |

## CI/CD Pipeline

Automated quality checks on every pull request:

- **ESLint**: Code quality and linting
- **Unit Tests**: Vitest with coverage reporting
- **E2E Tests**: Playwright browser automation
- **Lighthouse**: Accessibility audits (90% minimum score)
- **Property Tests**: Property-based testing validation

## Security

⚠️ **Critical**: Never cache Supabase server clients in static variables. Each HTTP request requires a fresh client to prevent session leaks.

```typescript
// ✅ Correct: Fresh client per request
const supabase = SupabaseAdapter.getServerClient();

// ❌ Wrong: Cached client causes session leaks
const cachedClient = createClient(); // Don't do this
```

## Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional - Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host
POSTHOG_API_KEY=your_posthog_server_key

# Optional - Mock Mode
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=true

# Optional - Tuning
AI_TIMEOUT=30000
AI_MAX_RETRIES=3
LOG_LEVEL=info
LOCAL_DEV_CREDITS=20
NEXT_PUBLIC_FF_CLASSIC_ANALYZER=true
NEXT_PUBLIC_FF_HACKATHON_ANALYZER=true
NEXT_PUBLIC_FF_AUDIO_FEATURES=false
```

## Project Structure

```
src/
├── domain/           # Business logic (entities, value objects, services)
├── application/      # Use cases and handlers
├── infrastructure/   # Database, AI, web adapters
└── shared/           # Common utilities

features/
├── analyzer/         # Startup idea analysis
├── kiroween-analyzer/# Hackathon analysis
├── doctor-frankenstein/ # Idea mashup generator
├── idea-panel/       # Idea management workspace
├── document-generator/ # AI document generation
├── dashboard/        # User dashboard
└── auth/             # Authentication

app/
├── api/v2/           # API endpoints
├── generate/         # Document generation pages
├── idea/             # Idea Panel pages
└── ...               # Other pages
```

## Contributing

We welcome contributions! Whether it's bug fixes, new features, documentation improvements, or feedback, your help makes this project better.

### How to Contribute

1. **Fork the repository** and create a new branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow our standards**

   - Adhere to [hexagonal architecture](.kiro/steering/hexagonal-architecture-standards.md)
   - Write tests for new functionality (unit + property tests)
   - Follow TypeScript strict mode
   - Use conventional commit messages

3. **Test your changes**

   ```bash
   npm run lint          # Check code quality
   npm test              # Run unit tests
   npm run test:properties  # Run property tests
   npm run test:e2e      # Run E2E tests
   ```

4. **Submit a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure all CI checks pass

### Development Guidelines

- **Architecture**: Follow hexagonal architecture - domain layer has no dependencies
- **Testing**: Write property-based tests for business rules and invariants
- **Code Style**: ESLint + Prettier (auto-formatted on save)
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Documentation**: Update docs when adding features

### Areas We Need Help

- 🐛 Bug fixes and issue triage
- 📝 Documentation improvements
- 🌍 Translations (currently EN/ES, need more languages)
- ✨ New features (check [open issues](https://github.com/amllamojha/no-vibe-no-code-kiroween/issues))
- 🧪 More property tests for system correctness
- 🎨 UI/UX improvements

### Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Roadmap

### Current Phase: MVP → Pre-Alpha

**Completed ✅**

- Core analysis engine (startup + hackathon)
- Document generation (PRD, Technical Design, Architecture, Roadmap)
- Idea Panel with status tracking and notes
- Multi-language support (EN/ES)
- Credit system with tier management
- Property-based testing framework
- Mock mode for development

**In Progress 🚧**

- Local storage mode (no Supabase required)
- Enhanced export capabilities
- E2E test coverage

**Coming Soon 🔜**

- GitHub integration (export to issues/projects)
- Collaborative editing
- Template system for custom documents
- API access for programmatic integration
- More AI model support (Claude, etc.)

See [open issues](https://github.com/amllamojha/no-vibe-no-code-kiroween/issues) for detailed roadmap and feature requests.

## Community

### Get Help & Connect

- 💬 **Discussions**: [GitHub Discussions](https://github.com/amllamojha/no-vibe-no-code-kiroween/discussions) - Ask questions, share ideas
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/amllamojha/no-vibe-no-code-kiroween/issues) - Report bugs or request features
- 📧 **Email**: support@novibenocode.com - Direct support
- 🐦 **Twitter**: [@novibenocode](https://twitter.com/novibenocode) - Updates and announcements

### Support the Project

- ⭐ **Star this repo** - Helps others discover the project
- 🐛 **Report bugs** - Help us improve quality
- 💡 **Suggest features** - Share your ideas
- 📝 **Improve docs** - Make it easier for others
- 🔀 **Submit PRs** - Contribute code

## Acknowledgments

Built with amazing open source tools:

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend and authentication
- [Google Gemini](https://ai.google.dev/) - AI analysis
- [Vitest](https://vitest.dev/) - Testing framework
- [Playwright](https://playwright.dev/) - E2E testing
- [Tailwind CSS](https://tailwindcss.com/) - Styling

Special thanks to all [contributors](https://github.com/amllamojha/no-vibe-no-code-kiroween/graphs/contributors) who help make this project better!

## License

This project is licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**.

See the [LICENSE](LICENSE) file for the full license text.

### What This Means

- ✅ You can use, modify, and distribute this software
- ✅ You must share your modifications under the same license
- ✅ If you run a modified version on a server, you must provide the source code to users
- ✅ You must include copyright and license notices

For more information, visit: https://www.gnu.org/licenses/agpl-3.0.html

---

<div align="center">

**Built with ❤️ by the No Vibe No Code community**

[Website](https://novibenocode.com) • [Documentation](docs/) • [Contributing](CONTRIBUTING.md)

_Last updated: December 3, 2025_

</div>

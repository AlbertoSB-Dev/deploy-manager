# 📝 Changelog - Deploy Manager

## [1.2.0] - 2026-02-08

### ✨ New Features

#### 🎛️ Project Management Controls
- **Added:** Edit project configuration without recreating
- **Added:** `EditProjectModal.tsx` component for editing projects
- **Added:** Start/Stop container buttons in project card
- **Added:** Visible port display in project card
- **Added:** Enhanced domain visibility with better styling
- **Impact:** Full control over projects without needing to delete and recreate
- **Files:** `ProjectCard.tsx`, `EditProjectModal.tsx`, `DeployService.ts`, `DockerService.ts`, `projects.ts`

#### ✏️ Edit Project
- **Editable Fields:** Display name, branch, port, domain, build command, start command, environment variables
- **Warning:** Requires new deploy to apply changes
- **UI:** Modal with form validation and helpful hints

#### ▶️ Container Controls
- **Start Container:** Resume stopped containers without redeploying
- **Stop Container:** Pause containers to save resources
- **Status Updates:** Automatic status change (active/inactive)
- **Visual Feedback:** Green "Start" button when inactive, Red "Stop" button when active

#### 🌐 Enhanced Domain Display
- **Prominent Display:** Domain shown in bold blue with globe icon
- **Port Visibility:** Port number displayed with plug icon (🔌)
- **Better UX:** Easier to identify which domain/port is being used

### 🔧 Technical Improvements

- **Backend:** Added `/projects/:id/container/start` endpoint
- **Backend:** Added `/projects/:id/container/stop` endpoint
- **Backend:** Added `startExistingContainer()` method in DockerService
- **Backend:** Added `startContainer()` and `stopContainer()` methods in DeployService
- **Frontend:** Improved card layout with two-row button arrangement
- **Frontend:** Added container action loading states

### 📚 Documentation

- **Added:** `PROJECT-MANAGEMENT.md` - Complete guide for project management features
- **Updated:** All relevant documentation with new features

---

## [1.1.0] - 2026-02-08

### ✨ New Features

#### 📡 Real-Time Deploy Logs
- **Added:** WebSocket-based real-time log streaming during deployments
- **Added:** `DeployLogs.tsx` component with auto-opening modal
- **Added:** Socket.IO integration for low-latency communication
- **Added:** Connection status indicator (green/red)
- **Added:** Auto-scroll to latest log entry
- **Added:** Timestamp for each log message
- **Impact:** Users can now see exactly what's happening during deploy
- **Files:** `DeployService.ts`, `index.ts`, `DeployLogs.tsx`, `ProjectCard.tsx`

#### 🌐 Automatic Domain Generation
- **Added:** Auto-generate test domains when not specified
- **Format:** `{project-name}.{BASE_DOMAIN}`
- **Added:** `domain` field to Project model
- **Added:** `BASE_DOMAIN` environment variable (default: `localhost`)
- **Added:** Domain display in project cards with Globe icon
- **Added:** "Teste" badge for `.localhost` domains
- **Added:** Clickable domain links to open in new tab
- **Added:** Dynamic placeholder in create forms
- **Impact:** No need to configure domains manually for development
- **Files:** `Project.ts`, `projects.ts`, `ProjectCard.tsx`, `CreateProjectModal.tsx`, `CreateProjectWithGitHub.tsx`

### 📚 Documentation

- **Added:** `REALTIME-DEPLOY-LOGS.md` - Complete guide for real-time logs
- **Added:** `docs/AUTO-DOMAINS.md` - Automatic domain generation guide
- **Added:** `IMPLEMENTATION-STATUS.md` - Implementation status and checklist
- **Added:** `QUICK-GUIDE.md` - Quick start guide for new features
- **Updated:** All documentation with new features

### 🔧 Technical Improvements

- **Backend:** Socket.IO event emitters in DeployService
- **Backend:** Room-based log streaming (`deploy-{projectId}`)
- **Backend:** Automatic domain generation logic
- **Frontend:** WebSocket connection management
- **Frontend:** Real-time UI updates
- **Frontend:** Improved UX with automatic modal opening

### 📦 Dependencies

- **Added:** `socket.io@^4.8.3` (backend)
- **Added:** `socket.io-client@^4.8.3` (frontend)

---

## [1.0.1] - 2026-02-08

### 🐛 Bug Fixes

#### Docker Naming Issue
- **Fixed:** Docker image names must be lowercase
- **Impact:** Projects with uppercase letters (e.g., "Guru-Ti") were failing
- **Solution:** Automatic conversion to lowercase in all Docker operations
- **Files:** `DockerService.ts`, `projects.ts`, `CreateProjectModal.tsx`, `CreateProjectWithGitHub.tsx`

#### Docker Build Improvements
- **Added:** Automatic `.dockerignore` generation
- **Added:** Better error handling and logging during builds
- **Added:** Build error capture and reporting
- **Improved:** Build stability and performance

### 📚 Documentation

- **Added:** `DOCKER-TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- **Added:** `DOCKER-NAMING-FIX.md` - Detailed explanation of naming fix
- **Updated:** `README.md` with new documentation links

### ✨ Improvements

- **Frontend:** Real-time validation of project names
- **Frontend:** Helper text showing naming rules
- **Backend:** Automatic name sanitization
- **Backend:** Better Docker build error messages

---

## [1.0.0] - 2026-02-08

### 🎉 Initial Release

#### Core Features

##### 🐳 Docker Integration
- Full Docker support for all deployments
- Automatic Dockerfile generation
- Container lifecycle management
- Image building and caching
- Multi-stage builds for optimization

##### 📊 Monitoring & Debugging
- **Real-time Logs:** View container logs with auto-refresh
- **Interactive Terminal:** Execute commands in containers
- **Build Logs:** Track deployment progress
- **Status Monitoring:** Container health and status

##### 🔄 Git Integration
- Clone repositories (public and private)
- Branch and tag management
- Deploy specific versions
- Rollback to previous deployments
- Automatic credential detection

##### 🔐 Authentication
- **GitHub OAuth:** Connect and select repositories easily
- **SSH Keys:** Automatic detection and configuration
- **Personal Access Tokens:** Support for GitHub, GitLab, Bitbucket
- **Basic Auth:** Username/password (legacy)

##### 🎨 User Interface
- Modern Next.js + Tailwind CSS interface
- Project cards with quick actions
- Version selector modal
- Log viewer with syntax highlighting
- Terminal emulator
- GitHub repository picker

##### 🛠️ Project Management
- Create projects from Git repositories
- Configure build and start commands
- Environment variables management
- Port configuration
- Project types: Frontend, Backend, Fullstack
- Delete projects (removes everything)

##### 📦 Deployment
- One-click deploy
- Automatic dependency installation
- Build process execution
- Container startup
- Deployment history
- Rollback functionality

#### Technical Stack

**Backend:**
- Node.js + Express
- MongoDB (Mongoose)
- Docker (dockerode)
- Simple-git
- Socket.IO (prepared for real-time)
- TypeScript

**Frontend:**
- Next.js 15
- React 18
- Tailwind CSS
- Axios
- React Hot Toast
- date-fns
- TypeScript

#### Architecture

```
deploy-manager/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   │   ├── DockerService.ts
│   │   │   ├── DeployService.ts
│   │   │   ├── GitService.ts
│   │   │   └── GitCredentialService.ts
│   │   └── index.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   └── package.json
└── docs/                    # Documentation

```

#### API Endpoints

**Projects:**
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (full cleanup)

**Deployment:**
- `POST /api/projects/:id/deploy` - Deploy project
- `POST /api/projects/:id/rollback` - Rollback deployment
- `GET /api/projects/:id/versions` - List available versions
- `GET /api/projects/:id/logs` - Get container logs
- `POST /api/projects/:id/exec` - Execute command in container

**GitHub:**
- `GET /api/github/auth` - Start OAuth flow
- `GET /api/github/callback` - OAuth callback
- `GET /api/github/repos` - List user repositories
- `GET /api/github/repos/:owner/:repo/branches` - List branches

**Credentials:**
- `POST /api/projects/detect-credentials` - Auto-detect Git credentials

#### Documentation

- 📖 [Quick Start Guide](./QUICK-START.md)
- 🚀 [Start Here](./START-HERE.md)
- 🐳 [Docker Integration](./docs/DOCKER-INTEGRATION.md)
- 🐛 [Docker Troubleshooting](./docs/DOCKER-TROUBLESHOOTING.md)
- 🔐 [Private Repositories](./docs/PRIVATE-REPOS.md)
- 🔑 [GitHub OAuth Setup](./docs/GITHUB-OAUTH-SETUP.md)
- 🤖 [Auto Credentials](./docs/AUTO-CREDENTIALS.md)
- 💡 [Examples](./EXAMPLES.md)
- 📋 [Install Methods](./INSTALL-METHODS.md)

#### Requirements

- Node.js 18+
- MongoDB
- Docker
- Git
- 4GB+ RAM (for Docker)
- 10GB+ disk space

#### Installation

**Quick Install (Windows):**
```powershell
iwr -useb https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/install.ps1 | iex
```

**Manual Install:**
```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
npm run install:all
npm run dev
```

**Docker Compose:**
```bash
docker-compose up -d
```

#### Configuration

**Backend (.env):**
```env
PORT=8001
MONGODB_URI=mongodb://localhost:27017/deploy-manager
PROJECTS_DIR=C:/deploy-manager-projects
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

#### Known Issues

- ✅ **Fixed:** Docker naming with uppercase letters
- ⚠️ **Note:** Windows requires Docker Desktop
- ⚠️ **Note:** Ports 8000/8001 must be available

#### Future Roadmap

- [ ] User authentication and multi-tenancy
- [ ] GitHub webhooks for auto-deploy
- [ ] Resource monitoring (CPU, RAM, Network)
- [ ] Email/Slack notifications
- [ ] Automatic backups
- [ ] SSL/HTTPS automation
- [ ] Docker Compose support
- [ ] Kubernetes integration
- [ ] CI/CD pipeline integration

---

## Version History

- **1.0.1** (2026-02-08) - Docker naming fix + improvements
- **1.0.0** (2026-02-08) - Initial release with full Docker integration

---

**Maintained by:** Alberto SB Dev
**License:** MIT
**Repository:** https://github.com/AlbertoSB-Dev/deploy-manager

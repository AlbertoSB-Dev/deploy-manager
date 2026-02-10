# Gerenciador de Arquivos SFTP - Planejamento

## Objetivo
Implementar um gerenciador de arquivos completo via SFTP/SSH, permitindo navegar, editar, upload, download e gerenciar arquivos do servidor diretamente pelo painel.

## Funcionalidades

### 1. Navegação de Arquivos
- ✅ Listar diretórios e arquivos
- ✅ Navegar entre pastas (breadcrumb)
- ✅ Visualizar permissões (rwx)
- ✅ Visualizar tamanho, data de modificação
- ✅ Ícones por tipo de arquivo
- ✅ Ordenação (nome, tamanho, data)
- ✅ Busca de arquivos
- ✅ Filtros (tipo, tamanho, data)

### 2. Operações com Arquivos
- ✅ **Upload** - Arrastar e soltar ou selecionar
- ✅ **Download** - Arquivo único ou múltiplos (zip)
- ✅ **Criar** - Novo arquivo ou pasta
- ✅ **Renomear** - Arquivo ou pasta
- ✅ **Mover** - Arrastar e soltar ou cortar/colar
- ✅ **Copiar** - Duplicar arquivo/pasta
- ✅ **Excluir** - Com confirmação
- ✅ **Comprimir** - Criar .tar.gz ou .zip
- ✅ **Extrair** - Descomprimir arquivos

### 3. Editor de Código Integrado
- ✅ Syntax highlighting (múltiplas linguagens)
- ✅ Numeração de linhas
- ✅ Auto-complete
- ✅ Buscar e substituir
- ✅ Múltiplas abas
- ✅ Salvar com Ctrl+S
- ✅ Desfazer/Refazer
- ✅ Temas (claro/escuro)

### 4. Visualizadores
- ✅ **Imagens** - Preview inline
- ✅ **PDFs** - Visualizador integrado
- ✅ **Vídeos** - Player integrado
- ✅ **Áudio** - Player integrado
- ✅ **Markdown** - Preview renderizado
- ✅ **Logs** - Visualização com tail -f

### 5. Permissões
- ✅ Alterar permissões (chmod)
- ✅ Alterar proprietário (chown)
- ✅ Visualizar permissões numéricas e simbólicas

### 6. Terminal Integrado
- ✅ Terminal SSH no mesmo contexto
- ✅ Executar comandos no diretório atual
- ✅ Abrir terminal na pasta selecionada

## Interface do Painel

### Layout Principal
```
┌─────────────────────────────────────────────────────────────────┐
│ Gerenciador de Arquivos - Servidor: 38.242.213.195             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📁 /opt/projects/sistema-teste                                 │
│ [Home] > [opt] > [projects] > [sistema-teste]                  │
│                                                                 │
│ ┌─────────────────┬─────────────────────────────────────────┐ │
│ │ Árvore          │ Conteúdo                                │ │
│ │                 │                                         │ │
│ │ 📁 /            │ [Upload] [Nova Pasta] [Novo Arquivo]   │ │
│ │ ├─ 📁 opt       │ [Download] [Excluir] [Comprimir]       │ │
│ │ │  ├─ 📁 proj.. │                                         │ │
│ │ │  │  ├─ 📁 sis │ ┌─────────────────────────────────────┐ │ │
│ │ │  │  │  ├─ 📁 s│ │ Nome          Tamanho    Modificado │ │ │
│ │ │  │  │  ├─ 📄 p│ ├─────────────────────────────────────┤ │ │
│ │ │  │  │  └─ 📄 D│ │ 📁 src        -          Há 2 horas │ │ │
│ │ │  └─ 📁 backup │ │ 📁 node_mod.. 250 MB     Há 1 dia   │ │ │
│ │ └─ 📁 home      │ │ 📄 package.j  2.5 KB     Há 3 horas │ │ │
│ │                 │ │ 📄 .env       1.2 KB     Há 5 horas │ │ │
│ │                 │ │ 📄 Dockerfil  850 B      Há 1 dia   │ │ │
│ │                 │ │ 📄 README.md  4.1 KB     Há 2 dias  │ │ │
│ │                 │ └─────────────────────────────────────┘ │ │
│ │                 │                                         │ │
│ │                 │ 6 itens | 254 MB total                 │ │
│ └─────────────────┴─────────────────────────────────────────┘ │
│                                                                 │
│ [Visualização: Lista ▼] [Ordenar: Nome ▼] [🔍 Buscar...]      │
└─────────────────────────────────────────────────────────────────┘
```

### Editor de Código
```
┌─────────────────────────────────────────────────────────────────┐
│ Editor - package.json                                    [X]    │
├─────────────────────────────────────────────────────────────────┤
│ [package.json] [.env] [Dockerfile] [+]                         │
├─────────────────────────────────────────────────────────────────┤
│  1  {                                                           │
│  2    "name": "sistema-teste",                                 │
│  3    "version": "1.0.0",                                      │
│  4    "description": "Sistema de teste",                       │
│  5    "main": "index.js",                                      │
│  6    "scripts": {                                             │
│  7      "start": "node index.js",                              │
│  8      "dev": "nodemon index.js"                              │
│  9    },                                                        │
│ 10    "dependencies": {                                        │
│ 11      "express": "^4.18.0"                                   │
│ 12    }                                                         │
│ 13  }                                                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Linha 7, Coluna 12 | UTF-8 | JSON | Espaços: 2                │
│ [Salvar] [Salvar Como] [Fechar] [Desfazer] [Refazer]          │
└─────────────────────────────────────────────────────────────────┘
```

### Menu de Contexto (Clique Direito)
```
┌─────────────────────┐
│ 📄 package.json     │
├─────────────────────┤
│ ✏️  Editar          │
│ 👁️  Visualizar      │
│ 📥 Download         │
│ ✂️  Recortar        │
│ 📋 Copiar           │
│ 📝 Renomear         │
│ 🗑️  Excluir         │
│ ─────────────────── │
│ 🔒 Permissões       │
│ ℹ️  Propriedades    │
└─────────────────────┘
```

### Modal de Upload
```
┌─────────────────────────────────────────────────────────────────┐
│ Upload de Arquivos                                       [X]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Destino: /opt/projects/sistema-teste/uploads                   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │                                                         │   │
│ │         📤 Arraste arquivos aqui                        │   │
│ │              ou clique para selecionar                  │   │
│ │                                                         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Arquivos selecionados:                                         │
│                                                                 │
│ ✓ imagem.jpg (2.5 MB) ████████████████████ 100%               │
│ ⏳ video.mp4 (45 MB)  ████████░░░░░░░░░░░░  45%               │
│ ⏸️ documento.pdf (1.2 MB) - Pausado                            │
│                                                                 │
│ Total: 48.7 MB | Enviado: 24.5 MB | Restante: 24.2 MB         │
│                                                                 │
│ [Pausar Todos] [Cancelar] [Fechar]                            │
└─────────────────────────────────────────────────────────────────┘
```

### Modal de Permissões
```
┌─────────────────────────────────────────────────────────────────┐
│ Permissões - package.json                                [X]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Proprietário: root                                             │
│ Grupo: root                                                    │
│                                                                 │
│ Permissões:                                                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │           Ler    Escrever    Executar                   │   │
│ │ Dono      ☑      ☑           ☐                          │   │
│ │ Grupo     ☑      ☐           ☐                          │   │
│ │ Outros    ☑      ☐           ☐                          │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Numérico: 644                                                  │
│ Simbólico: rw-r--r--                                           │
│                                                                 │
│ ☑ Aplicar recursivamente (para pastas)                         │
│                                                                 │
│ [Cancelar] [Aplicar]                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Implementação

### Backend

#### 1. Service: SFTPService
```typescript
class SFTPService {
  // Navegação
  async listDirectory(serverId: string, path: string)
  async getFileInfo(serverId: string, path: string)
  async searchFiles(serverId: string, path: string, query: string)
  
  // Operações de arquivo
  async readFile(serverId: string, path: string): Promise<Buffer>
  async writeFile(serverId: string, path: string, content: Buffer)
  async createDirectory(serverId: string, path: string)
  async deleteFile(serverId: string, path: string)
  async renameFile(serverId: string, oldPath: string, newPath: string)
  async moveFile(serverId: string, source: string, destination: string)
  async copyFile(serverId: string, source: string, destination: string)
  
  // Upload/Download
  async uploadFile(serverId: string, localPath: string, remotePath: string)
  async downloadFile(serverId: string, remotePath: string): Promise<Stream>
  async uploadMultiple(serverId: string, files: File[], remotePath: string)
  async downloadMultiple(serverId: string, paths: string[]): Promise<Stream>
  
  // Compressão
  async compressFiles(serverId: string, paths: string[], outputPath: string)
  async extractArchive(serverId: string, archivePath: string, destination: string)
  
  // Permissões
  async chmod(serverId: string, path: string, mode: string)
  async chown(serverId: string, path: string, owner: string, group: string)
  
  // Utilitários
  async getDirectorySize(serverId: string, path: string)
  async getDiskUsage(serverId: string)
  async tailFile(serverId: string, path: string, lines: number)
}
```

#### 2. Routes: /api/sftp
```typescript
// Navegação
GET    /api/sftp/:serverId/list?path=/opt/projects
GET    /api/sftp/:serverId/info?path=/opt/file.txt
GET    /api/sftp/:serverId/search?path=/opt&query=*.js

// Leitura/Escrita
GET    /api/sftp/:serverId/read?path=/opt/file.txt
POST   /api/sftp/:serverId/write
POST   /api/sftp/:serverId/mkdir
DELETE /api/sftp/:serverId/delete
PUT    /api/sftp/:serverId/rename
PUT    /api/sftp/:serverId/move
POST   /api/sftp/:serverId/copy

// Upload/Download
POST   /api/sftp/:serverId/upload
GET    /api/sftp/:serverId/download?path=/opt/file.txt
POST   /api/sftp/:serverId/download-multiple
POST   /api/sftp/:serverId/upload-multiple

// Compressão
POST   /api/sftp/:serverId/compress
POST   /api/sftp/:serverId/extract

// Permissões
PUT    /api/sftp/:serverId/chmod
PUT    /api/sftp/:serverId/chown

// Utilitários
GET    /api/sftp/:serverId/size?path=/opt/projects
GET    /api/sftp/:serverId/disk-usage
GET    /api/sftp/:serverId/tail?path=/var/log/app.log&lines=100
```

#### 3. WebSocket para Upload em Tempo Real
```typescript
// Eventos
socket.on('upload:start', (data) => {})
socket.on('upload:progress', (data) => {})
socket.on('upload:complete', (data) => {})
socket.on('upload:error', (data) => {})
socket.on('upload:pause', (data) => {})
socket.on('upload:resume', (data) => {})
socket.on('upload:cancel', (data) => {})
```

### Frontend

#### Componente: FileManager.tsx
```typescript
interface FileManagerProps {
  serverId: string;
  initialPath?: string;
}

export function FileManager({ serverId, initialPath = '/' }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  
  // Navegação
  // Seleção múltipla
  // Arrastar e soltar
  // Menu de contexto
  // Atalhos de teclado
}
```

#### Componente: CodeEditor.tsx
```typescript
interface CodeEditorProps {
  serverId: string;
  filePath: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

export function CodeEditor({ serverId, filePath, onSave, onClose }: CodeEditorProps) {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isDirty, setIsDirty] = useState(false);
  
  // Monaco Editor ou CodeMirror
  // Syntax highlighting
  // Auto-save
  // Múltiplas abas
}
```

#### Componente: FileUploader.tsx
```typescript
interface FileUploaderProps {
  serverId: string;
  targetPath: string;
  onComplete: () => void;
}

export function FileUploader({ serverId, targetPath, onComplete }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  
  // Drag and drop
  // Progress bar
  // Pause/Resume
  // Cancelar
}
```

#### Componente: FilePreview.tsx
```typescript
interface FilePreviewProps {
  serverId: string;
  filePath: string;
  fileType: string;
}

export function FilePreview({ serverId, filePath, fileType }: FilePreviewProps) {
  // Renderizar preview baseado no tipo
  // Imagens, PDFs, vídeos, áudio, markdown
}
```

#### Componente: PermissionsModal.tsx
```typescript
interface PermissionsModalProps {
  serverId: string;
  filePath: string;
  currentPermissions: string;
  onSave: (permissions: string) => void;
}

export function PermissionsModal({ serverId, filePath, currentPermissions, onSave }: PermissionsModalProps) {
  // Checkboxes para rwx
  // Conversão numérico <-> simbólico
  // Aplicar recursivamente
}
```

## Bibliotecas Necessárias

### Backend
```json
{
  "ssh2-sftp-client": "^10.0.3",
  "archiver": "^6.0.1",
  "unzipper": "^0.10.14",
  "mime-types": "^2.1.35",
  "file-type": "^18.5.0"
}
```

### Frontend
```json
{
  "@monaco-editor/react": "^4.6.0",
  "react-dropzone": "^14.2.3",
  "react-contexify": "^6.0.0",
  "react-split-pane": "^0.1.92",
  "file-icon-vectors": "^1.0.0"
}
```

## Segurança

### Considerações
1. ✅ Validar todos os caminhos (evitar path traversal)
2. ✅ Limitar tamanho de upload (configurável)
3. ✅ Validar tipos de arquivo permitidos
4. ✅ Rate limiting para operações
5. ✅ Logs de todas as operações
6. ✅ Permissões baseadas em usuário
7. ✅ Não permitir acesso a arquivos sensíveis do sistema
8. ✅ Sanitizar nomes de arquivo

### Restrições
```typescript
const RESTRICTED_PATHS = [
  '/etc/passwd',
  '/etc/shadow',
  '/root/.ssh',
  '/home/*/.ssh'
];

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_FILES_PER_UPLOAD = 100;
```

## Atalhos de Teclado

```
Ctrl + C     - Copiar
Ctrl + X     - Recortar
Ctrl + V     - Colar
Ctrl + A     - Selecionar tudo
Delete       - Excluir
F2           - Renomear
Ctrl + F     - Buscar
Ctrl + N     - Novo arquivo
Ctrl + Shift + N - Nova pasta
Ctrl + U     - Upload
Ctrl + D     - Download
Backspace    - Voltar
Enter        - Abrir/Editar
Esc          - Cancelar/Fechar
```

## Próximos Passos

1. ✅ Implementar SFTPService
2. ✅ Criar rotas da API
3. ✅ Implementar FileManager (navegação básica)
4. ✅ Adicionar upload/download
5. ✅ Integrar editor de código
6. ✅ Adicionar visualizadores
7. ✅ Implementar permissões
8. ✅ Adicionar compressão/extração
9. ✅ Testes e otimizações
10. ✅ Documentar uso

## Estimativa de Tempo
- Backend (SFTP Service): 8-10 horas
- Frontend (File Manager): 12-15 horas
- Editor de Código: 4-6 horas
- Upload/Download: 6-8 horas
- Visualizadores: 4-6 horas
- Permissões: 2-3 horas
- Testes: 4-6 horas
- **Total: 40-54 horas**

## Referências
- [ssh2-sftp-client](https://github.com/theophilusx/ssh2-sftp-client)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [React Dropzone](https://react-dropzone.js.org/)

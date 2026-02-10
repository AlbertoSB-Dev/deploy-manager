# Gerenciador de Arquivos SFTP - Implementação

## ✅ Backend Implementado

### 1. Dependências Adicionadas
```json
{
  "ssh2-sftp-client": "^10.0.3",
  "archiver": "^6.0.1",
  "mime-types": "^2.1.35",
  "multer": "^1.4.5-lts.1"
}
```

### 2. Service: SFTPService
**Arquivo**: `backend/src/services/SFTPService.ts`

Métodos implementados:
- ✅ `listDirectory()` - Listar arquivos e diretórios
- ✅ `getFileInfo()` - Informações de arquivo
- ✅ `readFile()` - Ler conteúdo
- ✅ `writeFile()` - Escrever conteúdo
- ✅ `createDirectory()` - Criar pasta
- ✅ `delete()` - Excluir arquivo/pasta
- ✅ `rename()` - Renomear
- ✅ `move()` - Mover
- ✅ `copy()` - Copiar
- ✅ `uploadFile()` - Upload
- ✅ `downloadFile()` - Download
- ✅ `compress()` - Comprimir arquivos
- ✅ `extract()` - Extrair arquivos
- ✅ `chmod()` - Alterar permissões
- ✅ `chown()` - Alterar proprietário
- ✅ `getDirectorySize()` - Tamanho de diretório
- ✅ `getDiskUsage()` - Uso de disco
- ✅ `searchFiles()` - Buscar arquivos
- ✅ `tailFile()` - Últimas linhas de arquivo
- ✅ `validatePath()` - Validação de segurança

### 3. Routes: /api/sftp
**Arquivo**: `backend/src/routes/sftp.ts`

Endpoints implementados:
```
GET    /api/sftp/:serverId/list?path=/opt/projects
GET    /api/sftp/:serverId/info?path=/opt/file.txt
GET    /api/sftp/:serverId/read?path=/opt/file.txt
POST   /api/sftp/:serverId/write
POST   /api/sftp/:serverId/mkdir
DELETE /api/sftp/:serverId/delete
PUT    /api/sftp/:serverId/rename
PUT    /api/sftp/:serverId/move
POST   /api/sftp/:serverId/copy
POST   /api/sftp/:serverId/upload
GET    /api/sftp/:serverId/download?path=/opt/file.txt
POST   /api/sftp/:serverId/compress
POST   /api/sftp/:serverId/extract
PUT    /api/sftp/:serverId/chmod
PUT    /api/sftp/:serverId/chown
GET    /api/sftp/:serverId/size?path=/opt/projects
GET    /api/sftp/:serverId/disk-usage
GET    /api/sftp/:serverId/search?path=/opt&query=*.js
GET    /api/sftp/:serverId/tail?path=/var/log/app.log&lines=100
```

### 4. Segurança Implementada
- ✅ Validação de propriedade do servidor (multi-tenancy)
- ✅ Validação de caminhos (previne path traversal)
- ✅ Restrição de arquivos sensíveis (/etc/passwd, /etc/shadow, etc)
- ✅ Limite de tamanho de upload (500 MB)
- ✅ Limite de arquivos por upload (100)
- ✅ Rate limiting aplicado
- ✅ Autenticação obrigatória

## 📋 Próximos Passos - Frontend

### 1. Instalar Dependências Frontend
```bash
cd frontend
npm install @monaco-editor/react react-dropzone react-contexify file-icon-vectors
```

### 2. Componentes a Criar

#### FileManager.tsx
Componente principal do gerenciador de arquivos.

**Localização**: `frontend/src/components/FileManager.tsx`

**Funcionalidades**:
- Navegação de diretórios
- Visualização lista/grid
- Seleção múltipla
- Menu de contexto (clique direito)
- Drag and drop
- Breadcrumb de navegação
- Árvore de diretórios lateral

#### CodeEditor.tsx
Editor de código integrado.

**Localização**: `frontend/src/components/CodeEditor.tsx`

**Funcionalidades**:
- Monaco Editor (VS Code)
- Syntax highlighting
- Múltiplas abas
- Auto-save
- Atalhos de teclado

#### FileUploader.tsx
Modal de upload com progress.

**Localização**: `frontend/src/components/FileUploader.tsx`

**Funcionalidades**:
- Drag and drop
- Progress bar por arquivo
- Upload múltiplo
- Pause/Resume/Cancel

#### PermissionsModal.tsx
Modal para alterar permissões.

**Localização**: `frontend/src/components/PermissionsModal.tsx`

**Funcionalidades**:
- Checkboxes rwx
- Conversão numérico ↔ simbólico
- Aplicar recursivamente

### 3. Página do Gerenciador

**Localização**: `frontend/src/app/files/[serverId]/page.tsx`

Rota: `/files/:serverId`

### 4. API Client

**Localização**: `frontend/src/services/sftpService.ts`

Criar funções para chamar todos os endpoints:
```typescript
export const sftpService = {
  listDirectory: (serverId, path) => {},
  readFile: (serverId, path) => {},
  writeFile: (serverId, path, content) => {},
  uploadFile: (serverId, file, remotePath) => {},
  downloadFile: (serverId, remotePath) => {},
  // ... etc
};
```

## 🎨 UI/UX Sugerido

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [← Voltar] Gerenciador de Arquivos - Servidor: VPS-01      │
├─────────────────────────────────────────────────────────────┤
│ 📁 /opt/projects/sistema-teste                             │
│ [Home] > [opt] > [projects] > [sistema-teste]              │
├──────────────┬──────────────────────────────────────────────┤
│ Árvore (20%) │ Conteúdo (80%)                              │
│              │                                             │
│ 📁 /         │ [Upload] [Nova Pasta] [Novo Arquivo]       │
│ ├─ 📁 opt    │ [Download] [Excluir] [Comprimir]           │
│ │  ├─ 📁 pr..│                                             │
│ │  │  └─ 📁 s│ ┌─────────────────────────────────────────┐│
│ │  └─ 📁 bac│ │ Nome          Tamanho    Modificado     ││
│ └─ 📁 home   │ ├─────────────────────────────────────────┤│
│              │ │ 📁 src        -          Há 2 horas     ││
│              │ │ 📁 node_mod.. 250 MB     Há 1 dia       ││
│              │ │ 📄 package.j  2.5 KB     Há 3 horas     ││
│              │ │ 📄 .env       1.2 KB     Há 5 horas     ││
│              │ └─────────────────────────────────────────┘│
└──────────────┴──────────────────────────────────────────────┘
```

### Ícones por Tipo de Arquivo
- 📁 Diretório
- 📄 Arquivo genérico
- 📝 Texto (.txt, .md)
- 🔧 Configuração (.json, .yaml, .env)
- 🎨 Imagem (.jpg, .png, .svg)
- 📦 Comprimido (.zip, .tar.gz)
- 🐳 Docker (Dockerfile, docker-compose.yml)
- 📜 Script (.sh, .js, .py)

## 🔧 Instalação

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend (quando implementar)
```bash
cd frontend
npm install
npm run dev
```

## 📝 Exemplo de Uso

### Listar Arquivos
```typescript
const files = await fetch(`/api/sftp/${serverId}/list?path=/opt/projects`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Upload de Arquivo
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('path', '/opt/projects/upload.txt');

await fetch(`/api/sftp/${serverId}/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Editar Arquivo
```typescript
// 1. Ler arquivo
const content = await fetch(`/api/sftp/${serverId}/read?path=/opt/file.txt`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Editar no Monaco Editor

// 3. Salvar
await fetch(`/api/sftp/${serverId}/write`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    path: '/opt/file.txt',
    content: newContent
  })
});
```

## 🚀 Recursos Avançados (Futuro)

- [ ] Diff de arquivos (comparar versões)
- [ ] Histórico de alterações
- [ ] Colaboração em tempo real
- [ ] Integração com Git
- [ ] Preview de mais tipos de arquivo
- [ ] Busca avançada (regex, conteúdo)
- [ ] Favoritos/Bookmarks
- [ ] Atalhos personalizáveis
- [ ] Temas customizáveis
- [ ] Sincronização local ↔ remoto

## 📚 Referências

- [ssh2-sftp-client](https://github.com/theophilusx/ssh2-sftp-client)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [React Dropzone](https://react-dropzone.js.org/)
- [React Contexify](https://fkhadra.github.io/react-contexify/)

## ✅ Status

- ✅ Backend completo
- ⏳ Frontend pendente
- ⏳ Testes pendentes
- ⏳ Documentação de uso pendente

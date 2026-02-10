# Sistema de Instalação de WordPress

## 🎯 Objetivo
Permitir instalação automática de WordPress com um clique, incluindo:
- Container WordPress + PHP-FPM
- Container MySQL
- Configuração automática do wp-config.php
- Integração com Traefik para domínio
- Volumes persistentes para dados
- Configuração de rede Docker

## 📋 Arquitetura

### Containers Necessários
1. **WordPress** (wordpress:latest)
   - PHP 8.x + Apache/Nginx
   - Porta interna: 80
   - Volume: wp-content persistente

2. **MySQL** (mysql:8.0)
   - Porta interna: 3306
   - Volume: dados do banco persistente
   - Variáveis: MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD

### Rede Docker
- Ambos containers na mesma rede
- Rede do Traefik para acesso externo

## 🔧 Implementação

### Backend

#### 1. Model: WordPress
```typescript
interface WordPress {
  _id: string;
  userId: string;
  serverId: string;
  name: string;
  domain: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  wpAdminUser: string;
  wpAdminPassword: string;
  wpAdminEmail: string;
  containerName: string;
  dbContainerName: string;
  status: 'installing' | 'running' | 'stopped' | 'error';
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. Service: WordPressService
Métodos:
- `install()` - Instalar WordPress completo
- `start()` - Iniciar containers
- `stop()` - Parar containers
- `restart()` - Reiniciar
- `delete()` - Remover instalação
- `getStatus()` - Status dos containers
- `getLogs()` - Logs dos containers
- `updateDomain()` - Atualizar domínio

#### 3. Routes: /api/wordpress
```
POST   /api/wordpress/install
GET    /api/wordpress
GET    /api/wordpress/:id
DELETE /api/wordpress/:id
POST   /api/wordpress/:id/start
POST   /api/wordpress/:id/stop
POST   /api/wordpress/:id/restart
GET    /api/wordpress/:id/logs
PUT    /api/wordpress/:id/domain
```

### Frontend

#### 1. Componente: WordPressInstaller
Modal para instalação:
- Nome do site
- Domínio (auto-gerado ou customizado)
- Credenciais admin WordPress
- Seleção de servidor

#### 2. Componente: WordPressList
Lista de instalações WordPress:
- Status (running/stopped)
- Domínio com link
- Ações: Start, Stop, Restart, Delete, Logs
- Acesso ao admin (/wp-admin)

#### 3. Aba no Dashboard
Nova aba "WordPress" no dashboard

## 📝 Fluxo de Instalação

### Passo 1: Usuário Preenche Formulário
- Nome do site: "Meu Blog"
- Domínio: meublog.38.242.213.195.sslip.io (auto-gerado)
- Admin user: admin
- Admin password: (gerado ou customizado)
- Admin email: user@example.com
- Servidor: VPS-01

### Passo 2: Backend Executa Instalação

```bash
# 1. Criar rede Docker
docker network create wp-meublog

# 2. Criar container MySQL
docker run -d \
  --name wp-meublog-db \
  --network wp-meublog \
  -e MYSQL_ROOT_PASSWORD=rootpass123 \
  -e MYSQL_DATABASE=wordpress \
  -e MYSQL_USER=wpuser \
  -e MYSQL_PASSWORD=wppass123 \
  -v wp-meublog-db:/var/lib/mysql \
  mysql:8.0

# 3. Aguardar MySQL iniciar (30s)

# 4. Criar container WordPress
docker run -d \
  --name wp-meublog \
  --network wp-meublog \
  -e WORDPRESS_DB_HOST=wp-meublog-db:3306 \
  -e WORDPRESS_DB_USER=wpuser \
  -e WORDPRESS_DB_PASSWORD=wppass123 \
  -e WORDPRESS_DB_NAME=wordpress \
  -v wp-meublog-data:/var/www/html \
  -l "traefik.enable=true" \
  -l "traefik.http.routers.wp-meublog.rule=Host(\`meublog.38.242.213.195.sslip.io\`)" \
  -l "traefik.http.routers.wp-meublog.entrypoints=web" \
  -l "traefik.http.services.wp-meublog.loadbalancer.server.port=80" \
  wordpress:latest

# 5. Conectar à rede do Traefik
docker network connect coolify wp-meublog

# 6. Aguardar WordPress iniciar (60s)

# 7. Configurar WordPress via WP-CLI (opcional)
docker exec wp-meublog wp core install \
  --url="http://meublog.38.242.213.195.sslip.io" \
  --title="Meu Blog" \
  --admin_user="admin" \
  --admin_password="admin123" \
  --admin_email="user@example.com"
```

### Passo 3: Retornar Informações
```json
{
  "success": true,
  "wordpress": {
    "id": "...",
    "name": "Meu Blog",
    "domain": "http://meublog.38.242.213.195.sslip.io",
    "adminUrl": "http://meublog.38.242.213.195.sslip.io/wp-admin",
    "adminUser": "admin",
    "status": "running"
  }
}
```

## 🎨 UI/UX

### Botão de Instalação
```
┌─────────────────────────────────────────┐
│ [+ Instalar WordPress]                  │
└─────────────────────────────────────────┘
```

### Modal de Instalação
```
┌─────────────────────────────────────────┐
│ Instalar WordPress                  [X] │
├─────────────────────────────────────────┤
│                                         │
│ Nome do Site:                           │
│ [Meu Blog                            ]  │
│                                         │
│ Servidor:                               │
│ [VPS-01 ▼                            ]  │
│                                         │
│ Domínio (gerado automaticamente):       │
│ [meublog.38.242.213.195.sslip.io    ]  │
│                                         │
│ Credenciais Admin WordPress:            │
│ Usuário: [admin                      ]  │
│ Senha:   [••••••••••] [Gerar]          │
│ Email:   [user@example.com           ]  │
│                                         │
│ ⚠️  A instalação pode levar 2-3 minutos │
│                                         │
│ [Cancelar]              [Instalar]      │
└─────────────────────────────────────────┘
```

### Lista de WordPress
```
┌─────────────────────────────────────────────────────────┐
│ Meu Blog                                    [● Running] │
│ http://meublog.38.242.213.195.sslip.io                 │
│ Servidor: VPS-01 | Criado: Há 2 horas                  │
│                                                         │
│ [Abrir Site] [Admin] [Start] [Stop] [Logs] [Excluir]  │
└─────────────────────────────────────────────────────────┘
```

## 🔒 Segurança

### Senhas
- Gerar senhas fortes automaticamente
- Armazenar hash no banco (bcrypt)
- Mostrar senha apenas uma vez após instalação

### Isolamento
- Cada WordPress em sua própria rede Docker
- Banco de dados não exposto externamente
- Apenas WordPress conectado ao Traefik

### Validações
- Verificar se nome já existe
- Validar formato de email
- Validar força da senha
- Verificar espaço em disco disponível

## 📊 Recursos Adicionais

### Plugins Pré-instalados (Opcional)
- Yoast SEO
- WooCommerce
- Contact Form 7
- Wordfence Security

### Temas (Opcional)
- Astra
- GeneratePress
- OceanWP

### Backups
- Integrar com sistema de backup planejado
- Backup automático de wp-content
- Backup automático do banco de dados

### SSL/HTTPS (Futuro)
- Integração com Let's Encrypt
- Certificados automáticos via Traefik

## 🧪 Testes

### Checklist
- [ ] Instalação completa funciona
- [ ] WordPress acessível via domínio
- [ ] Login no /wp-admin funciona
- [ ] Dados persistem após restart
- [ ] Múltiplas instalações não conflitam
- [ ] Exclusão remove tudo (containers + volumes)
- [ ] Logs são acessíveis
- [ ] Start/Stop funcionam
- [ ] Domínio pode ser atualizado

## 📚 Documentação

### Para o Usuário
- Como instalar WordPress
- Como acessar o admin
- Como fazer backup
- Como atualizar domínio
- Troubleshooting comum

### Para Desenvolvedores
- Arquitetura do sistema
- Como adicionar novos recursos
- Como debugar problemas

## 🚀 Roadmap

### Fase 1 (MVP)
- [x] Planejamento
- [ ] Backend: Model + Service + Routes
- [ ] Frontend: Installer + List
- [ ] Integração com Traefik
- [ ] Testes básicos

### Fase 2
- [ ] WP-CLI para configuração automática
- [ ] Plugins pré-instalados
- [ ] Temas pré-instalados
- [ ] Sistema de backup

### Fase 3
- [ ] SSL automático
- [ ] Staging environment
- [ ] Clonagem de sites
- [ ] Migração de sites existentes

## 💡 Notas Técnicas

### Volumes Docker
```
wp-{name}-db      -> /var/lib/mysql (MySQL data)
wp-{name}-data    -> /var/www/html (WordPress files)
```

### Variáveis de Ambiente WordPress
```
WORDPRESS_DB_HOST=wp-meublog-db:3306
WORDPRESS_DB_USER=wpuser
WORDPRESS_DB_PASSWORD=wppass123
WORDPRESS_DB_NAME=wordpress
WORDPRESS_TABLE_PREFIX=wp_
WORDPRESS_DEBUG=false
```

### Portas
- MySQL: 3306 (interna, não exposta)
- WordPress: 80 (interna, roteada pelo Traefik)

### Comandos Úteis
```bash
# Ver logs WordPress
docker logs wp-meublog

# Ver logs MySQL
docker logs wp-meublog-db

# Acessar shell WordPress
docker exec -it wp-meublog bash

# Acessar MySQL
docker exec -it wp-meublog-db mysql -u wpuser -p

# WP-CLI
docker exec wp-meublog wp --info
```

## ✅ Conclusão

Este sistema permitirá aos usuários instalar WordPress com um clique, sem precisar conhecer Docker, MySQL ou configurações complexas. Tudo será automatizado e gerenciado pela interface web.

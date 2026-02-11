# 🎨 Atualização: Logo PNG em Todas as Páginas

## O que foi feito

Substituímos todos os componentes SVG de logo (`ArkLogoImage`, `ArkIconImage`, `ArkLogoPNG`) pela imagem PNG direta do arquivo `/public/logo.png`.

### Páginas atualizadas:

1. **Home** (`src/app/page.tsx`)
   - Header: Logo no topo
   - Feature card: Logo na seção de features
   - Footer: Logo no rodapé

2. **Login** (`src/app/login/page.tsx`)
   - Logo no topo da página

3. **Register** (`src/app/register/page.tsx`)
   - Logo no topo da página

4. **Forgot Password** (`src/app/forgot-password/page.tsx`)
   - Logo no topo da página

5. **Reset Password** (`src/app/reset-password/[token]/page.tsx`)
   - Logo no topo da página

6. **Dashboard** (`src/app/dashboard/page.tsx`)
   - Header: Logo com nome "Ark Deploy"
   - Loading state: Logo durante carregamento
   - Empty state: Logo quando não há grupos

### Mudanças técnicas:

- Removido: `ArkLogoPNG.tsx` (componente não mais necessário)
- Adicionado: `import Image from 'next/image'` em todas as páginas
- Substituído: Componentes de logo por `<Image src="/logo.png" alt="Ark Deploy" width={X} height={X} />`

## Como atualizar no servidor

Execute no seu servidor VPS:

```bash
cd /opt/ark-deploy
bash update-frontend.sh
```

Ou manualmente:

```bash
cd /opt/ark-deploy
git pull origin main
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## Verificação

Após a atualização, acesse:
- Home: `http://painel.SEU_IP.sslip.io`
- Login: `http://painel.SEU_IP.sslip.io/login`
- Dashboard: `http://painel.SEU_IP.sslip.io/dashboard`

A logo PNG deve aparecer em todas as páginas sem erros de componente não definido.

## Benefícios

✅ Logo PNG em vez de SVG (mais leve)
✅ Sem componentes desnecessários
✅ Código mais simples e direto
✅ Sem erros de "ArkIconPNG is not defined"
✅ Melhor performance

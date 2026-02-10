# 🎨 Ark Deploy - Guia de Logo

## Componentes Disponíveis

### 1. ArkLogo (Clássico)
Logo com design de arca/container e seta de deploy.

```tsx
import { ArkLogo, ArkIcon } from '@/components/ArkLogo';

// Com texto
<ArkLogo size={40} showText={true} />

// Apenas ícone
<ArkIcon size={32} />

// Variantes
<ArkLogo variant="default" />   // Azul/Roxo
<ArkLogo variant="gradient" />  // Gradiente animado
<ArkLogo variant="white" />     // Branco (para fundos escuros)
```

### 2. ArkLogoModern (Moderno)
Logo moderno com efeitos de brilho e animações opcionais.

```tsx
import { ArkLogoModern, ArkIconModern } from '@/components/ArkLogoModern';

// Com texto e animação
<ArkLogoModern size={50} showText={true} animated={true} />

// Apenas ícone
<ArkIconModern size={40} />

// Sem animação
<ArkLogoModern animated={false} />
```

## Onde Usar

### Header/Navbar
```tsx
<div className="flex items-center">
  <ArkLogoModern size={40} showText={true} />
</div>
```

### Páginas de Login/Registro
```tsx
<Link href="/" className="flex items-center justify-center mb-8">
  <ArkLogoModern size={60} showText={true} />
</Link>
```

### Favicon (apenas ícone)
```tsx
<ArkIconModern size={32} />
```

### Loading/Splash Screen
```tsx
<div className="flex items-center justify-center h-screen">
  <ArkLogoModern size={80} showText={true} animated={true} />
</div>
```

## Tamanhos Recomendados

| Uso | Tamanho | Com Texto |
|-----|---------|-----------|
| Navbar | 40px | Sim |
| Sidebar | 32px | Não |
| Login/Register | 60px | Sim |
| Favicon | 32px | Não |
| Loading | 80px | Sim |
| Footer | 36px | Sim |

## Cores

### Paleta Principal
- **Azul:** `#3B82F6` (blue-500)
- **Índigo:** `#6366F1` (indigo-500)
- **Roxo:** `#8B5CF6` (purple-500)
- **Verde:** `#10B981` (green-500) - Acento

### Gradientes
```css
/* Gradiente Principal */
background: linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%);

/* Gradiente Secundário */
background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%);
```

## Conceito do Design

### Elementos Visuais

1. **Arca/Container** 
   - Representa proteção e segurança
   - Forma retangular arredondada
   - Simboliza containerização (Docker)

2. **Seta para Cima**
   - Representa deploy/upload
   - Movimento ascendente = progresso
   - Indica envio de código

3. **Partículas/Pontos**
   - Representam dados/código
   - Efeito de movimento
   - Tecnologia e dinamismo

4. **Shield (Escudo)**
   - Proteção adicional
   - Segurança dos deploys
   - Confiabilidade

## Exemplos de Uso

### Substituir Logo Atual

**Antes:**
```tsx
<div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
  <Rocket className="w-8 h-8 text-white" />
</div>
<span className="text-3xl font-bold">Ark Deploy</span>
```

**Depois:**
```tsx
<ArkLogoModern size={48} showText={true} />
```

### Header Responsivo
```tsx
<div className="flex items-center gap-3">
  {/* Mobile - apenas ícone */}
  <div className="md:hidden">
    <ArkIconModern size={32} />
  </div>
  
  {/* Desktop - com texto */}
  <div className="hidden md:block">
    <ArkLogoModern size={40} showText={true} />
  </div>
</div>
```

### Dark Mode
```tsx
<div className="bg-white dark:bg-gray-900">
  <ArkLogoModern size={40} showText={true} />
  {/* Automaticamente se adapta ao tema */}
</div>
```

## Animações

### Pulse (Pulsação)
```tsx
<ArkLogoModern animated={true} />
```

### Hover Effect
```tsx
<div className="transition-transform hover:scale-110">
  <ArkLogoModern size={40} />
</div>
```

### Rotate on Load
```tsx
<div className="animate-spin-slow">
  <ArkIconModern size={40} />
</div>
```

## Exportar para Outros Formatos

### SVG Standalone
Copie o código SVG de dentro do componente para criar um arquivo `.svg` independente.

### PNG (para favicon)
1. Abra o componente no navegador
2. Use uma ferramenta de screenshot
3. Ou exporte via Figma/Illustrator

### Favicon
```html
<!-- public/favicon.ico -->
<link rel="icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
```

## Acessibilidade

Sempre adicione `alt` text quando usar como imagem:

```tsx
<div role="img" aria-label="Ark Deploy Logo">
  <ArkLogoModern size={40} />
</div>
```

## Performance

- ✅ SVG inline = sem requisições HTTP
- ✅ Tamanho pequeno (~2KB)
- ✅ Escalável sem perda de qualidade
- ✅ Suporta dark mode nativamente
- ✅ Animações CSS (performático)

## Customização

### Mudar Cores
Edite as cores no componente:

```tsx
// Em ArkLogoModern.tsx
<linearGradient id="mainGradient">
  <stop offset="0%" stopColor="#SUA_COR_1" />
  <stop offset="100%" stopColor="#SUA_COR_2" />
</linearGradient>
```

### Adicionar Efeitos
```tsx
<div className="drop-shadow-2xl">
  <ArkLogoModern size={40} />
</div>
```

## Checklist de Implementação

- [ ] Substituir logo no header
- [ ] Atualizar páginas de login/registro
- [ ] Criar favicon
- [ ] Atualizar footer
- [ ] Adicionar loading screen
- [ ] Testar em dark mode
- [ ] Testar responsividade
- [ ] Otimizar animações
- [ ] Documentar uso no projeto

## Suporte

Para dúvidas ou customizações, consulte:
- Componentes: `frontend/src/components/ArkLogo*.tsx`
- Documentação: Este arquivo
- Exemplos: Veja as páginas já implementadas

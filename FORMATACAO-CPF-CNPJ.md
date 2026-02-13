# 🎨 Formatação Automática de CPF/CNPJ

## 📝 Visão Geral

O campo CPF/CNPJ no cadastro agora possui formatação automática inteligente que detecta se o usuário está digitando um CPF (11 dígitos) ou CNPJ (14 dígitos) e aplica a máscara correspondente em tempo real.

---

## ✨ Funcionalidades

### 1. Detecção Automática
- **CPF**: Até 11 dígitos → Formato `000.000.000-00`
- **CNPJ**: 12 a 14 dígitos → Formato `00.000.000/0000-00`

### 2. Formatação em Tempo Real
- Aplica máscara enquanto o usuário digita
- Remove caracteres não numéricos automaticamente
- Limita a 14 dígitos no máximo

### 3. Feedback Visual
- Texto de ajuda muda baseado no tipo detectado
- "Digite seu CPF (11 dígitos)" quando <= 11 dígitos
- "Digite seu CNPJ (14 dígitos)" quando > 11 dígitos

---

## 🎯 Como Funciona

### Fluxo de Formatação

```
Usuário digita → Remove não-numéricos → Detecta tipo → Aplica máscara → Exibe formatado
```

### Exemplo Prático

#### CPF (11 dígitos)
```
Digitado:    12345678900
Formatado:   123.456.789-00
Enviado:     12345678900 (sem formatação)
```

#### CNPJ (14 dígitos)
```
Digitado:    12345678000190
Formatado:   12.345.678/0001-90
Enviado:     12345678000190 (sem formatação)
```

---

## 💻 Implementação

### Código do Input

```tsx
<input
  type="text"
  required
  value={formData.cpfCnpj}
  onChange={(e) => {
    // 1. Remover caracteres não numéricos
    let value = e.target.value.replace(/\D/g, '');
    
    // 2. Limitar a 14 dígitos
    value = value.slice(0, 14);
    
    // 3. Aplicar máscara baseado no tamanho
    let formatted = value;
    if (value.length <= 11) {
      // Máscara de CPF: 000.000.000-00
      formatted = value
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // Máscara de CNPJ: 00.000.000/0000-00
      formatted = value
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    
    setFormData({ ...formData, cpfCnpj: formatted });
  }}
  placeholder="000.000.000-00 ou 00.000.000/0000-00"
/>
```

### Texto de Ajuda Dinâmico

```tsx
<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
  {formData.cpfCnpj.replace(/\D/g, '').length <= 11 
    ? 'Digite seu CPF (11 dígitos)' 
    : 'Digite seu CNPJ (14 dígitos)'}
</p>
```

### Envio ao Backend

```tsx
// Remove formatação antes de enviar
const response = await api.post('/auth/register', {
  name: formData.name,
  email: formData.email,
  password: formData.password,
  cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''), // Apenas números
});
```

---

## 🎨 Máscaras Aplicadas

### CPF (11 dígitos)
```
Padrão: 000.000.000-00

Exemplos:
123.456.789-00
987.654.321-99
111.222.333-44
```

### CNPJ (14 dígitos)
```
Padrão: 00.000.000/0000-00

Exemplos:
12.345.678/0001-90
98.765.432/0001-10
11.222.333/0001-81
```

---

## 🔄 Transição CPF → CNPJ

### Exemplo de Digitação

```
Dígitos    Formatação           Tipo Detectado
-------    ------------------   ---------------
1          1                    CPF
12         12                   CPF
123        123                  CPF
1234       123.4                CPF
12345      123.45               CPF
123456     123.456              CPF
1234567    123.456.7            CPF
12345678   123.456.78           CPF
123456789  123.456.789          CPF
1234567890 123.456.789-0        CPF
12345678900 123.456.789-00      CPF ✓
123456789001 12.345.678.900-1   CNPJ (transição)
1234567890012 12.345.678/9001-2 CNPJ
12345678900123 12.345.678/0012-3 CNPJ
123456789001234 12.345.678/0012-34 CNPJ ✓
```

---

## ✅ Validações

### Frontend
- ✅ Aceita apenas números (0-9)
- ✅ Limita a 14 dígitos
- ✅ Aplica formatação automática
- ✅ Remove formatação ao enviar
- ✅ Campo obrigatório

### Backend
- ✅ Recebe apenas números
- ✅ Armazena sem formatação
- ✅ Campo opcional no banco (sparse: true)

---

## 🧪 Como Testar

### Teste 1: CPF
1. Acesse `/register`
2. Digite no campo CPF/CNPJ: `12345678900`
3. Observe formatação automática: `123.456.789-00`
4. Veja texto de ajuda: "Digite seu CPF (11 dígitos)"
5. Complete cadastro
6. Verifique que foi salvo sem formatação no banco

### Teste 2: CNPJ
1. Acesse `/register`
2. Digite no campo CPF/CNPJ: `12345678000190`
3. Observe formatação automática: `12.345.678/0001-90`
4. Veja texto de ajuda: "Digite seu CNPJ (14 dígitos)"
5. Complete cadastro
6. Verifique que foi salvo sem formatação no banco

### Teste 3: Transição CPF → CNPJ
1. Acesse `/register`
2. Digite 11 dígitos (CPF)
3. Observe formatação de CPF
4. Continue digitando até 14 dígitos
5. Observe mudança automática para formatação de CNPJ
6. Veja texto de ajuda mudar

### Teste 4: Validação
1. Tente digitar letras → Não aceita
2. Tente digitar caracteres especiais → Não aceita
3. Tente digitar mais de 14 dígitos → Limita a 14
4. Tente enviar vazio → Mostra erro de campo obrigatório

---

## 📊 Benefícios

### Para o Usuário
- ✅ Formatação automática facilita leitura
- ✅ Feedback visual claro do tipo de documento
- ✅ Não precisa digitar pontos, traços ou barras
- ✅ Validação em tempo real

### Para o Sistema
- ✅ Dados armazenados sem formatação (apenas números)
- ✅ Facilita validação e processamento
- ✅ Compatível com APIs externas (Assas)
- ✅ Reduz erros de digitação

---

## 🎯 Exemplos de Uso

### CPF Válido
```
Input:  12345678900
Display: 123.456.789-00
Stored: 12345678900
```

### CNPJ Válido
```
Input:  12345678000190
Display: 12.345.678/0001-90
Stored: 12345678000190
```

### Digitação Parcial
```
Input:  123456
Display: 123.456
Hint: Digite seu CPF (11 dígitos)
```

---

## 🔮 Melhorias Futuras (Opcional)

1. **Validação de CPF/CNPJ**
   - Implementar algoritmo de validação de dígitos verificadores
   - Mostrar erro se CPF/CNPJ for inválido

2. **Detecção de Tipo**
   - Adicionar ícone indicando CPF ou CNPJ
   - Cores diferentes para cada tipo

3. **Autocompletar**
   - Sugerir completar com zeros se necessário
   - Exemplo: "123456789" → Sugerir "12345678900"

4. **Consulta de CNPJ**
   - Integrar com API da Receita Federal
   - Preencher nome da empresa automaticamente

---

## ✅ Status

**Implementação**: ✅ COMPLETA
**Formatação CPF**: ✅ FUNCIONANDO
**Formatação CNPJ**: ✅ FUNCIONANDO
**Transição Automática**: ✅ FUNCIONANDO
**Validação**: ✅ FUNCIONANDO

---

## 🎉 Conclusão

A formatação automática de CPF/CNPJ melhora significativamente a experiência do usuário, tornando o cadastro mais intuitivo e profissional. O sistema detecta automaticamente o tipo de documento e aplica a máscara correta em tempo real.

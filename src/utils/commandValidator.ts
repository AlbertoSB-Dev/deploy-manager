/**
 * Validador de Comandos SSH
 * Protege contra Command Injection
 * 
 * MODO: BLACKLIST (bloqueia apenas comandos perigosos)
 * Permite a maioria dos comandos, bloqueando apenas os realmente destrutivos
 */

// Comandos EXTREMAMENTE perigosos (blacklist)
const DANGEROUS_COMMANDS = [
  'rm -rf /',       // Deletar sistema
  'rm -rf /*',      // Deletar sistema
  'rm -rf /.',      // Deletar sistema
  'dd if=/dev/zero', // Sobrescrever disco
  'mkfs',           // Formatar disco
  'fdisk',          // Particionar disco
  'parted',         // Particionar disco
  ':(){:|:&};:',    // Fork bomb
  'shutdown',       // Desligar servidor
  'reboot',         // Reiniciar servidor
  'halt',           // Parar servidor
  'poweroff',       // Desligar servidor
  'init 0',         // Desligar
  'init 6',         // Reiniciar
];

// Padrões extremamente perigosos
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\/[^a-zA-Z]/,  // rm -rf / (com variações)
  /dd\s+if=\/dev\/zero/,      // dd sobrescrevendo
  /mkfs\./,                   // Formatar disco
  /:\(\)\{:\|:&\};:/,         // Fork bomb
  />\s*\/dev\/sd[a-z]/,       // Escrever direto no disco
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Valida e sanitiza comando SSH
 * MODO PERMISSIVO: Bloqueia apenas comandos extremamente perigosos
 */
export function validateCommand(command: string): ValidationResult {
  if (!command || typeof command !== 'string') {
    return {
      valid: false,
      error: 'Comando inválido'
    };
  }

  // Remover espaços extras
  const trimmed = command.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Comando vazio'
    };
  }

  // Limitar tamanho do comando (proteção contra buffer overflow)
  if (trimmed.length > 2000) {
    return {
      valid: false,
      error: 'Comando muito longo (máximo 2000 caracteres)'
    };
  }

  // Verificar comandos extremamente perigosos (blacklist exata)
  const lowerCommand = trimmed.toLowerCase();
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (lowerCommand.includes(dangerous.toLowerCase())) {
      return {
        valid: false,
        error: `⚠️ Comando bloqueado por segurança: operação destrutiva detectada`
      };
    }
  }

  // Verificar padrões extremamente perigosos
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: `⚠️ Comando bloqueado por segurança: padrão destrutivo detectado`
      };
    }
  }

  // ✅ Comando aprovado
  return {
    valid: true,
    sanitized: trimmed
  };
}

/**
 * Verifica se comando é destrutivo (para avisos ao usuário)
 */
export function isDestructiveCommand(command: string): boolean {
  const destructivePatterns = [
    /^rm\s/,
    /^rmdir\s/,
    /^mv\s/,
    /^chmod\s/,
    /^chown\s/,
    /^kill/,
    /^systemctl\s+(stop|restart)/,
  ];

  return destructivePatterns.some(pattern => pattern.test(command.trim()));
}

/**
 * Escapa caracteres especiais para uso seguro em shell
 */
export function escapeShellArg(arg: string): string {
  return arg.replace(/(["\s'$`\\])/g, '\\$1');
}

/**
 * Lista de comandos bloqueados (para exibir ao usuário)
 */
export function getBlockedCommands(): string[] {
  return [...DANGEROUS_COMMANDS];
}

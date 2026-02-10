# Troubleshooting - SFTP "All authentication methods failed"

## Problema
Erro ao conectar via SFTP: "All configured authentication methods failed"

## Causa
O servidor pode não ter o subsistema SFTP habilitado ou está usando configurações SSH diferentes.

## Solução 1: Verificar se SFTP está habilitado

No servidor, verifique o arquivo `/etc/ssh/sshd_config`:

```bash
grep -i sftp /etc/ssh/sshd_config
```

Deve ter uma linha como:
```
Subsystem sftp /usr/lib/openssh/sftp-server
```

Se não tiver, adicione e reinicie o SSH:
```bash
echo "Subsystem sftp /usr/lib/openssh/sftp-server" >> /etc/ssh/sshd_config
systemctl restart sshd
```

## Solução 2: Usar comandos SSH em vez de SFTP

Se o SFTP não estiver disponível, o sistema pode usar comandos SSH diretos para gerenciar arquivos. Isso já funciona porque o deploy usa SSH.

## Teste Manual

Teste a conexão SFTP manualmente:
```bash
sftp root@38.242.213.195
```

Se pedir senha e conectar, o SFTP está funcionando.
Se der erro "Connection closed", o SFTP não está habilitado.

## Alternativa Implementada

O sistema agora tenta conectar com múltiplos algoritmos de criptografia para compatibilidade com servidores mais antigos.

Se ainda assim não funcionar, o sistema pode usar comandos SSH diretos como fallback.

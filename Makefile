.PHONY: install start stop restart logs clean docker-up docker-down

# Instalação
install:
	@chmod +x scripts/install.sh
	@./scripts/install.sh

# Iniciar (manual)
start:
	@./start.sh

# Parar (manual)
stop:
	@./stop.sh

# Reiniciar (manual)
restart: stop start

# Ver logs
logs:
	@tail -f logs/*.log

# Limpar
clean:
	@rm -rf node_modules backend/node_modules frontend/node_modules
	@rm -rf backend/dist frontend/.next
	@rm -f *.pid logs/*.log

# Docker - Iniciar
docker-up:
	@docker-compose up -d

# Docker - Parar
docker-down:
	@docker-compose down

# Docker - Logs
docker-logs:
	@docker-compose logs -f

# Docker - Rebuild
docker-rebuild:
	@docker-compose up -d --build

# Ajuda
help:
	@echo "Deploy Manager - Comandos Disponíveis"
	@echo "======================================"
	@echo ""
	@echo "Instalação:"
	@echo "  make install        - Instalar Deploy Manager"
	@echo ""
	@echo "Manual (sem Docker):"
	@echo "  make start          - Iniciar serviços"
	@echo "  make stop           - Parar serviços"
	@echo "  make restart        - Reiniciar serviços"
	@echo "  make logs           - Ver logs"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - Iniciar com Docker"
	@echo "  make docker-down    - Parar Docker"
	@echo "  make docker-logs    - Ver logs do Docker"
	@echo "  make docker-rebuild - Rebuild containers"
	@echo ""
	@echo "Manutenção:"
	@echo "  make clean          - Limpar arquivos temporários"
	@echo ""

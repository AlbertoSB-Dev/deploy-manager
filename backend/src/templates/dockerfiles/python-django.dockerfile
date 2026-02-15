FROM python:3.11-slim
WORKDIR /app

# Instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Coletar arquivos estáticos
RUN python manage.py collectstatic --noinput

ENV DJANGO_SETTINGS_MODULE=settings
ENV PORT=8000

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "wsgi:application"]

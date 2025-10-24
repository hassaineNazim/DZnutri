# 1. On part d'une image Python 3.11 (stable)
FROM python:3.11-slim

# 2. On définit le dossier de travail à l'intérieur du conteneur
WORKDIR /app

# 3. On copie le fichier des dépendances
COPY ./requirements.txt .

# 4. On installe les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# 5. On copie tout le reste de notre code backend dans le conteneur
COPY . .

# 6. On expose le port 8000 pour que le monde extérieur puisse parler à FastAPI
EXPOSE 8000

# 7. La commande pour lancer l'application (en mode production)
# Remplacera "uvicorn main:app --reload --host 0.0.0.0"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
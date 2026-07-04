# BRN SMART — Plateforme de Gestion de Formations

Plateforme complète de gestion de formations professionnelles avec intelligence artificielle, chatbot RAG et système de profilage automatique.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NGINX (Port 80)                         │
│                    API Gateway + CORS                        │
└────────┬──────────┬──────────┬──────────┬───────────────────┘
         │          │          │          │
    ┌────▼────┐ ┌───▼────┐ ┌──▼─────┐ ┌──▼──────┐
    │Service 1│ │Service2│ │Service3│ │Service 5│
    │ Laravel │ │Laravel │ │ Flask  │ │ FastAPI │
    │  Auth   │ │Métier  │ │  IA    │ │Chatbot  │
    │ :8000   │ │ :8001  │ │ :5001  │ │  :8007  │
    └────┬────┘ └───┬────┘ └────────┘ └──┬──────┘
         │          │                    │
    ┌────▼──────────▼────────────────────▼──────┐
    │           PostgreSQL 15 (:5433)            │
    └────────────────────────────────────────────┘
                                    │
                              ┌─────▼─────┐
                              │ ChromaDB  │
                              │ (Volume)  │
                              └───────────┘
```

| Service | Rôle | Technologie | Port |
|---------|------|-------------|------|
| service-1 | Authentification & Profils | Laravel 11 + JWT | 8000 |
| service-2 | Formations, Inscriptions, Badges | Laravel 11 | 8001 |
| service-3-ia | Profilage automatique | Flask + Random Forest | 5001 |
| service-4-embedding | Vectorisation sémantique | Flask + SBERT | 5002 |
| service-5-chatbot | Chatbot RAG streaming | FastAPI + GPT-4o | 8007 |
| nginx | API Gateway | Nginx | 80 |
| db | Base de données | PostgreSQL 15 | 5433 |

---

## Fonctionnalités

### Pour les Stagiaires
- Inscription et gestion de profil avec photo
- Consultation du catalogue de formations
- Inscription à une formation (formulaire multi-étapes + CV)
- Suivi de ses formations et statuts d'inscription
- Chatbot IA pour recommandations personnalisées
- Planning de formation
- Tableau de bord personnel avec scores

### Pour les Formateurs
- Tableau de bord avec analytics détaillées (inscriptions, taux de complétion, revenus)
- Gestion de ses formations (CRUD)
- Validation/refus des candidatures
- Export CSV des données
- Gestion des ressources pédagogiques
- Notifications en temps réel

### Pour les Administrateurs
- Gestion complète des utilisateurs (stagiaires, formateurs)
- Validation des comptes formateurs
- Vue globale de toutes les inscriptions
- Gestion des badges et certifications
- Analytics IA avec génération de graphiques en langage naturel (GPT-4o)
- Finances et revenus

### Intelligence Artificielle
- **Profilage automatique** : algorithme Random Forest qui classe les candidats en 3 groupes (bas / intermédiaire / haut)
- **Chatbot RAG** : recommandations de formations en streaming SSE via ChromaDB + GPT-4o
- **Analytics IA** : génération de requêtes SQL et graphiques depuis des questions en langage naturel

---

## Stack Technique

**Frontend**

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/i18n-FR%2FEN-0088CC?style=for-the-badge&logo=google-translate&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-Graphiques-22B5BF?style=for-the-badge)

**Backend**

![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)

**IA / ML**

![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6.1-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6B35?style=for-the-badge&logo=databricks&logoColor=white)
![Hugging Face](https://img.shields.io/badge/SBERT-Embeddings-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)

**Infrastructure**

![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Gateway-009639?style=for-the-badge&logo=nginx&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

---

## Installation

### Prérequis
- Docker Desktop
- Git

### 1. Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/brn-smart.git
cd brn-smart
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env` à la racine :

```env
POSTGRES_DB=ma_formation
POSTGRES_USER=postgres
POSTGRES_PASSWORD=votre_mot_de_passe_securise

GITHUB_TOKEN=votre_github_token_ici
ALLOWED_ORIGINS=http://localhost:3000
```

Créer `backend/service-1/.env` :

```env
APP_NAME=BRN_SMART
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:VOTRE_CLE_ICI

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=ma_formation
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe_securise

JWT_SECRET=votre_jwt_secret_ici
```

Créer `backend/service-2/.env` avec la même structure que service-1.

### 3. Lancer les services

```bash
docker compose up -d
```

### 4. Exécuter les migrations

```bash
docker compose exec service-1 php artisan migrate --force
docker compose exec service-2 php artisan migrate --force
```

### 5. Créer le lien storage

```bash
docker compose exec service-1 php artisan storage:link
docker compose exec service-2 php artisan storage:link
```

### 6. Accéder à l'application

| URL | Description |
|-----|-------------|
| http://localhost | Application frontend |
| http://localhost/api/auth | API Authentification |
| http://localhost/api | API Métier |
| http://localhost:8007/docs | Documentation Chatbot |

---

## Structure du projet

```
brn-smart/
├── backend/
│   ├── service-1/           # Laravel Auth
│   ├── service-2/           # Laravel Métier
│   ├── service-3-ia/        # Flask Profilage IA
│   ├── service-4-embedding/ # Flask SBERT
│   └── service-5-chatbot/   # FastAPI Chatbot RAG
├── frontend/                # React 19
├── nginx/
│   └── default.conf         # Configuration gateway
├── docker-compose.yml
└── README.md
```

---

## API — Endpoints principaux

### Authentification (service-1)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Créer un compte |
| POST | /api/auth/login | Connexion |
| POST | /api/auth/logout | Déconnexion |
| GET | /api/auth/me | Profil connecté |
| PUT | /api/auth/profile | Modifier profil |

### Formations (service-2)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | /api/formations | Liste des formations | Public |
| GET | /api/formations/{id} | Détail formation | Public |
| POST | /api/formations | Créer formation | Formateur |
| PUT | /api/formations/{id} | Modifier formation | Formateur |
| DELETE | /api/formations/{id} | Supprimer formation | Admin |
| POST | /api/inscriptions/candidat | S'inscrire | Stagiaire |

### Chatbot (service-5)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/chatbot/chat | Chat simple |
| POST | /api/chatbot/chat/stream | Chat streaming SSE |
| DELETE | /api/chatbot/chat/history/{id} | Effacer historique |

---

## Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Token GitHub Models pour GPT-4o |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_SECRET` | Clé secrète JWT (service-1 et service-2) |
| `APP_KEY` | Clé de chiffrement Laravel |
| `ALLOWED_ORIGINS` | Origines CORS autorisées |

---

## Sécurité

- JWT avec validation de l'expiration (lcobucci/clock)
- Rôles strictement contrôlés (stagiaire / formateur / admin)
- Rate limiting Nginx sur les routes d'authentification (10 req/min)
- CORS dynamique via variable d'environnement
- Aucun secret commité dans le code source
- Validation des données sur tous les endpoints critiques

---

## Commandes utiles

```bash
# Démarrer tous les services
docker compose up -d

# Rebuild après modification du code
docker compose build && docker compose up -d

# Voir les logs d'un service
docker compose logs -f service-2

# Exécuter les migrations
docker compose exec service-2 php artisan migrate

# Arrêter tous les services
docker compose down
```

---

## Licence

Projet développé par **BRN SMART** — tous droits réservés.

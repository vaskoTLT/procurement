# Procurement System - Deployment Guide

## Overview
Smart Shopping List приложение - система управления списками покупок с React фронтенд, Express.js API и PostgreSQL базой данных, развернутой в Docker.

## System Requirements
- Docker & Docker Compose (v2.0+)
- Linux server (Ubuntu 20.04+ recommended)
- Minimum 2GB RAM
- Port 80 accessible for HTTP

## Deployment on New Server

### Step 1: Clone Project
```bash
cd /opt/docker/compose
git clone <repo-url> procurement
cd procurement
```

### Step 2: Configure Environment
Edit `.env` file for your environment:
```bash
# Database Configuration
DB_PASSWORD=your_secure_password_here
POSTGRES_DB=shoper_db
POSTGRES_USER=shoper_user
POSTGRES_PORT=5432

# Backend Configuration
NODE_ENV=production
PORT=3002
POSTGRES_HOST=postgres

# Frontend Configuration
VITE_API_URL=/api
```

### Step 3: Configure Hostname
Update `/etc/hosts` to map your domain:
```bash
sudo nano /etc/hosts
# Add: <server-ip> procurement.example.com
```

Or configure DNS records pointing to your server IP.

### Step 4: Build and Start
```bash
docker compose up --build -d
```

### Step 5: Verify Deployment
```bash
# Check containers
docker compose ps

# Check frontend
curl http://localhost/

# Check backend API
curl http://localhost/api/health

# Check database connection
curl http://localhost/api/db-test
```

### Step 6: Access Application
- Frontend: http://procurement.example.com
- Info page: http://procurement.example.com/info

## Project Structure
```
procurement/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── server.js    # Main server file
│   │   ├── models/      # Database models
│   │   └── routes/      # API routes
│   ├── package.json
│   └── Dockerfile
├── frontend/            # React + Vite SPA
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   └── App.tsx      # Main app component
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf       # Nginx reverse proxy config
├── init-db/             # Database initialization
│   └── init.sql         # Schema and initial data
├── docker-compose.yml   # Service orchestration
└── .env                 # Environment variables
```

## Services

### Frontend (Nginx)
- Port: 80
- Container: smart-shopping-list
- SPA with React 19.2.3 + TypeScript

### Backend (Express.js)
- Port: 3002
- Container: shoper-backend
- API endpoints: /api/lists, /api/items, /api/health

### Database (PostgreSQL)
- Port: 5432 (internal only)
- Container: shoper-db
- Database: shoper_db
- Persistent volume: postgres_data

## API Endpoints

### Shopping Lists
- `GET /api/lists` - Get all lists
- `POST /api/lists` - Create list
- `DELETE /api/lists/:id` - Delete list
- `PUT /api/lists/:id` - Update list

### Items
- `GET /api/items/:listId` - Get items in list
- `POST /api/items` - Create item
- `DELETE /api/items/:id` - Delete item
- `PUT /api/items/:id` - Update item

### Health Check
- `GET /api/health` - API health status
- `GET /api/db-test` - Database connection test

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs <service-name>

# Rebuild
docker compose down
docker compose up --build -d
```

### Port already in use
```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :3002

# Kill process
sudo kill -9 <PID>
```

### Database connection issues
```bash
# Check database logs
docker compose logs shoper-db

# Verify database
docker compose exec shoper-db psql -U shoper_user -d shoper_db -c "SELECT 1"
```

### Frontend not loading
```bash
# Check nginx config
docker compose exec smart-shopping-list nginx -t

# Check nginx logs
docker compose logs smart-shopping-list
```

## Database Schema

### users
- id: UUID primary key
- username: VARCHAR unique
- telegram_id: VARCHAR
- created_at: TIMESTAMP

### shopping_lists
- id: UUID primary key
- name: VARCHAR
- is_public: BOOLEAN
- created_by: UUID (FK to users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### items
- id: UUID primary key
- list_id: UUID (FK to shopping_lists)
- name: VARCHAR
- quantity: DECIMAL
- unit: VARCHAR (pcs, kg, g, l, ml)
- price: DECIMAL
- category: VARCHAR
- is_bought: BOOLEAN
- added_by: UUID (FK to users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### list_participants
- list_id: UUID (FK)
- user_id: UUID (FK)
- Composite primary key (list_id, user_id)

## Maintenance

### Backup database
```bash
docker compose exec shoper-db pg_dump -U shoper_user shoper_db > backup.sql
```

### Restore database
```bash
docker compose exec -T shoper-db psql -U shoper_user shoper_db < backup.sql
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f <service-name>
```

### Update application
```bash
cd /opt/docker/compose/procurement
git pull
docker compose up --build -d
```

## Security Notes
- Change default database password in `.env`
- Use HTTPS in production (add reverse proxy or SSL terminator)
- Set appropriate firewall rules
- Keep Docker and dependencies updated
- Regular database backups recommended

## Support
For issues or questions, check logs or review deployment guide above.

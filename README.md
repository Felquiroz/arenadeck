# ArenaDeck

Plataforma web para gestión de torneos de juegos de cartas coleccionables (TCG): Magic: The Gathering, Pokémon y Yu-Gi-Oh!

## Tecnologías

### Frontend (`apps/web`)
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Supabase JS Client
- Lucide React

### Backend (`apps/api`)
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Auth
- Zod (validación)

### Monorepo
- Turborepo
- npm workspaces

## Estructura

```
arenadeck/
├── apps/
│   ├── api/          # Backend API
│   └── web/          # Frontend React
├── packages/
│   ├── database/     # Prisma schema
│   └── shared/       # Tipos compartidos
└── turbo.json
```

## Configuración

1. Clonar repositorio
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` a `.env` en `apps/web` y `apps/api`
4. Configurar variables de entorno:
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`

## Ejecución

- Desarrollo: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Funcionalidades

- Autenticación de usuarios con roles (Player/Organizer/Admin)
- Creación y gestión de torneos (formato Suizo/Eliminación)
- Emparejamiento Suizo automático
- Sistema de rating ELO
- Gestión de partidos y desempates
- Tablas de posiciones
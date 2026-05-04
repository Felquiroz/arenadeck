# ArenaDeck - Documentación de Arquitectura

## 1. Modelo de Datos (ERD)

```
┌─────────────────────┐       ┌─────────────────────┐
│       users         │       │   tournaments      │
├─────────────────────┤       ├─────────────────────┤
│ id (UUID) PK       │◄──────│ organizer_id (UUID)│
│ username (VARCHAR) │       │ id (UUID) PK      │
│ email (VARCHAR)   │       │ name (VARCHAR)    │
│ password_hash     │       │ description       │
│ elo_rating (INT)  │       │ game_type (ENUM) │──► MTG, PKM, YGO
│ qr_code           │       │ format (ENUM)     │──► SWISS, SINGLE_ELIM
│ role (ENUM)       │──► PLAYER, ORGANIZER │ state (ENUM)      │──► OPEN, IN_PROGRESS,
│ created_at        │    ADMIN          │ max_players     │    FINISHED, CANCELLED
│ updated_at        │       │ rounds (INT)     │
└─────────────────────┘       │ current_round    │
        │                    │ start_time       │
        │                    │ end_time        │
        │                    │ created_at      │
        │                    │ updated_at     │
        │                    └────────┬────────┘
        │                             │
        │                    ┌─────────▼─────────┐
        │                    │   participants    │
        │                    ├───────────────────┤
        │                    │ id (UUID) PK     │
        │         ┌──────────│ user_id (UUID) FK│◄─────────┐
        │         │         │ tournament_id    │          │
        │         │         │ current_points   │          │
        │         │         │ omw_percentage   │          │
        │         │         │ gw_percentage    │          │
        │         │         │ seed (INT)      │          │
        │         │         │ has_bye (BOOL)  │          │
        │         │         │ created_at      │          │
        │         │         └─────────────────┘          │
        │                    ┌─────────▼─────────┐
        │                    │     matches       │
        │         ┌──────────│ id (UUID) PK     │
        │         │         │ tournament_id FK  │
        │         │         │ round_number (INT)│
        │         │         │ table_number      │
        │         │    ┌─────│ player1_id (UUID)│──► BYE
        │         │    │    │ player2_id (UUID)│
        │         │    │    │ result (ENUM)    │──► P1_WIN, P2_WIN,
        │         │    │    │ status (ENUM)     │    DRAW, BYE
        │         │    │    │ player1_wins     │──► PENDING,
        │         │    │    │ player2_wins     │    IN_PROGRESS,
        │         │    │    │ draws (INT)      │    COMPLETED
        │         │    │    │ created_at       │
        └─────────┴────┴───│ updated_at       │
                            └───────────────────┘
```

### Tablas Principales

| Tabla | Descripción |
|-------|------------|
| **users** | Usuarios del sistema (jugadores, organizadores, admin) |
| **tournaments** | Torneos con tipo de juego y formato |
| **participants** | Relación usuarios-torneos con estadísticas |
| **matches** | Partidas entre jugadores por ronda |

### Enums

```sql
game_type: 'MTG' | 'PKM' | 'YGO'
tournament_format: 'SWISS' | 'SINGLE_ELIM'
tournament_state: 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED'
match_result: 'P1_WIN' | 'P2_WIN' | 'DRAW' | 'P1_WIN_GIVE' | 'P2_WIN_GIVE' | 'BYE'
match_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
user_role: 'PLAYER' | 'ORGANIZER' | 'ADMIN'
```

---

## 2. API REST

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Autenticación
| Método | Endpoint | Descripción | Auth |
|--------|---------|------------|------|
| POST | `/auth/register` | Registrar nuevo usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| GET | `/auth/profile` | Obtener perfil del usuario | JWT |

#### Torneos
| Método | Endpoint | Descripción | Auth |
|--------|---------|------------|------|
| GET | `/tournaments` | Listar todos los torneos | No |
| GET | `/tournaments/:id` | Obtener detalle de torneo | No |
| POST | `/tournaments` | Crear torneo | JWT |
| PATCH | `/tournaments/:id` | Actualizar torneo | JWT |
| DELETE | `/tournaments/:id` | Eliminar torneo | JWT |

#### Participantes
| Método | Endpoint | Descripción | Auth |
|--------|---------|------------|------|
| GET | `/participants/tournament/:id` | Listar participantes | No |
| POST | `/participants/tournament/:id/join` | Unirse a torneo | JWT |
| DELETE | `/participants/:id` | Abandonar torneo | JWT |

#### Partidas
| Método | Endpoint | Descripción | Auth |
|--------|---------|------------|------|
| POST | `/matches/tournament/:id/start` | Iniciar torneo | JWT |
| POST | `/matches/tournament/:id/next-round` | Siguiente ronda | JWT |
| POST | `/matches/:matchId/result` | Enviar resultado | JWT |
| POST | `/matches/tournament/:id/finish` | Finalizar torneo | JWT |

#### Leaderboard
| Método | Endpoint | Descripción | Auth |
|--------|---------|------------|------|
| GET | `/leaderboard` | Ranking global ELO | No |
| GET | `/leaderboard/tournament/:id` | Ranking de torneo | No |

### Formato de Respuesta

```json
// Éxito
{
  "data": { ... },
  "message": "Operación exitosa"
}

// Error
{
  "error": "Mensaje de error",
  "code": "ERROR_CODE"
}
```

---

## 3. Autenticación JWT

### Flujo de Autenticación

```
┌──────────┐     POST /auth/register      ┌──────────┐
│  Cliente  │ ─────────────────────────►  │   API    │
└──────────┘                              └──────────┘
       │                                        │
       │     { email, password, username }      │
       │ ◄─────────────────────────────────────│
       │                                        │
       │     POST /auth/login                   │
       │ ─────────────────────────────────────► │
       │                                        │
       │     { access_token, user }              │
       │ ◄─────────────────────────────────────│
       │                                        │
       │ Authorization: Bearer <token>         │
       │ ─────────────────────────────────────► │
       │                                        │
       │     Recursos protegidos               │
       │ ◄─────────────────────────────────────│
```

### Estructura del Token JWT

```typescript
interface JWTPayload {
  userId: string;      // ID del usuario
  username: string;    // Nombre de usuario
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
  iat: number;        // Issued At (timestamp)
  exp: number;        // Expiration (timestamp)
}
```

### Implementación

```typescript
// Middleware de autenticación (apps/api/src/infrastructure/auth/jwt.ts)

import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    
    req.userId = (decoded as { userId: string }).userId;
    req.userRole = (decoded as { role: string }).role;
    next();
  });
};

// Protección de roles
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
```

### Uso en Rutas

```typescript
// Ejemplo: Ruta protegida
tournamentRouter.post('/', authenticateToken, tournamentController.createTournament);

// Ejemplo: Ruta con rol específico
tournamentRouter.delete('/:id', authenticateToken, requireRole('ADMIN', 'ORGANIZER'), tournamentController.deleteTournament);
```

### Generación del Token

```typescript
// apps/api/src/presentation/controllers/authController.ts

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const TOKEN_EXPIRY = '24h';

export const login = async (req: Request, res: Response) => {
  // ... validación de credenciales ...
  
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  res.json({ access_token: token, user });
};
```

### Cabeceras Required

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| Código | Descripción |
|--------|------------|
| 401 | Token no proporcionado |
| 403 | Token inválido o expirado |

---

## 4. Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│                    (React + Vite)                            │
│                  http://localhost:5173                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP + JWT
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API REST                               │
│                   (Express + Node.js)                       │
│                  http://localhost:3000                      │
├─────────────────────────────────────────────────────────────┤
│  Routes    │ Controllers │ Services │ Middleware │ Auth   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               BASE DE DATOS (Supabase/PostgreSQL)            │
│                  https://uufxogkjtyiiazowmmcd.supabase.co   │
├─────────────────────────────────────────────────────────────┤
│  Users │ Tournaments │ Participants │ Matches               │
└─────────────────────────────────────────────────────────────┘
```
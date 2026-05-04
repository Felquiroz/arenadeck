-- ArenaDeck Database Schema
-- PostgreSQL 15+

-- ENUMS
CREATE TYPE game_type AS ENUM ('MTG', 'PKM', 'YGO');
CREATE TYPE tournament_format AS ENUM ('SWISS', 'SINGLE_ELIM');
CREATE TYPE tournament_state AS ENUM ('OPEN', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
CREATE TYPE match_result AS ENUM ('P1_WIN', 'P2_WIN', 'DRAW', 'P1_WIN_GIVE', 'P2_WIN_GIVE', 'BYE');
CREATE TYPE match_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE user_role AS ENUM ('PLAYER', 'ORGANIZER', 'ADMIN');

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    elo_rating INTEGER DEFAULT 1200,
    qr_code VARCHAR(100) UNIQUE,
    role user_role DEFAULT 'PLAYER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TOURNAMENTS TABLE
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    game_type game_type NOT NULL,
    format tournament_format NOT NULL,
    state tournament_state DEFAULT 'OPEN',
    max_players INTEGER NOT NULL,
    rounds INTEGER DEFAULT 0,
    current_round INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    organizer_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTICIPANTS TABLE
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    current_points INTEGER DEFAULT 0,
    omw_percentage DECIMAL(5,2) DEFAULT 0.00,
    gw_percentage DECIMAL(5,2) DEFAULT 0.00,
    seed INTEGER DEFAULT 0,
    has_bye BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tournament_id)
);

-- MATCHES TABLE
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id),
    round_number INTEGER NOT NULL,
    table_number INTEGER,
    player1_id UUID NOT NULL REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    result match_result DEFAULT 'PENDING',
    status match_status DEFAULT 'PENDING',
    player1_wins INTEGER DEFAULT 0,
    player2_wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, round_number, table_number)
);

-- INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_tournaments_state ON tournaments(state);
CREATE INDEX idx_tournaments_game_type ON tournaments(game_type);
CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_participants_tournament ON participants(tournament_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_matches_tournament_round ON matches(tournament_id, round_number);
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);

-- TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          password_hash: string;
          elo_rating: number;
          qr_code: string | null;
          role: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          password_hash: string;
          elo_rating?: number;
          qr_code?: string | null;
          role?: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          password_hash?: string;
          elo_rating?: number;
          qr_code?: string | null;
          role?: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
          created_at?: string;
          updated_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          game_type: 'MTG' | 'PKM' | 'YGO';
          format: 'SWISS' | 'SINGLE_ELIM';
          state: 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
          max_players: number;
          rounds: number;
          current_round: number;
          start_time: string | null;
          end_time: string | null;
          organizer_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          game_type: 'MTG' | 'PKM' | 'YGO';
          format: 'SWISS' | 'SINGLE_ELIM';
          state?: 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
          max_players: number;
          rounds?: number;
          current_round?: number;
          start_time?: string | null;
          end_time?: string | null;
          organizer_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          game_type?: 'MTG' | 'PKM' | 'YGO';
          format?: 'SWISS' | 'SINGLE_ELIM';
          state?: 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
          max_players?: number;
          rounds?: number;
          current_round?: number;
          start_time?: string | null;
          end_time?: string | null;
          organizer_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          user_id: string;
          tournament_id: string;
          current_points: number;
          omw_percentage: number;
          gw_percentage: number;
          seed: number;
          has_bye: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tournament_id: string;
          current_points?: number;
          omw_percentage?: number;
          gw_percentage?: number;
          seed?: number;
          has_bye?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tournament_id?: string;
          current_points?: number;
          omw_percentage?: number;
          gw_percentage?: number;
          seed?: number;
          has_bye?: boolean;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          round_number: number;
          table_number: number | null;
          player1_id: string;
          player2_id: string | null;
          result: 'P1_WIN' | 'P2_WIN' | 'DRAW' | 'P1_WIN_GIVE' | 'P2_WIN_GIVE' | 'BYE' | null;
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
          player1_wins: number;
          player2_wins: number;
          draws: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          round_number: number;
          table_number?: number | null;
          player1_id: string;
          player2_id?: string | null;
          result?: 'P1_WIN' | 'P2_WIN' | 'DRAW' | 'P1_WIN_GIVE' | 'P2_WIN_GIVE' | 'BYE' | null;
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
          player1_wins?: number;
          player2_wins?: number;
          draws?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          round_number?: number;
          table_number?: number | null;
          player1_id?: string;
          player2_id?: string | null;
          result?: 'P1_WIN' | 'P2_WIN' | 'DRAW' | 'P1_WIN_GIVE' | 'P2_WIN_GIVE' | 'BYE' | null;
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
          player1_wins?: number;
          player2_wins?: number;
          draws?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
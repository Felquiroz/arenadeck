import { supabase } from '../supabase';

const handleError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);
  if (error?.message) throw new Error(error.message);
  throw new Error(defaultMessage);
};

export const authService = {
  async register(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) handleError(error, 'Error al registrarse');
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export const tournamentService = {
  async getAll(filters?: { state?: string; gameType?: string }) {
    let query = supabase.from('tournaments').select('*');
    if (filters?.state) query = query.eq('state', filters.state);
    if (filters?.gameType) query = query.eq('game_type', filters.gameType);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*, organizer:users(id, username), participants(*, user:users(id, username, elo_rating)), matches(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(tournament: {
    name: string;
    description?: string;
    game_type: 'MTG' | 'PKM' | 'YGO';
    format: 'SWISS' | 'SINGLE_ELIM';
    max_players: number;
    start_time?: string;
  }, organizerId: string) {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({ ...tournament, organizer_id: organizerId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<{
    name: string;
    description: string;
    state: 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  }>) {
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  subscribeToTournamentChanges(onChange: () => void) {
    return supabase
      .channel('tournaments-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, onChange)
      .subscribe();
  },
};

export const participantService = {
  async join(tournamentId: string, userId: string) {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('max_players')
      .eq('id', tournamentId)
      .single();

    const { data: currentCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact' })
      .eq('tournament_id', tournamentId);

    if (tournament && currentCount && currentCount.length >= tournament.max_players) {
      throw new Error('Tournament is full');
    }

    const { data, error } = await supabase
      .from('participants')
      .insert({
        user_id: userId,
        tournament_id: tournamentId,
        current_points: 0,
        omw_percentage: 0,
        gw_percentage: 0,
        seed: (currentCount?.length || 0) + 1,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async leave(tournamentId: string, userId: string) {
    const { error } = await supabase
      .from('participants')
      .delete()
      .match({ tournament_id: tournamentId, user_id: userId });
    if (error) throw error;
  },

  async getByTournament(tournamentId: string) {
    const { data, error } = await supabase
      .from('participants')
      .select('*, user:users(id, username, elo_rating)')
      .eq('tournament_id', tournamentId)
      .order('current_points', { ascending: false });
    if (error) throw error;
    return data;
  },
};

export const matchService = {
  async getByTournament(tournamentId: string, round?: number) {
    let query = supabase
      .from('matches')
      .select('*, player1:users!player1_id(id, username, elo_rating), player2:users!player2_id(id, username, elo_rating)')
      .eq('tournament_id', tournamentId);
    
    if (round) query = query.eq('round_number', round);
    
    const { data, error } = await query.order('round_number', { ascending: false }).order('table_number');
    if (error) throw error;
    return data;
  },

  async reportResult(
    matchId: string,
    result: 'P1_WIN' | 'P2_WIN' | 'DRAW',
    player1Wins: number,
    player2Wins: number,
    draws: number
  ) {
    const { data, error } = await supabase
      .from('matches')
      .update({
        result,
        status: 'COMPLETED',
        player1_wins: player1Wins,
        player2_wins: player2Wins,
        draws,
      })
      .eq('id', matchId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const leaderboardService = {
  async getGlobal(limit = 50) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, elo_rating')
      .order('elo_rating', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getTournament(tournamentId: string) {
    const { data, error } = await supabase
      .from('participants')
      .select('*, user:users(id, username, elo_rating)')
      .eq('tournament_id', tournamentId)
      .order('current_points', { ascending: false })
      .order('omw_percentage', { ascending: false });
    if (error) throw error;
    return data;
  },
};

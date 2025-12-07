
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

export interface Player {
    id: string;
    email: string;
    name: string;
    city: string;
    highscore: number;
    lottery_tickets: number; // New field
    last_played: string;
    is_verified: boolean;
}

export const submitScore = async (score: number, tickets: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return;

    // Get metadata safely
    const { name, city } = user.user_metadata;

    // 1. Update Highscore & Tickets (Global China Leaderboard)
    // We try to call the new RPC, or fallback to direct upset if we can (but RPC is safer for atomic)
    // For now we assume the SQL migration "china_tables.sql" has been run.
    const { error: hsError } = await supabase.rpc('update_china_highscore', {
        p_email: user.email,
        p_name: name || 'Speler',
        p_city: city || 'Onbekend',
        p_score: score,
        p_tickets: tickets
    });

    if (hsError) {
        console.error('Error updating china highscore:', hsError);
    }

    // 2. Record specific game play
    const { error: playError } = await supabase
        .from('china_game_plays') // NEW TABLE
        .insert({
            user_id: user.id,
            email: user.email,
            score: score,
            tickets_earned: tickets,
            played_at: new Date().toISOString()
        });

    if (playError) {
        console.warn('Could not save china game play stats:', playError);
    }
};

export const getLeaderboard = async () => {
    const { data, error } = await supabase
        .from('china_players') // NEW TABLE
        .select('name, city, highscore, lottery_tickets')
        .order('highscore', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching china leaderboard:', error);
        return [];
    }

    if (!data) return [];

    // Filter unique names (keep highest score per name)
    const seenNames = new Set();
    const uniqueLeaderboard = [];

    for (const entry of data) {
        if (!seenNames.has(entry.name)) {
            seenNames.add(entry.name);
            uniqueLeaderboard.push(entry);
        }
        if (uniqueLeaderboard.length >= 10) break;
    }

    return uniqueLeaderboard;
};

// Kept for backward compat or if needed, but not primarily used for china tables
export const ensurePlayerVerified = async (email: string) => {
    // In the new system, we trust the auth verification for now
    // But we can still update the old table if needed, or update china_players
    /*
    const { error } = await supabase
        .from('china_players')
        .update({ is_verified: true })
        .eq('email', email);
    */
};

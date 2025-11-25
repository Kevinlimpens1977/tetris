
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
    last_played: string;
    is_verified: boolean;
}

export const submitScore = async (score: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return;

    const { error } = await supabase.rpc('update_highscore', {
        p_email: user.email,
        p_score: score
    });

    if (error) {
        console.error('Error submitting score:', error);
    }
};

export const getLeaderboard = async () => {
    const { data, error } = await supabase
        .from('players')
        .select('name, city, highscore')
        .eq('is_verified', true) // Only show verified players
        .order('highscore', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }

    return data;
};

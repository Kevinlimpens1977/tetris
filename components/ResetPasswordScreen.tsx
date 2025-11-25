import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface ResetPasswordScreenProps {
    onSuccess: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !confirmPassword) return;

        if (password !== confirmPassword) {
            setError('Wachtwoorden komen niet overeen');
            return;
        }

        if (password.length < 6) {
            setError('Wachtwoord moet minimaal 6 tekens lang zijn');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            onSuccess();
        } catch (err: any) {
            console.error('Password reset error:', err);
            setError(err.message || 'Kon wachtwoord niet wijzigen.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-6">
            <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl border border-white/20 relative">
                {/* Festive Decor */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-5xl">🔑</div>

                <h2 className="text-2xl font-bold text-center mb-6 mt-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300">
                    Nieuw Wachtwoord
                </h2>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-cyan-200 mb-2">Nieuw Wachtwoord</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Minimaal 6 tekens"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-cyan-200 mb-2">Bevestig Wachtwoord</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Herhaal wachtwoord"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none mt-4"
                    >
                        {loading ? 'Bezig...' : 'WACHTWOORD OPSLAAN'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordScreen;

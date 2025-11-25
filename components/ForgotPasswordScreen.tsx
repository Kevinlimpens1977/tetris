import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface ForgotPasswordScreenProps {
    onBack: () => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (resetError) throw resetError;

            setSuccess(true);
        } catch (err: any) {
            console.error('Password reset error:', err);
            setError(err.message || 'Er ging iets mis. Probeer het opnieuw.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-6">
                <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl border border-white/20 text-center">
                    <div className="text-5xl mb-4">📧</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Check je e-mail!</h2>
                    <p className="text-gray-300 mb-6">
                        We hebben een wachtwoord reset link gestuurd naar <span className="text-cyan-400">{email}</span>.
                        Klik op de link om je wachtwoord te resetten.
                    </p>
                    <button
                        onClick={onBack}
                        className="py-3 px-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
                    >
                        Terug naar inloggen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-6">
            <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl border border-white/20 relative">
                {/* Festive Decor */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-5xl">🔑</div>

                <h2 className="text-2xl font-bold text-center mb-6 mt-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300">
                    Wachtwoord Vergeten
                </h2>

                <p className="text-sm text-gray-300 text-center mb-6">
                    Vul je email adres in en we sturen je een link om je wachtwoord te resetten.
                </p>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-cyan-200 mb-2">Email Adres</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="naam@voorbeeld.nl"
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors disabled:opacity-50"
                        >
                            Terug
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? 'Bezig...' : 'VERSTUUR RESET LINK'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordScreen;

import React, { useState } from 'react';
import { UserData } from '../types';
import { supabase } from '../services/supabase';

interface RegistrationFormProps {
  onSubmit: (data: UserData) => void;
  onBack: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit, onBack }) => {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    city: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.email) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create Supabase Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: crypto.randomUUID(), // Random password as they won't use it to login manually
        options: {
          data: {
            name: formData.name,
            city: formData.city
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (authError) throw authError;

      // 2. Create Player Record
      if (authData.user) {
        const { error: dbError } = await supabase.from('players').insert({
          email: formData.email,
          name: formData.name,
          city: formData.city
        });

        if (dbError) throw dbError;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Er ging iets mis bij het registreren.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-6">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl border border-white/20 text-center">
          <div className="text-5xl mb-4">📩</div>
          <h2 className="text-2xl font-bold text-white mb-4">Check je e-mail!</h2>
          <p className="text-gray-300 mb-6">
            We hebben een bevestigingslink gestuurd naar <span className="text-cyan-400">{formData.email}</span>.
            Klik op de link om je registratie te voltooien en het spel te starten.
          </p>
          <button
            onClick={onBack}
            className="py-3 px-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            Terug naar start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-6">
      <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl border border-white/20 relative">
        {/* Festive Decor */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-5xl">🎄</div>

        <h2 className="text-2xl font-bold text-center mb-6 mt-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300">
          Spelersregistratie
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-cyan-200 mb-2">Naam</label>
            <input
              type="text"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Je naam"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-cyan-200 mb-2">Woonplaats</label>
            <input
              type="text"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              placeholder="Bijv. Heerlen"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-cyan-200 mb-2">Email Adres</label>
            <input
              type="email"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="naam@voorbeeld.nl"
            />
          </div>

          <div className="text-xs text-gray-400 text-center leading-relaxed mt-2">
            Je ontvangt een verificatie-email. Pas na verificatie kun je spelen!
          </div>

          <div className="flex gap-4 pt-4">
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
              {loading ? 'Bezig...' : 'REGISTREREN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
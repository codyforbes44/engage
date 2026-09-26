import { useState, useEffect, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { getUserProfile, updateUserProfile, UserProfile } from '../lib/db';
import { Key, Save, Loader2 } from 'lucide-react';

export default function Settings({ user }: { user: User }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [xApiKey, setXApiKey] = useState('');
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const p = await getUserProfile(user.uid);
      if (p) {
        setProfile(p);
        setXApiKey(p.xApiKey || '');
        setXaiApiKey(p.xaiApiKey || '');
      }
      setLoading(false);
    }
    loadProfile();
  }, [user.uid]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateUserProfile(user.uid, {
        xApiKey,
        xaiApiKey,
      });
      setMessage('Settings saved successfully.');
    } catch (error) {
      setMessage('Failed to save settings.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">API Credentials</h2>
            <p className="text-sm text-zinc-400">Manage your X.com and xAI API keys for direct integration.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="xApiKey" className="block text-sm font-medium text-zinc-300 mb-2">
              X.com API Key (Bearer Token)
            </label>
            <input
              type="password"
              id="xApiKey"
              value={xApiKey}
              onChange={(e) => setXApiKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="AAAAAAAAAAAAAAAAAAAAA..."
            />
            <p className="mt-2 text-xs text-zinc-500">Required for reading engagement and posting to X.</p>
          </div>

          <div>
            <label htmlFor="xaiApiKey" className="block text-sm font-medium text-zinc-300 mb-2">
              xAI API Key
            </label>
            <input
              type="password"
              id="xaiApiKey"
              value={xaiApiKey}
              onChange={(e) => setXaiApiKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="xai-..."
            />
            <p className="mt-2 text-xs text-zinc-500">Required for using Grok models directly (optional, Gemini is used by default).</p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {message}
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router';
import { getUserProfile, UserProfile } from '../lib/db';
import { analyzeTrendXAI } from '../lib/xai';
import { Search, Loader2, TrendingUp, AlertCircle, PenSquare } from 'lucide-react';

export default function Source({ user }: { user: User }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasGlobalKey, setHasGlobalKey] = useState(false);
  const [topic, setTopic] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const [p, configRes] = await Promise.all([
        getUserProfile(user.uid),
        fetch('/api/config').then(res => res.json()).catch(() => ({ hasGlobalXAIKey: false }))
      ]);
      setProfile(p);
      setHasGlobalKey(configRes.hasGlobalXAIKey);
    }
    loadData();
  }, [user.uid]);

  const canAnalyze = profile?.xaiApiKey || hasGlobalKey;

  const handleAnalyze = async () => {
    if (!canAnalyze) {
      setError('Please configure your xAI API Key in Settings first.');
      return;
    }
    if (!topic.trim()) {
      setError('Please enter a topic to analyze.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const result = await analyzeTrendXAI(profile?.xaiApiKey, topic);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze trend');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    // Navigate to create page and pass the analysis as a starting point
    // In a real app, we might use state or a query param
    navigate('/create', { state: { initialTopic: topic, initialContent: analysis } });
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Source Content</h1>
        <p className="text-zinc-400 mt-1">Analyze trends and discover content angles using Grok (xAI).</p>
      </div>

      {!canAnalyze && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3 text-yellow-500">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Missing xAI API Key</h3>
            <p className="text-sm opacity-80 mt-1">You need to configure your xAI API key in the Settings page to use this feature.</p>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Trend or Topic to Analyze
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Artificial Intelligence in Healthcare, Web3 Gaming..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !topic.trim() || !canAnalyze}
              className="flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
              Analyze
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="min-h-[200px] flex flex-col items-center justify-center text-zinc-500 space-y-4 border border-dashed border-zinc-800 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p>Analyzing trends with Grok...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              <button
                onClick={handleCreatePost}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-50 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
              >
                <PenSquare className="w-4 h-4" />
                Draft Post from Analysis
              </button>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-zinc-50 whitespace-pre-wrap leading-relaxed">
              {analysis}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

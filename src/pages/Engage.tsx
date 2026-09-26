import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getUserProfile, UserProfile, createReply, subscribeToReplies, Reply } from '../lib/db';
import { generateXAIReply } from '../lib/xai';
import { GoogleGenAI } from '@google/genai';
import { MessageCircleReply, Loader2, Copy, CheckCircle2, AlertCircle, Sparkles, Wand2, History, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Engage({ user }: { user: User }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasGlobalKey, setHasGlobalKey] = useState(false);
  const [tweetContent, setTweetContent] = useState('');
  const [style, setStyle] = useState('witty');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Reply[]>([]);

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

    const unsubscribe = subscribeToReplies(user.uid, (data) => {
      setHistory(data);
    });
    return unsubscribe;
  }, [user.uid]);

  const canGenerate = profile?.xaiApiKey || hasGlobalKey;

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError('Please configure your xAI API Key in Settings first.');
      return;
    }
    if (!tweetContent.trim()) {
      setError('Please enter the tweet content to reply to.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedReply('');
    setCopied(false);

    try {
      const reply = await generateXAIReply(profile?.xaiApiKey, tweetContent, style);
      setGeneratedReply(reply);
      
      // Save to history
      await createReply(user.uid, {
        originalTweet: tweetContent,
        replyContent: reply,
        style
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate reply');
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!generatedReply) return;
    setRefining(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Original Tweet: "${tweetContent}"\n\nDraft Reply: "${generatedReply}"\n\nRefine this reply to be more engaging, punchy, and natural for X.com. Keep it under 280 characters.`,
        config: {
          systemInstruction: "You are a master of X.com (Twitter) engagement. Your goal is to take a draft reply and make it perfect for the platform.",
        }
      });
      if (response.text) {
        setGeneratedReply(response.text);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to refine reply with Gemini.');
    } finally {
      setRefining(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDraftFromReply = (reply: string) => {
    navigate('/create', { state: { initialContent: reply } });
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Engage</h1>
        <p className="text-zinc-400 mt-1">Generate high-quality replies using Grok (xAI) and refine with Gemini.</p>
      </div>

      {!canGenerate && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3 text-yellow-500">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Missing xAI API Key</h3>
            <p className="text-sm opacity-80 mt-1">You need to configure your xAI API key in the Settings page to use this feature.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Target Tweet Content
              </label>
              <textarea
                value={tweetContent}
                onChange={(e) => setTweetContent(e.target.value)}
                placeholder="Paste the tweet you want to reply to here..."
                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Reply Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['witty', 'professional', 'controversial'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      style === s 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !tweetContent.trim() || !canGenerate}
              className="w-full flex items-center justify-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 shadow-lg shadow-white/5"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircleReply className="w-5 h-5" />}
              Generate Reply
            </button>
          </div>

          {/* Current Result */}
          {(loading || generatedReply) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-h-[200px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Generated Reply</h2>
                <div className="flex items-center gap-2">
                  {generatedReply && (
                    <>
                      <button
                        onClick={handleRefine}
                        disabled={refining}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:text-zinc-50 rounded-lg text-xs font-medium transition-colors border border-zinc-700"
                      >
                        {refining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        Refine
                      </button>
                      <button
                        onClick={() => handleCopy(generatedReply)}
                        className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDraftFromReply(generatedReply)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                      >
                        Draft Post
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm font-medium animate-pulse">Consulting Grok...</p>
                </div>
              ) : (
                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-50 whitespace-pre-wrap relative text-[15px] leading-relaxed">
                  {generatedReply}
                  {refining && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-zinc-200 text-sm">
                        <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                        Gemini is refining...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col h-full max-h-[700px]">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-semibold">History</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <MessageCircleReply className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">No engagement history yet.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3 group">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </span>
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{item.style}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 italic border-l-2 border-zinc-800 pl-3">
                      "{item.originalTweet}"
                    </p>
                    <p className="text-sm text-zinc-100 leading-relaxed">
                      {item.replyContent}
                    </p>
                    <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(item.replyContent)}
                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-50 rounded-md text-xs transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                      <button
                        onClick={() => handleDraftFromReply(item.replyContent)}
                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md text-xs transition-colors"
                      >
                        Draft
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

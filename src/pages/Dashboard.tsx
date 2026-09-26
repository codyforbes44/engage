import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeToPosts, Post, createUserProfile, getUserProfile, subscribeToReplies, Reply } from '../lib/db';
import { BarChart3, MessageSquare, Repeat2, Heart, Clock, AlertCircle, Plus, MessageCircleReply, Zap, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { Link } from 'react-router';

export default function Dashboard({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState('');

  useEffect(() => {
    // Ensure profile exists
    createUserProfile(user);
    
    const unsubscribePosts = subscribeToPosts(user.uid, (data) => {
      setPosts(data);
    });

    const unsubscribeReplies = subscribeToReplies(user.uid, (data) => {
      setReplies(data);
    });

    // Fetch metrics if X API key is available
    async function fetchMetrics() {
      const [profile, configRes] = await Promise.all([
        getUserProfile(user.uid),
        fetch('/api/config').then(res => res.json()).catch(() => ({ hasGlobalXKey: false }))
      ]);

      if (profile?.xApiKey || configRes.hasGlobalXKey) {
        setLoadingMetrics(true);
        try {
          const response = await axios.post('/api/x/metrics', { apiKey: profile?.xApiKey });
          if (response.data?.data?.public_metrics) {
            setMetrics(response.data.data.public_metrics);
          }
        } catch (error: any) {
          console.error('Failed to fetch X metrics:', error);
          setMetricsError('Could not fetch real-time metrics. Check your API key in Settings.');
        } finally {
          setLoadingMetrics(false);
        }
      }
    }
    fetchMetrics();

    return () => {
      unsubscribePosts();
      unsubscribeReplies();
    };
  }, [user]);

  const recentActivity = [
    ...posts.map(p => ({ ...p, type: 'post' as const })),
    ...replies.map(r => ({ ...r, type: 'reply' as const, content: r.replyContent }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Overview of your X.com engagement and recent activity.</p>
        </div>
        {metrics && (
          <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live Metrics Connected
          </div>
        )}
      </div>

      {metricsError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {metricsError}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group">
          <div className="flex items-center gap-3 text-zinc-400 mb-4">
            <Heart className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-medium">Followers</h3>
          </div>
          <p className="text-3xl font-bold">{loadingMetrics ? '...' : metrics?.followers_count ?? '--'}</p>
          <p className="text-xs text-zinc-500 mt-2">{metrics ? 'Real-time from X' : 'Requires X API Key'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group">
          <div className="flex items-center gap-3 text-zinc-400 mb-4">
            <Repeat2 className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-medium">Total Tweets</h3>
          </div>
          <p className="text-3xl font-bold">{loadingMetrics ? '...' : metrics?.tweet_count ?? '--'}</p>
          <p className="text-xs text-zinc-500 mt-2">{metrics ? 'Real-time from X' : 'Requires X API Key'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group">
          <div className="flex items-center gap-3 text-zinc-400 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-medium">Following</h3>
          </div>
          <p className="text-3xl font-bold">{loadingMetrics ? '...' : metrics?.following_count ?? '--'}</p>
          <p className="text-xs text-zinc-500 mt-2">{metrics ? 'Real-time from X' : 'Requires X API Key'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <Link 
              to="/create" 
              className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-blue-500/50 hover:bg-zinc-800/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-medium">New Post</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </Link>
            <Link 
              to="/engage" 
              className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <MessageCircleReply className="w-5 h-5" />
                </div>
                <span className="font-medium">Generate Reply</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            Recent Activity
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
            {recentActivity.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-3">
                <Clock className="w-12 h-12 opacity-10" />
                <p>No recent activity found.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="p-5 hover:bg-zinc-800/30 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        item.type === 'post' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                      }`}>
                        {item.type === 'post' ? <Plus className="w-4 h-4" /> : <MessageCircleReply className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                            {item.type === 'post' ? 'Post Drafted' : 'Reply Generated'}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                        {item.type === 'post' && (item as any).imageUrl && (
                          <div className="mt-3">
                            <img src={(item as any).imageUrl} alt="Post attachment" className="h-20 w-20 object-cover rounded-lg border border-zinc-800" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

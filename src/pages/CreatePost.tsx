import { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useLocation } from 'react-router';
import { createPost } from '../lib/db';
import { generatePostIdea, generateImage, generateTTS } from '../lib/gemini';
import { Sparkles, Image as ImageIcon, Volume2, Loader2, Search, Brain, Send, Twitter, MessageCircle, Repeat2, Heart, Share, AlertCircle } from 'lucide-react';

function XPostPreview({ content, imageUrl, user }: { content: string; imageUrl?: string; user: User }) {
  return (
    <div className="bg-black border border-zinc-800 rounded-xl p-4 max-w-[500px] w-full font-sans">
      <div className="flex gap-3">
        <img 
          src={user.photoURL || ''} 
          alt={user.displayName || 'User'} 
          className="w-12 h-12 rounded-full shrink-0" 
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-bold text-[15px] text-white truncate">{user.displayName || 'User'}</span>
            <span className="text-zinc-500 text-[15px]">@{user.email?.split('@')[0]} · 1m</span>
          </div>
          <p className="text-[15px] text-white whitespace-pre-wrap leading-normal mb-3">
            {content || "What's happening?"}
          </p>
          {imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-zinc-800 mb-3">
              <img src={imageUrl} alt="Post media" className="w-full h-auto max-h-[500px] object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="flex items-center justify-between text-zinc-500 max-w-[400px]">
            <div className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer">
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-xs">0</span>
            </div>
            <div className="flex items-center gap-2 hover:text-green-400 transition-colors cursor-pointer">
              <Repeat2 className="w-[18px] h-[18px]" />
              <span className="text-xs">0</span>
            </div>
            <div className="flex items-center gap-2 hover:text-pink-400 transition-colors cursor-pointer">
              <Heart className="w-[18px] h-[18px]" />
              <span className="text-xs">0</span>
            </div>
            <div className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer">
              <Share className="w-[18px] h-[18px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePost({ user }: { user: User }) {
  const location = useLocation();
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  
  // Gemini Options
  const [useSearch, setUseSearch] = useState(false);
  const [useHighThinking, setUseHighThinking] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageSize, setImageSize] = useState('1K');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [highQualityImage, setHighQualityImage] = useState(false);

  // Loading States
  const [generatingText, setGeneratingText] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const charLimit = 280;
  const charCount = content.length;
  const isOverLimit = charCount > charLimit;

  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle initial state from Source page
  useEffect(() => {
    if (location.state) {
      if (location.state.initialTopic) setTopic(location.state.initialTopic);
      if (location.state.initialContent) {
        // Use the analysis as a base for the draft
        setContent(location.state.initialContent.slice(0, charLimit));
      }
    }
  }, [location.state]);

  const handleGenerateText = async () => {
    if (!topic) return;
    setGeneratingText(true);
    try {
      const text = await generatePostIdea(topic, useSearch, useHighThinking);
      if (text) setContent(text);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingText(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt && !content) return;
    setGeneratingImage(true);
    try {
      const prompt = imagePrompt || content;
      const url = await generateImage(prompt, imageSize, aspectRatio, highQualityImage);
      setImageUrl(url);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handlePlayTTS = async () => {
    if (!content) return;
    setGeneratingAudio(true);
    try {
      const audioUrl = await generateTTS(content);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleSave = async () => {
    if (!content || isOverLimit) return;
    setSaving(true);
    try {
      await createPost(user.uid, {
        content,
        imageUrl,
        status,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      if (status === 'published') {
        setContent('');
        setImageUrl('');
        setTopic('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8 relative">
      {showSuccess && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-green-500/20 flex items-center gap-3">
            <div className="bg-white/20 p-1 rounded-full">
              <Send className="w-4 h-4" />
            </div>
            <span className="font-medium">Post {status === 'published' ? 'published' : 'saved'} successfully!</span>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Post</h1>
        <p className="text-zinc-400 mt-1">Draft and generate content for X.com using Gemini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Draft</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayTTS}
                  disabled={generatingAudio || !content}
                  className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                  title="Read aloud"
                >
                  {generatingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <audio ref={audioRef} className="hidden" />
              </div>
            </div>
            
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className={`w-full h-40 bg-zinc-950 border ${isOverLimit ? 'border-red-500/50 focus:ring-red-500/20' : 'border-zinc-800 focus:ring-blue-500/50'} rounded-lg p-4 text-zinc-50 focus:outline-none focus:ring-2 resize-none font-sans text-[15px] transition-all`}
              />
              <div className={`absolute bottom-3 right-3 text-xs font-medium px-2 py-1 rounded-md ${
                isOverLimit ? 'bg-red-500/10 text-red-500' : 
                charCount > charLimit - 20 ? 'bg-yellow-500/10 text-yellow-500' : 
                'text-zinc-500'
              }`}>
                {charCount} / {charLimit}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-4">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="draft">Save as Draft</option>
                  <option value="scheduled">Schedule</option>
                  <option value="published">Publish Now</option>
                </select>
                {isOverLimit && (
                  <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Character limit exceeded
                  </span>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !content || isOverLimit}
                className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {status === 'published' ? 'Post' : 'Save'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Preview</h3>
            <XPostPreview content={content} imageUrl={imageUrl} user={user} />
          </div>
        </div>

        {/* Right Column: AI Tools */}
        <div className="lg:col-span-4 space-y-6">
          {/* Text Generation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              AI Writer
            </h3>
            
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic or idea..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300">
                <input
                  type="checkbox"
                  checked={useSearch}
                  onChange={(e) => setUseSearch(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-blue-500 focus:ring-blue-500/50"
                />
                <Search className="w-3.5 h-3.5" />
                Google Search Grounding
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300">
                <input
                  type="checkbox"
                  checked={useHighThinking}
                  onChange={(e) => setUseHighThinking(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-blue-500 focus:ring-blue-500/50"
                />
                <Brain className="w-3.5 h-3.5" />
                High Thinking Mode
              </label>
            </div>

            <button
              onClick={handleGenerateText}
              disabled={generatingText || !topic}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-zinc-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {generatingText ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Draft'}
            </button>
          </div>

          {/* Image Generation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              AI Image
            </h3>
            
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Image prompt (optional, uses draft if empty)..."
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Size</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="512px">512px</option>
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="1:1">1:1</option>
                  <option value="2:3">2:3</option>
                  <option value="3:2">3:2</option>
                  <option value="3:4">3:4</option>
                  <option value="4:3">4:3</option>
                  <option value="9:16">9:16</option>
                  <option value="16:9">16:9</option>
                  <option value="21:9">21:9</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300">
              <input
                type="checkbox"
                checked={highQualityImage}
                onChange={(e) => setHighQualityImage(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-blue-500 focus:ring-blue-500/50"
              />
              Studio Quality (Pro Model)
            </label>

            <button
              onClick={handleGenerateImage}
              disabled={generatingImage || (!imagePrompt && !content)}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-zinc-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

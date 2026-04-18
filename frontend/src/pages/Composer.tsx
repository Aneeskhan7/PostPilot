// frontend/src/pages/Composer.tsx
import { FC, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Instagram, Facebook, Linkedin, Send, Clock, Sparkles, Loader2, Wand2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MediaUploader from '../components/MediaUploader';
import PlatformPreview from '../components/PlatformPreview';
import { useCreatePost } from '../hooks/usePosts';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../hooks/useAuth';
import { generateCaption, improveCaption } from '../lib/api/ai';
import type { Platform } from '../types';

const PLATFORMS: { id: Platform; label: string; icon: FC<{ className?: string }> }[] = [
  { id: 'instagram', label: 'Instagram', icon: ({ className }) => <Instagram className={className} /> },
  { id: 'facebook',  label: 'Facebook',  icon: ({ className }) => <Facebook className={className} /> },
  { id: 'linkedin',  label: 'LinkedIn',  icon: ({ className }) => <Linkedin className={className} /> },
];

const schema = z.object({
  content: z.string().min(1, 'Content is required').max(2200, 'Too long for Instagram (max 2200)'),
  platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin'] as const)).min(1, 'Select at least one platform'),
  media_urls: z.array(z.string()).default([]),
  scheduled_at: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const Composer: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [previewPlatform, setPreviewPlatform] = useState<Platform>('instagram');
  const [serverError, setServerError] = useState('');

  const createPost = useCreatePost();
  const { data: accounts = [] } = useAccounts();
  const { getAccessToken } = useAuth();

  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'funny' | 'inspirational'>('casual');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [improveInstruction, setImproveInstruction] = useState('Make it more engaging');

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: '', platforms: [], media_urls: [], scheduled_at: '' },
  });

  const content    = watch('content');
  const mediaUrls  = watch('media_urls');
  const platforms  = watch('platforms');

  const togglePlatform = (p: Platform) => {
    const current = platforms ?? [];
    setValue(
      'platforms',
      current.includes(p) ? current.filter((x) => x !== p) : [...current, p],
      { shouldValidate: true }
    );
  };

  const handleGenerate = async () => {
    const token = getAccessToken();
    if (!token || !aiTopic.trim()) return;
    const platform = platforms?.[0] ?? 'instagram';
    setAiError('');
    setAiLoading(true);
    try {
      const caption = await generateCaption(token, { topic: aiTopic, platform, tone: aiTone, includeHashtags: true });
      setValue('content', caption, { shouldValidate: true });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleImprove = async () => {
    const token = getAccessToken();
    if (!token || !content.trim()) return;
    const platform = platforms?.[0] ?? 'instagram';
    setAiError('');
    setAiLoading(true);
    try {
      const caption = await improveCaption(token, { caption: content, platform, instruction: improveInstruction });
      setValue('content', caption, { shouldValidate: true });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Improvement failed');
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: FormData, publish: boolean) => {
    setServerError('');
    try {
      await createPost.mutateAsync({
        content: data.content,
        platforms: data.platforms,
        media_urls: data.media_urls,
        scheduled_at: !publish && data.scheduled_at ? data.scheduled_at : undefined,
      });
      navigate('/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create post');
    }
  };

  const previewAccount = accounts.find((a: { platform: string; is_active: boolean }) => a.platform === previewPlatform && a.is_active);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <div className="flex-1 ml-60 flex">
        {/* Editor panel */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white mb-1">
              {editId ? 'Edit Post' : 'New Post'}
            </h1>
            <p className="text-sm text-zinc-400 mb-8">Craft your content and schedule it across platforms</p>

            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">

              {/* Platform selector */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Platforms</label>
                <div className="flex gap-3">
                  {PLATFORMS.map(({ id, label, icon: Icon }) => {
                    const selected = platforms?.includes(id);
                    const connected = accounts.some((a: { platform: string; is_active: boolean }) => a.platform === id && a.is_active);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => togglePlatform(id)}
                        disabled={!connected}
                        title={!connected ? `Connect ${label} in Settings` : label}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          selected
                            ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                            : connected
                            ? 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                            : 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
                {errors.platforms && <p className="mt-1.5 text-xs text-red-400">{errors.platforms.message}</p>}
              </div>

              {/* AI Generator */}
              <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">AI Caption Generator</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Describe your post topic…"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
                  />
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition [color-scheme:dark]"
                  >
                    <option value="casual">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="funny">Funny</option>
                    <option value="inspirational">Inspirational</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={aiLoading || !aiTopic.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Generate
                  </button>

                  {content.trim() && (
                    <>
                      <input
                        type="text"
                        placeholder="Improve instruction…"
                        value={improveInstruction}
                        onChange={(e) => setImproveInstruction(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
                      />
                      <button
                        type="button"
                        onClick={handleImprove}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Improve
                      </button>
                    </>
                  )}
                </div>

                {aiError && <p className="text-xs text-red-400">{aiError}</p>}
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-zinc-300 mb-2">Caption</label>
                <textarea
                  id="content"
                  rows={6}
                  placeholder="Write your caption…"
                  {...register('content')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                />
                <div className="flex items-center justify-between mt-1.5">
                  {errors.content
                    ? <p className="text-xs text-red-400">{errors.content.message}</p>
                    : <span />}
                  <span className="text-xs text-zinc-500">{content.length} / 2200</span>
                </div>
              </div>

              {/* Media */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Media</label>
                <Controller
                  name="media_urls"
                  control={control}
                  render={({ field }) => (
                    <MediaUploader
                      urls={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Schedule */}
              <div>
                <label htmlFor="scheduled_at" className="block text-sm font-medium text-zinc-300 mb-2">
                  Schedule (optional)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    id="scheduled_at"
                    type="datetime-local"
                    {...register('scheduled_at')}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition [color-scheme:dark]"
                  />
                </div>
              </div>

              {serverError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {serverError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSubmit((d) => onSubmit(d, false))}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmit((d) => onSubmit(d, true))}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-600/25"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Saving…' : 'Schedule / Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-80 border-l border-white/5 p-6 flex flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-sm font-medium text-zinc-300 mb-3">Preview</p>
            <div className="flex gap-2">
              {PLATFORMS.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPreviewPlatform(id)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                    previewPlatform === id
                      ? 'bg-violet-600/20 text-violet-400'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                  aria-label={`Preview ${id}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <PlatformPreview
            platform={previewPlatform}
            content={content}
            mediaUrls={mediaUrls}
            username={previewAccount?.platform_username ?? ''}
            avatarUrl={previewAccount?.platform_avatar_url}
          />
        </div>
      </div>
    </div>
  );
};

export default Composer;

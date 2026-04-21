// frontend/src/pages/Calendar.tsx
import { FC, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { usePosts } from '../hooks/usePosts';
import type { Post } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const STATUS_DOT: Record<string, string> = {
  scheduled:  'bg-violet-400',
  published:  'bg-emerald-400',
  failed:     'bg-red-400',
  draft:      'bg-zinc-500',
  publishing: 'bg-amber-400',
  cancelled:  'bg-zinc-600',
};

const Calendar: FC = () => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: posts = [] } = usePosts();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);

  const postsByDate = (posts as Post[]).reduce<Record<string, Post[]>>((acc: Record<string, Post[]>, post: Post) => {
    const dateStr = post.scheduled_at ?? post.published_at ?? post.created_at;
    const key = new Date(dateStr).toLocaleDateString('en-CA');
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const selectedPosts = selectedDate ? (postsByDate[selectedDate] ?? []) : [];

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-60 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendar</h1>
            <p className="text-sm text-zinc-400 mt-0.5">View your scheduled and published posts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <div className="xl:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors" aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-semibold text-white">
                {MONTHS[viewMonth]} {viewYear}
              </h2>
              <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors" aria-label="Next month">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-zinc-500 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayPosts = postsByDate[dateKey] ?? [];
                const isToday = viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
                const isSelected = selectedDate === dateKey;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                    className={`relative h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm transition-all border ${
                      isSelected
                        ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                        : isToday
                        ? 'bg-white/10 border-white/20 text-white font-semibold'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs leading-none">{day}</span>
                    {dayPosts.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap justify-center mt-1 px-1">
                        {dayPosts.slice(0, 3).map((p: Post) => (
                          <div key={p.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status] ?? 'bg-zinc-500'}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day posts */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              {selectedDate
                ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a day'}
            </h3>
            {selectedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500">
                  {selectedDate ? 'No posts on this day' : 'Click a day to see posts'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(selectedPosts as Post[]).map((post: Post) => (
                  <div key={post.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${STATUS_DOT[post.status]}`} />
                      <span className="text-xs text-zinc-400 capitalize">{post.status}</span>
                      <span className="text-xs text-zinc-500 ml-auto">
                        {(post.scheduled_at ?? post.published_at ?? '').slice(11, 16)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 line-clamp-2">{post.content}</p>
                    <div className="flex gap-1 mt-1.5">
                      {post.platforms.map((p: string) => (
                        <span key={p} className="text-xs text-zinc-500 capitalize">{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;

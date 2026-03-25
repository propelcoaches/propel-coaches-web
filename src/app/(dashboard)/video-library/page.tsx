'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ExerciseVideo {
  id: string;
  exercise_name: string;
  muscle_group: string;
  category: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  description: string | null;
  form_cues: string[];
  common_mistakes: string[];
  is_public: boolean;
  view_count: number;
  created_at: string;
}

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body',
];

const CATEGORIES = ['strength', 'cardio', 'mobility', 'warm-up', 'cool-down'];

export default function VideoLibraryPage() {
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videos, setVideos] = useState<ExerciseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ExerciseVideo | null>(null);
  const [filterMuscle, setFilterMuscle] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    exercise_name: '',
    muscle_group: 'Chest',
    category: 'strength',
    description: '',
    form_cues: [''],
    common_mistakes: [''],
    is_public: false,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exercise_videos')
      .select('*')
      .order('exercise_name');
    if (data) setVideos(data as ExerciseVideo[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleUpload = async () => {
    if (!videoFile || !form.exercise_name.trim()) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload video
      const fileName = `exercise-library/${user.id}/${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile, { contentType: videoFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);

      // Create record
      const { data, error } = await supabase.from('exercise_videos').insert({
        coach_id: user.id,
        exercise_name: form.exercise_name.trim(),
        muscle_group: form.muscle_group,
        category: form.category,
        video_url: publicUrl,
        video_storage_path: fileName,
        description: form.description.trim() || null,
        form_cues: form.form_cues.filter((c) => c.trim()),
        common_mistakes: form.common_mistakes.filter((m) => m.trim()),
        is_public: form.is_public,
      }).select().single();

      if (error) throw error;
      if (data) setVideos((prev) => [data, ...prev]);

      setShowUpload(false);
      setVideoFile(null);
      setForm({ exercise_name: '', muscle_group: 'Chest', category: 'strength', description: '', form_cues: [''], common_mistakes: [''], is_public: false });
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await supabase.from('exercise_videos').delete().eq('id', id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    if (selectedVideo?.id === id) setSelectedVideo(null);
  };

  const addFormCue = () => setForm({ ...form, form_cues: [...form.form_cues, ''] });
  const addMistake = () => setForm({ ...form, common_mistakes: [...form.common_mistakes, ''] });
  const updateCue = (i: number, val: string) => {
    const cues = [...form.form_cues];
    cues[i] = val;
    setForm({ ...form, form_cues: cues });
  };
  const updateMistake = (i: number, val: string) => {
    const m = [...form.common_mistakes];
    m[i] = val;
    setForm({ ...form, common_mistakes: m });
  };

  const filtered = videos.filter((v) => {
    if (filterMuscle !== 'all' && v.muscle_group !== filterMuscle) return false;
    if (filterCategory !== 'all' && v.category !== filterCategory) return false;
    if (search && !v.exercise_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ─── Upload Form ──────────────────────────────────────────────────
  if (showUpload) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upload Exercise Video</h1>
          <button onClick={() => setShowUpload(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
        </div>

        <div className="space-y-4 bg-white rounded-xl shadow-sm border p-6">
          {/* Video file */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
            <input ref={fileInputRef} type="file" accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Exercise name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name</label>
            <input type="text" value={form.exercise_name} onChange={(e) => setForm({ ...form, exercise_name: e.target.value })}
              placeholder="e.g. Barbell Back Squat" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Group</label>
              <select value={form.muscle_group} onChange={(e) => setForm({ ...form, muscle_group: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="Brief description of the exercise" className="w-full border rounded-lg px-3 py-2" />
          </div>

          {/* Form cues */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Cues</label>
            {form.form_cues.map((cue, i) => (
              <input key={i} type="text" value={cue} onChange={(e) => updateCue(i, e.target.value)}
                placeholder={`Cue ${i + 1}`} className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
            ))}
            <button onClick={addFormCue} className="text-sm text-indigo-600 hover:text-indigo-700">+ Add Cue</button>
          </div>

          {/* Common mistakes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Common Mistakes</label>
            {form.common_mistakes.map((m, i) => (
              <input key={i} type="text" value={m} onChange={(e) => updateMistake(i, e.target.value)}
                placeholder={`Mistake ${i + 1}`} className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
            ))}
            <button onClick={addMistake} className="text-sm text-indigo-600 hover:text-indigo-700">+ Add Mistake</button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="rounded" />
            <span className="text-gray-700">Make public (visible to other coaches)</span>
          </label>

          <button onClick={handleUpload} disabled={uploading || !videoFile || !form.exercise_name.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Video Detail ─────────────────────────────────────────────────
  if (selectedVideo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => setSelectedVideo(null)} className="text-indigo-600 hover:text-indigo-700 text-sm mb-4">← Back to library</button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              <video src={selectedVideo.video_url} controls className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedVideo.exercise_name}</h1>
              <div className="flex gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{selectedVideo.muscle_group}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">{selectedVideo.category}</span>
                {selectedVideo.is_public && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Public</span>}
              </div>
            </div>

            {selectedVideo.description && (
              <p className="text-gray-600 text-sm">{selectedVideo.description}</p>
            )}

            {selectedVideo.form_cues.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2">Form Cues</h3>
                {selectedVideo.form_cues.map((cue, i) => (
                  <p key={i} className="text-sm text-green-700 mb-1">✓ {cue}</p>
                ))}
              </div>
            )}

            {selectedVideo.common_mistakes.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2">Common Mistakes</h3>
                {selectedVideo.common_mistakes.map((m, i) => (
                  <p key={i} className="text-sm text-red-700 mb-1">✗ {m}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => deleteVideo(selectedVideo.id)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Delete</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Library Grid ─────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exercise Video Library</h1>
          <p className="text-gray-500 text-sm mt-1">Attach form-cue videos to exercises in your programs</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          + Upload Video
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..." className="border rounded-lg px-3 py-2 text-sm w-64" />
        <select value={filterMuscle} onChange={(e) => setFilterMuscle(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Muscles</option>
          {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <div className="text-4xl mb-3">🎬</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No videos yet</h3>
          <p className="text-gray-500 mb-4">Upload exercise demo videos for your clients.</p>
          <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Upload First Video</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((vid) => (
            <div key={vid.id} onClick={() => setSelectedVideo(vid)}
              className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-video bg-gray-200 relative">
                {vid.thumbnail_url ? (
                  <img src={vid.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">▶</div>
                )}
                {vid.duration_seconds && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {Math.floor(vid.duration_seconds / 60)}:{(vid.duration_seconds % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm truncate">{vid.exercise_name}</h3>
                <div className="flex gap-1 mt-1">
                  <span className="text-xs text-gray-500">{vid.muscle_group}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-500 capitalize">{vid.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

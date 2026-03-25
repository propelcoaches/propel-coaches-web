'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BrandingConfig {
  id?: string;
  brand_name: string;
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  accent_color: string;
  accent_color_dark: string;
  secondary_color: string;
  custom_domain: string;
  domain_verified: boolean;
  email_from_name: string;
  email_footer_text: string;
  welcome_message: string;
  onboarding_video_url: string;
  show_meal_plans: boolean;
  show_habit_tracker: boolean;
  show_water_tracker: boolean;
  show_body_measurements: boolean;
  show_progress_photos: boolean;
  show_leaderboard: boolean;
  plan: string;
}

const DEFAULTS: BrandingConfig = {
  brand_name: '',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  accent_color: '#4f46e5',
  accent_color_dark: '#818cf8',
  secondary_color: '#7c3aed',
  custom_domain: '',
  domain_verified: false,
  email_from_name: '',
  email_footer_text: '',
  welcome_message: '',
  onboarding_video_url: '',
  show_meal_plans: true,
  show_habit_tracker: true,
  show_water_tracker: true,
  show_body_measurements: true,
  show_progress_photos: true,
  show_leaderboard: true,
  plan: 'free',
};

const PRESET_COLORS = [
  '#4f46e5', '#7c3aed', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#1e293b', '#0f172a',
];

export default function BrandingPage() {
  const supabase = createClient();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<BrandingConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchBranding = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('coach_branding').select('*').single();
    if (data) setConfig({ ...DEFAULTS, ...data });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchBranding(); }, [fetchBranding]);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      coach_id: user.id,
      brand_name: config.brand_name || null,
      logo_url: config.logo_url || null,
      logo_dark_url: config.logo_dark_url || null,
      favicon_url: config.favicon_url || null,
      accent_color: config.accent_color,
      accent_color_dark: config.accent_color_dark || null,
      secondary_color: config.secondary_color || null,
      custom_domain: config.custom_domain || null,
      email_from_name: config.email_from_name || null,
      email_footer_text: config.email_footer_text || null,
      welcome_message: config.welcome_message || null,
      onboarding_video_url: config.onboarding_video_url || null,
      show_meal_plans: config.show_meal_plans,
      show_habit_tracker: config.show_habit_tracker,
      show_water_tracker: config.show_water_tracker,
      show_body_measurements: config.show_body_measurements,
      show_progress_photos: config.show_progress_photos,
      show_leaderboard: config.show_leaderboard,
      updated_at: new Date().toISOString(),
    };

    if (config.id) {
      await supabase.from('coach_branding').update(payload).eq('id', config.id);
    } else {
      const { data } = await supabase.from('coach_branding').insert(payload).select().single();
      if (data) setConfig((prev) => ({ ...prev, id: data.id }));
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadLogo = async (file: File, type: 'logo' | 'logo_dark' | 'favicon') => {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `branding/${user.id}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('branding').upload(path, file);
    if (error) { alert('Upload failed'); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(path);

    if (type === 'logo') setConfig((c) => ({ ...c, logo_url: publicUrl }));
    else if (type === 'logo_dark') setConfig((c) => ({ ...c, logo_dark_url: publicUrl }));
    else setConfig((c) => ({ ...c, favicon_url: publicUrl }));

    setUploading(false);
  };

  const isElite = config.plan === 'elite';

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">White-Label Branding</h1>
          <p className="text-gray-500 text-sm mt-1">Customize how Propel looks to your clients</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Brand Identity */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Brand Identity</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <input type="text" value={config.brand_name} onChange={(e) => setConfig({ ...config, brand_name: e.target.value })}
                placeholder="e.g. Elite Performance Coaching" className="w-full border rounded-lg px-3 py-2" />
              <p className="text-xs text-gray-400 mt-1">Shown in place of "Propel" throughout the app</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Light)</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {config.logo_url ? (
                    <img src={config.logo_url} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
                  ) : (
                    <div className="text-gray-400 text-sm mb-2">No logo</div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={logoInputRef}
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], 'logo')} />
                  <button onClick={() => logoInputRef.current?.click()}
                    className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Dark)</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-900">
                  {config.logo_dark_url ? (
                    <img src={config.logo_dark_url} alt="Dark Logo" className="h-12 mx-auto mb-2 object-contain" />
                  ) : (
                    <div className="text-gray-500 text-sm mb-2">No logo</div>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], 'logo_dark')} />
                  <button className="text-indigo-400 text-sm font-medium">Upload</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {config.favicon_url ? (
                    <img src={config.favicon_url} alt="Favicon" className="h-8 w-8 mx-auto mb-2" />
                  ) : (
                    <div className="text-gray-400 text-sm mb-2">No favicon</div>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], 'favicon')} />
                  <button className="text-indigo-600 text-sm font-medium">Upload</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Colors</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div className="flex items-center gap-3 mb-2">
                <input type="color" value={config.accent_color} onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0" />
                <input type="text" value={config.accent_color} onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                  className="border rounded-lg px-3 py-1.5 text-sm w-28 font-mono" />
              </div>
              <div className="flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setConfig({ ...config, accent_color: c })}
                    className={`w-7 h-7 rounded-full border-2 ${config.accent_color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={config.secondary_color} onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0" />
                <input type="text" value={config.secondary_color} onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                  className="border rounded-lg px-3 py-1.5 text-sm w-28 font-mono" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="rounded-lg border overflow-hidden">
              <div className="h-12 flex items-center px-4" style={{ backgroundColor: config.accent_color }}>
                {config.logo_url ? (
                  <img src={config.logo_url} alt="" className="h-7 object-contain" />
                ) : (
                  <span className="text-white font-bold text-lg">{config.brand_name || 'Propel'}</span>
                )}
              </div>
              <div className="p-4 bg-gray-50">
                <button className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: config.accent_color }}>
                  Primary Button
                </button>
                <button className="px-4 py-2 text-white rounded-lg text-sm font-medium ml-2" style={{ backgroundColor: config.secondary_color }}>
                  Secondary Button
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Domain */}
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-900">Custom Domain</h2>
            {!isElite && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">Elite Plan</span>}
          </div>
          <div className="flex items-center gap-3">
            <input type="text" value={config.custom_domain}
              onChange={(e) => setConfig({ ...config, custom_domain: e.target.value })}
              placeholder="app.yourcoaching.com"
              disabled={!isElite}
              className="flex-1 border rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-400" />
            {config.domain_verified ? (
              <span className="text-green-600 text-sm font-medium">Verified ✓</span>
            ) : config.custom_domain ? (
              <span className="text-amber-600 text-sm font-medium">Pending verification</span>
            ) : null}
          </div>
          {!isElite && (
            <p className="text-sm text-gray-400 mt-2">Upgrade to the Elite plan to use a custom domain.</p>
          )}
        </section>

        {/* Email Branding */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Email Branding</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
              <input type="text" value={config.email_from_name} onChange={(e) => setConfig({ ...config, email_from_name: e.target.value })}
                placeholder="e.g. John's Coaching" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
              <input type="text" value={config.email_footer_text} onChange={(e) => setConfig({ ...config, email_footer_text: e.target.value })}
                placeholder="e.g. © 2026 Elite Performance" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
        </section>

        {/* Onboarding */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Client Onboarding</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
            <textarea value={config.welcome_message} onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
              rows={3} placeholder="Shown to new clients after signup..." className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Video URL</label>
            <input type="text" value={config.onboarding_video_url} onChange={(e) => setConfig({ ...config, onboarding_video_url: e.target.value })}
              placeholder="https://www.loom.com/share/..." className="w-full border rounded-lg px-3 py-2" />
          </div>
        </section>

        {/* Feature Toggles */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Feature Visibility</h2>
          <p className="text-sm text-gray-500 mb-4">Hide features your clients don't need.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'show_meal_plans', label: 'Meal Plans' },
              { key: 'show_habit_tracker', label: 'Habit Tracker' },
              { key: 'show_water_tracker', label: 'Water Tracker' },
              { key: 'show_body_measurements', label: 'Body Measurements' },
              { key: 'show_progress_photos', label: 'Progress Photos' },
              { key: 'show_leaderboard', label: 'Leaderboard' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={(config as any)[key]}
                  onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                  className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

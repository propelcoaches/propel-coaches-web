'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { Upload, Globe, Mail, Play, LayoutGrid, CheckCircle2, Dumbbell, UtensilsCrossed, ClipboardCheck, Activity, Droplets, TrendingUp, Home, MessageSquare } from 'lucide-react';

interface BrandingConfig {
  id?: string;
  brand_name: string;
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  accent_color: string;
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
  accent_color: '#0F7B8C',
  secondary_color: '#1A95A8',
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
  { hex: '#0F7B8C', name: 'Teal' },
  { hex: '#4f46e5', name: 'Indigo' },
  { hex: '#7c3aed', name: 'Violet' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#22c55e', name: 'Green' },
  { hex: '#14b8a6', name: 'Teal-Green' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#1e293b', name: 'Slate' },
  { hex: '#1a1a2e', name: 'Dark Navy' },
];

// Hex to rgba helper for generating tints
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Lighten a hex color by mixing with white
function lightenColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * 0.85);
  const lg = Math.round(g + (255 - g) * 0.85);
  const lb = Math.round(b + (255 - b) * 0.85);
  return `rgb(${lr},${lg},${lb})`;
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-cb-secondary mb-2">{label}</label>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-cb-border shadow-sm flex-shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          />
          <div className="w-full h-full" style={{ backgroundColor: value }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
          className="w-28 px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm font-mono text-cb-text focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map(({ hex, name }) => (
          <button
            key={hex}
            title={name}
            onClick={() => onChange(hex)}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${value === hex ? 'border-cb-text scale-110' : 'border-transparent'}`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </div>
  );
}

// Live preview: a scaled-down mock of the client app UI
function ClientAppPreview({ config }: { config: BrandingConfig }) {
  const { accent_color, brand_name, logo_url } = config;
  const brandBg = lightenColor(accent_color);

  const navItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Dumbbell, label: 'Workout' },
    { icon: UtensilsCrossed, label: 'Nutrition' },
    { icon: ClipboardCheck, label: 'Check-in' },
    { icon: TrendingUp, label: 'Progress' },
    { icon: MessageSquare, label: 'Messages' },
  ];

  return (
    <div className="bg-surface-light border border-cb-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-cb-border flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-3 py-0.5 bg-white border border-cb-border rounded text-xs text-cb-muted font-mono">
            app.propelcoach.app
          </div>
        </div>
      </div>

      {/* Scaled client app */}
      <div className="relative overflow-hidden" style={{ height: 420 }}>
        <div
          className="absolute origin-top-left"
          style={{ transform: 'scale(0.65)', width: `${100 / 0.65}%`, transformOrigin: 'top center' }}
        >
          {/* Nav bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white" style={{ minHeight: 56 }}>
            <div className="flex items-center gap-2">
              {logo_url ? (
                <img src={logo_url} alt="" className="h-8 object-contain max-w-[120px]" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: accent_color }}>
                    {(brand_name || 'P')[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{brand_name || 'Propel'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">JC</span>
              </div>
            </div>
          </div>

          {/* Side nav + content */}
          <div className="flex bg-gray-50" style={{ minHeight: 520 }}>
            {/* Sidebar */}
            <div className="w-52 bg-white border-r border-gray-200 flex-shrink-0 pt-4">
              {navItems.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5 text-sm ${active ? 'font-medium' : 'text-gray-500'}`}
                  style={active ? { backgroundColor: hexToRgba(accent_color, 0.1), color: accent_color } : {}}
                >
                  <Icon size={16} style={active ? { color: accent_color } : { color: '#94a3b8' }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-6">
              {/* Greeting */}
              <div className="mb-5">
                <p className="text-xs text-gray-500">Good morning 👋</p>
                <h2 className="text-lg font-bold text-gray-900">Jamie Carter</h2>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Workouts', value: '4', sub: 'this week' },
                  { label: 'Streak', value: '12', sub: 'days' },
                  { label: 'Check-in', value: '✓', sub: 'submitted' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold mb-0.5" style={{ color: accent_color }}>{value}</div>
                    <div className="text-xs font-medium text-gray-700">{label}</div>
                    <div className="text-xs text-gray-400">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Today's workout card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Today</p>
                    <h3 className="font-semibold text-gray-900">Upper Body Strength</h3>
                  </div>
                  <Dumbbell size={18} style={{ color: accent_color }} />
                </div>
                <div className="flex gap-3">
                  <div className="text-xs bg-gray-50 rounded-lg px-3 py-1.5 text-gray-600">6 exercises</div>
                  <div className="text-xs bg-gray-50 rounded-lg px-3 py-1.5 text-gray-600">~45 min</div>
                </div>
                <button
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: accent_color }}
                >
                  Start Workout
                </button>
              </div>

              {/* Nutrition quick view */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Today's Nutrition</h3>
                  <UtensilsCrossed size={16} style={{ color: accent_color }} />
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Calories', current: 1450, target: 2200 },
                    { label: 'Protein', current: 142, target: 180 },
                  ].map(({ label, current, target }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{label}</span>
                        <span>{current} / {target}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (current / target) * 100)}%`, backgroundColor: accent_color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadZone({
  label, hint, url, type, onUpload, uploading,
}: {
  label: string;
  hint: string;
  url: string;
  type: 'logo' | 'logo_dark' | 'favicon';
  onUpload: (file: File, type: 'logo' | 'logo_dark' | 'favicon') => void;
  uploading: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const dark = type === 'logo_dark';
  return (
    <div>
      <label className="block text-xs font-medium text-cb-secondary mb-1.5">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors hover:border-brand ${dark ? 'bg-gray-900 border-gray-700 hover:border-brand' : 'border-cb-border hover:bg-surface-light'}`}
      >
        {url ? (
          <img src={url} alt={label} className={`h-10 mx-auto mb-2 object-contain ${dark ? '' : ''}`} />
        ) : (
          <Upload size={20} className={`mx-auto mb-2 ${dark ? 'text-gray-500' : 'text-cb-muted'}`} />
        )}
        <p className={`text-xs ${dark ? 'text-gray-400' : 'text-cb-muted'}`}>{uploading ? 'Uploading…' : hint}</p>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], type)}
        />
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-cb-border rounded-xl p-6">
      <h2 className="text-sm font-semibold text-cb-text mb-5">{title}</h2>
      {children}
    </div>
  );
}

export default function BrandingPage() {
  const supabase = useMemo(() => createClient(), []);

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

  const set = (patch: Partial<BrandingConfig>) => setConfig((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      coach_id: user.id,
      brand_name: config.brand_name || null,
      logo_url: config.logo_url || null,
      logo_dark_url: config.logo_dark_url || null,
      favicon_url: config.favicon_url || null,
      accent_color: config.accent_color,
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
      if (data) set({ id: data.id });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadLogo = async (file: File, type: 'logo' | 'logo_dark' | 'favicon') => {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const path = `branding/${user.id}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('branding').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(path);

    if (type === 'logo') set({ logo_url: publicUrl });
    else if (type === 'logo_dark') set({ logo_dark_url: publicUrl });
    else set({ favicon_url: publicUrl });

    setUploading(false);
  };

  const isElite = config.plan === 'elite';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-cb-border border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-cb-text">White-Label Branding</h1>
          <p className="text-sm text-cb-muted mt-1">Customize how your clients experience the app</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle2 size={15} />
              Saved
            </div>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Settings column */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Brand Identity */}
          <SectionCard title="Brand Identity">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-cb-secondary mb-1.5">Brand Name</label>
                <input
                  type="text"
                  value={config.brand_name}
                  onChange={(e) => set({ brand_name: e.target.value })}
                  placeholder="e.g. Elite Performance Coaching"
                  className="w-full px-3 py-2.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <p className="text-xs text-cb-muted mt-1.5">Replaces "Propel" throughout the client app</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <UploadZone label="Logo (Light)" hint="PNG or SVG, transparent bg" url={config.logo_url} type="logo" onUpload={uploadLogo} uploading={uploading} />
                <UploadZone label="Logo (Dark)" hint="For dark mode" url={config.logo_dark_url} type="logo_dark" onUpload={uploadLogo} uploading={uploading} />
                <UploadZone label="Favicon" hint="32×32px .ico or PNG" url={config.favicon_url} type="favicon" onUpload={uploadLogo} uploading={uploading} />
              </div>
            </div>
          </SectionCard>

          {/* Colors */}
          <SectionCard title="Colors">
            <div className="grid grid-cols-2 gap-6">
              <ColorPicker label="Primary Color" value={config.accent_color} onChange={(v) => set({ accent_color: v })} />
              <ColorPicker label="Secondary Color" value={config.secondary_color} onChange={(v) => set({ secondary_color: v })} />
            </div>
          </SectionCard>

          {/* Custom Domain */}
          <SectionCard title="Custom Domain">
            <div className="flex items-center gap-2 mb-4">
              {!isElite && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">Elite Plan</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center flex-1 gap-2 px-3 py-2.5 bg-surface-light border border-cb-border rounded-lg">
                <Globe size={15} className="text-cb-muted flex-shrink-0" />
                <input
                  type="text"
                  value={config.custom_domain}
                  onChange={(e) => set({ custom_domain: e.target.value })}
                  placeholder="app.yourcoaching.com"
                  disabled={!isElite}
                  className="flex-1 bg-transparent text-sm text-cb-text placeholder-cb-muted focus:outline-none disabled:opacity-50"
                />
              </div>
              {config.domain_verified ? (
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                  <CheckCircle2 size={14} /> Verified
                </span>
              ) : config.custom_domain ? (
                <span className="text-amber-500 text-sm font-medium whitespace-nowrap">Pending</span>
              ) : null}
            </div>
            {!isElite && (
              <p className="text-xs text-cb-muted mt-2">Upgrade to Elite to use a custom domain for your client portal.</p>
            )}
          </SectionCard>

          {/* Email Branding */}
          <SectionCard title="Email Branding">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-cb-secondary mb-1.5">
                  <span className="flex items-center gap-1.5"><Mail size={12} />From Name</span>
                </label>
                <input
                  type="text"
                  value={config.email_from_name}
                  onChange={(e) => set({ email_from_name: e.target.value })}
                  placeholder="e.g. John's Coaching"
                  className="w-full px-3 py-2.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cb-secondary mb-1.5">Footer Text</label>
                <input
                  type="text"
                  value={config.email_footer_text}
                  onChange={(e) => set({ email_footer_text: e.target.value })}
                  placeholder="© 2026 Elite Performance Coaching"
                  className="w-full px-3 py-2.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          </SectionCard>

          {/* Client Onboarding */}
          <SectionCard title="Client Onboarding">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cb-secondary mb-1.5">Welcome Message</label>
                <textarea
                  value={config.welcome_message}
                  onChange={(e) => set({ welcome_message: e.target.value })}
                  rows={3}
                  placeholder="Shown to new clients after they first log in…"
                  className="w-full px-3 py-2.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cb-secondary mb-1.5">
                  <span className="flex items-center gap-1.5"><Play size={12} />Onboarding Video URL</span>
                </label>
                <input
                  type="text"
                  value={config.onboarding_video_url}
                  onChange={(e) => set({ onboarding_video_url: e.target.value })}
                  placeholder="https://www.loom.com/share/..."
                  className="w-full px-3 py-2.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          </SectionCard>

          {/* Feature Visibility */}
          <SectionCard title="Feature Visibility">
            <p className="text-xs text-cb-muted mb-4">Hide sections your clients don't need.</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'show_meal_plans', label: 'Meal Plans', icon: UtensilsCrossed },
                { key: 'show_habit_tracker', label: 'Habit Tracker', icon: Activity },
                { key: 'show_water_tracker', label: 'Water Tracker', icon: Droplets },
                { key: 'show_body_measurements', label: 'Body Measurements', icon: TrendingUp },
                { key: 'show_progress_photos', label: 'Progress Photos', icon: LayoutGrid },
                { key: 'show_leaderboard', label: 'Leaderboard', icon: CheckCircle2 },
              ] as { key: keyof BrandingConfig; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-cb-border hover:bg-surface-light cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={config[key] as boolean}
                    onChange={(e) => set({ [key]: e.target.checked })}
                    className="rounded border-cb-border accent-brand w-4 h-4 flex-shrink-0"
                  />
                  <Icon size={14} className="text-cb-muted flex-shrink-0" />
                  <span className="text-sm text-cb-text">{label}</span>
                </label>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Live Preview column */}
        <div className="w-[480px] flex-shrink-0">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs font-medium text-cb-secondary uppercase tracking-wide">Live Preview — Client View</p>
            </div>
            <ClientAppPreview config={config} />
            <p className="text-xs text-cb-muted text-center mt-3">This is how your clients will see the app after you save</p>
          </div>
        </div>
      </div>
    </div>
  );
}

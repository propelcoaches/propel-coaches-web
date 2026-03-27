'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { Upload, Globe, Mail, Dumbbell, UtensilsCrossed, ClipboardCheck, TrendingUp, Home, CheckCircle2, Moon, Sun } from 'lucide-react';

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

// Live preview: phone mockup of the client mobile app
function ClientAppPreview({ config, darkMode }: { config: BrandingConfig; darkMode: boolean }) {
  const { accent_color, brand_name, logo_url, logo_dark_url } = config;

  const bg       = darkMode ? '#0f172a' : '#f8fafc';
  const card     = darkMode ? '#1e293b' : '#ffffff';
  const border   = darkMode ? '#334155' : '#e2e8f0';
  const text     = darkMode ? '#ffffff' : '#0f172a';
  const subText  = darkMode ? '#94a3b8' : '#64748b';
  const badge    = darkMode ? '#334155' : '#f1f5f9';
  const badgeTxt = darkMode ? '#cbd5e1' : '#475569';
  const track    = darkMode ? '#334155' : '#e2e8f0';
  const notch    = darkMode ? '#111827' : '#e2e8f0';
  const avatar   = darkMode ? '#334155' : '#e2e8f0';
  const avatarTxt = darkMode ? '#94a3b8' : '#64748b';
  const inactive = darkMode ? '#64748b' : '#94a3b8';
  const indicator = darkMode ? '#475569' : '#cbd5e1';
  const logoToUse = darkMode ? (logo_dark_url || logo_url) : (logo_url || logo_dark_url);

  const tabItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Dumbbell, label: 'Workout' },
    { icon: UtensilsCrossed, label: 'Nutrition' },
    { icon: ClipboardCheck, label: 'Check-in' },
    { icon: TrendingUp, label: 'Progress' },
  ];

  return (
    /* Phone outer shell */
    <div className="mx-auto" style={{ width: 260 }}>
      <div
        className="relative rounded-[40px] overflow-hidden shadow-2xl border-[6px] border-gray-800"
        style={{ background: bg }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1" style={{ background: bg }}>
          <span className="text-[9px] font-semibold" style={{ color: text }}>9:41</span>
          <div className="w-16 h-4 rounded-full" style={{ background: notch }} />
          <div className="flex gap-1 items-center">
            <div className="flex gap-0.5">
              {[3, 4, 5].map((h) => (
                <div key={h} className="w-0.5 rounded-sm" style={{ height: h, background: text }} />
              ))}
            </div>
            <div className="w-3 h-1.5 rounded-sm ml-0.5" style={{ border: `1px solid ${text}` }}>
              <div className="h-full w-2/3 rounded-sm" style={{ background: text }} />
            </div>
          </div>
        </div>

        {/* App content */}
        <div style={{ background: bg, minHeight: 480 }}>
          {/* App header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {logoToUse ? (
                <img src={logoToUse} alt="" className="h-6 object-contain max-w-[80px]" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: accent_color }}
                  >
                    {(brand_name || 'P')[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: text }}>{brand_name || 'Propel'}</span>
                </div>
              )}
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: avatar }}>
              <span className="text-[9px] font-medium" style={{ color: avatarTxt }}>JC</span>
            </div>
          </div>

          {/* Greeting */}
          <div className="px-4 pb-3">
            <p className="text-[10px]" style={{ color: subText }}>Good morning 👋</p>
            <p className="text-sm font-bold" style={{ color: text }}>Jamie Carter</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 px-4 mb-3">
            {[
              { label: 'Workouts', value: '4', sub: 'this week' },
              { label: 'Streak', value: '12', sub: 'days' },
              { label: 'Check-in', value: '✓', sub: 'done' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: card }}>
                <div className="text-base font-bold" style={{ color: accent_color }}>{value}</div>
                <div className="text-[8px] font-medium leading-tight" style={{ color: subText }}>{label}</div>
                <div className="text-[7px]" style={{ color: inactive }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Today's workout card */}
          <div className="mx-4 rounded-xl p-3 mb-3" style={{ background: card }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[8px] uppercase tracking-wide font-medium" style={{ color: subText }}>Today</p>
                <p className="text-xs font-semibold" style={{ color: text }}>Upper Body Strength</p>
              </div>
              <Dumbbell size={13} style={{ color: accent_color }} />
            </div>
            <div className="flex gap-1.5 mb-2">
              <span className="text-[8px] rounded px-2 py-1" style={{ background: badge, color: badgeTxt }}>6 exercises</span>
              <span className="text-[8px] rounded px-2 py-1" style={{ background: badge, color: badgeTxt }}>~45 min</span>
            </div>
            <button
              className="w-full py-1.5 rounded-lg text-[9px] font-semibold text-white"
              style={{ backgroundColor: accent_color }}
            >
              Start Workout
            </button>
          </div>

          {/* Nutrition bar */}
          <div className="mx-4 rounded-xl p-3" style={{ background: card }}>
            <p className="text-[10px] font-semibold mb-2" style={{ color: text }}>Today's Nutrition</p>
            {[
              { label: 'Calories', current: 1450, target: 2200 },
              { label: 'Protein', current: 142, target: 180 },
            ].map(({ label, current, target }) => (
              <div key={label} className="mb-1.5">
                <div className="flex justify-between text-[8px] mb-0.5" style={{ color: subText }}>
                  <span>{label}</span>
                  <span>{current}/{target}</span>
                </div>
                <div className="w-full rounded-full h-1" style={{ background: track }}>
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${Math.min(100, (current / target) * 100)}%`, backgroundColor: accent_color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tab bar */}
        <div
          className="flex items-center justify-around px-2 py-2 border-t"
          style={{ background: card, borderColor: border }}
        >
          {tabItems.map(({ icon: Icon, label, active }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-1">
              <Icon size={14} style={{ color: active ? accent_color : inactive }} />
              <span className="text-[7px] font-medium" style={{ color: active ? accent_color : inactive }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Home indicator bar */}
        <div className="flex justify-center pb-2 pt-1" style={{ background: card }}>
          <div className="w-20 h-1 rounded-full" style={{ background: indicator }} />
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
  const [previewDark, setPreviewDark] = useState(true);

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

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-amber-500 mt-0.5">💡</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Client Onboarding & Feature Visibility</p>
              <p className="text-xs text-amber-700 mt-1">These settings are now managed per-client. Open a client's profile and go to the <strong>Settings</strong> tab to customise their welcome message, onboarding video, and which app sections they can see.</p>
            </div>
          </div>
        </div>

        {/* Live Preview column */}
        <div className="w-[480px] flex-shrink-0">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs font-medium text-cb-secondary uppercase tracking-wide">Live Preview — Client View</p>
              </div>
              <button
                onClick={() => setPreviewDark((d) => !d)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cb-border bg-surface-light hover:bg-cb-border transition-colors text-xs font-medium text-cb-secondary"
              >
                {previewDark ? <Sun size={12} /> : <Moon size={12} />}
                {previewDark ? 'Light' : 'Dark'}
              </button>
            </div>
            <ClientAppPreview config={config} darkMode={previewDark} />
            <p className="text-xs text-cb-muted text-center mt-3">This is how your clients will see the app after you save</p>
          </div>
        </div>
      </div>
    </div>
  );
}

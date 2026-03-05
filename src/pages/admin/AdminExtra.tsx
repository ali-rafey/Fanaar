import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Upload, Image, Video, Music, MicOff, FileText, Layers } from 'lucide-react';
import './AdminExtra.css';

const PROCESS_STEP_KEYS = ['sourcing', 'purpose', 'testing', 'sampling'];

export default function AdminExtra() {
  const queryClient = useQueryClient();
  const [heroUploading, setHeroUploading] = useState(false);
  const [processUploading, setProcessUploading] = useState<number | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const processInputRefs = useRef<(HTMLInputElement | null)[]>([]);



  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-extra-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['hero_media', 'hero_video_muted', 'process_section']);
      if (error) throw error;
      const map = new Map((data || []).map((r) => [r.key, r]));
      let processSection: { image?: string }[] = [];
      try {
        const raw = map.get('process_section')?.value;
        if (raw) processSection = JSON.parse(raw);
      } catch (_) {
        // Ignore parse error and keep processSection empty
      }
      return {
        hero_media: map.get('hero_media'),
        hero_video_muted: map.get('hero_video_muted'),
        processSection,
      };
    },
  });

  const upsertSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | null }) => {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value }).eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-extra-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-hero'] });
      queryClient.invalidateQueries({ queryKey: ['process-section'] });
    },
  });

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const ext = file.name.split('.').pop();
      const path = `hero/hero-media-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('fabric-images')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('fabric-images').getPublicUrl(path);
      await supabase
        .from('site_settings')
        .update({ value: urlData.publicUrl, media_type: isVideo ? 'video' : 'image' })
        .eq('key', 'hero_media');
      queryClient.invalidateQueries({ queryKey: ['admin-extra-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-hero'] });
    } catch (err) {
      console.error(err);
    } finally {
      setHeroUploading(false);
      if (heroInputRef.current) heroInputRef.current.value = '';
    }
  };

  const setHeroMusic = (muted: boolean) => {
    upsertSetting.mutate({ key: 'hero_video_muted', value: muted ? '1' : '0' });
  };

  const handleProcessImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessUploading(index);
    try {
      const path = `process/step-${index + 1}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('fabric-images')
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('fabric-images').getPublicUrl(path);
      const current = settings?.processSection || [];
      const next = [...current];
      while (next.length <= index) next.push({});
      next[index] = { ...next[index], image: urlData.publicUrl };
      await upsertSetting.mutateAsync({
        key: 'process_section',
        value: JSON.stringify(next),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessUploading(null);
      const ref = processInputRefs.current[index];
      if (ref) ref.value = '';
    }
  };



  if (isLoading) {
    return (
      <AdminLayout title="Extra">
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  const heroMedia = settings?.hero_media;
  const heroMuted = settings?.hero_video_muted?.value === '1';
  const processSection = settings?.processSection || [];

  return (
    <AdminLayout title="Extra">
      <div className="admin-extra-grid">
        {/* 1. Hero media + music */}
        <section className="admin-extra-card">
          <h2 className="admin-extra-card-title">
            <Video size={18} />
            Hero video / image
          </h2>
          <p className="admin-extra-card-desc">Change the homepage hero media. Upload image or video.</p>
          {heroMedia?.value && (
            <div className="admin-extra-preview">
              {heroMedia.media_type === 'video' ? (
                <video src={heroMedia.value} controls className="admin-extra-preview-media" />
              ) : (
                <img src={heroMedia.value} alt="Hero" className="admin-extra-preview-media" />
              )}
              <span className="admin-extra-badge">
                {heroMedia.media_type === 'video' ? <><Video size={12} /> Video</> : <><Image size={12} /> Image</>}
              </span>
            </div>
          )}
          <label className="admin-extra-btn">
            <Upload size={16} />
            {heroUploading ? 'Uploading…' : 'Upload image or video'}
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleHeroUpload}
              disabled={heroUploading}
              style={{ display: 'none' }}
            />
          </label>

          {heroMedia?.media_type === 'video' && (
            <div className="admin-extra-music">
              <span className="admin-extra-music-label">Video sound</span>
              <div className="admin-extra-music-btns">
                <button
                  type="button"
                  className={!heroMuted ? 'active' : ''}
                  onClick={() => setHeroMusic(false)}
                >
                  <Music size={16} /> On
                </button>
                <button
                  type="button"
                  className={heroMuted ? 'active' : ''}
                  onClick={() => setHeroMusic(true)}
                >
                  <MicOff size={16} /> Off
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. Process section images */}
        <section className="admin-extra-card admin-extra-card-wide">
          <h2 className="admin-extra-card-title">
            <Layers size={18} />
            Section after hero (4 steps)
          </h2>
          <p className="admin-extra-card-desc">Change the images for Sourcing, Purpose, Testing, Sampling.</p>
          <div className="admin-extra-process-grid">
            {PROCESS_STEP_KEYS.map((key, i) => (
              <div key={key} className="admin-extra-process-item">
                <span className="admin-extra-process-label">
                  {i + 1}. {key}
                </span>
                {processSection[i]?.image ? (
                  <div className="admin-extra-process-preview">
                    <img src={processSection[i].image} alt={key} />
                  </div>
                ) : (
                  <div className="admin-extra-process-placeholder">No image</div>
                )}
                <label className="admin-extra-btn admin-extra-btn-sm">
                  <Upload size={14} />
                  {processUploading === i ? 'Uploading…' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProcessImageUpload(i, e)}
                    disabled={processUploading !== null}
                    style={{ display: 'none' }}
                    ref={(el) => { processInputRefs.current[i] = el; }}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

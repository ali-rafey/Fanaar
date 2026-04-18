import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type ProcessSectionEntry,
  type SiteSettingRecord,
} from '@/api/client';
import { useAdminHeader } from '@/components/admin/AdminLayout';
import { Upload, Image, Video, Layers } from 'lucide-react';
import './AdminExtra.css';

const PROCESS_STEP_KEYS = ['sourcing', 'purpose', 'testing', 'sampling'];

interface AdminExtraSettings {
  hero_media: SiteSettingRecord | undefined;
  hero_image_url: SiteSettingRecord | undefined;
  hero_video_focus_x: SiteSettingRecord | undefined;
  hero_video_focus_y: SiteSettingRecord | undefined;
  processSection: ProcessSectionEntry[];
}

const createPosterFromVideo = async (file: File) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const posterBlob = await new Promise<Blob>((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = objectUrl;

      video.onloadeddata = () => {
        const maxWidth = 1600;
        const sourceWidth = video.videoWidth || 1280;
        const sourceHeight = video.videoHeight || 720;
        const scale = Math.min(1, maxWidth / sourceWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Failed to create poster context'));
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to export poster image'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', 0.82);
      };

      video.onerror = () => reject(new Error('Failed to load uploaded video'));
    });

    return new File([posterBlob], `${file.name.replace(/\.[^.]+$/, '')}-poster.jpg`, {
      type: 'image/jpeg',
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export default function AdminExtra() {
  useAdminHeader('Extra');

  const queryClient = useQueryClient();
  const [heroUploading, setHeroUploading] = useState(false);
  const [processUploading, setProcessUploading] = useState<number | null>(null);
  const [heroFocusX, setHeroFocusX] = useState(50);
  const [heroFocusY, setHeroFocusY] = useState(50);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const processInputRefs = useRef<(HTMLInputElement | null)[]>([]);



  const { data: settings, isLoading } = useQuery<AdminExtraSettings>({
    queryKey: ['admin-extra-settings'],
    queryFn: async () => {
      const data = await api.settings.list([
        'hero_media',
        'hero_image_url',
        'process_section',
        'hero_video_focus_x',
        'hero_video_focus_y',
      ]);
      const map = new Map(data.map((record) => [record.key, record]));
      let processSection: ProcessSectionEntry[] = [];
      try {
        const raw = map.get('process_section')?.value;
        if (raw) processSection = JSON.parse(raw);
      } catch (_) {
        // Ignore parse error and keep processSection empty
      }
      return {
        hero_media: map.get('hero_media'),
        hero_image_url: map.get('hero_image_url'),
        hero_video_focus_x: map.get('hero_video_focus_x'),
        hero_video_focus_y: map.get('hero_video_focus_y'),
        processSection,
      };
    },
  });

  useEffect(() => {
    const nextX = Number(settings?.hero_video_focus_x?.value ?? 50);
    const nextY = Number(settings?.hero_video_focus_y?.value ?? 50);
    if (!Number.isNaN(nextX)) setHeroFocusX(Math.min(100, Math.max(0, nextX)));
    if (!Number.isNaN(nextY)) setHeroFocusY(Math.min(100, Math.max(0, nextY)));
  }, [settings?.hero_video_focus_x?.value, settings?.hero_video_focus_y?.value]);

  const upsertSetting = useMutation({
    mutationFn: async ({ key, value, media_type }: { key: string; value: string | null; media_type?: string | null }) => {
      await api.settings.upsert(key, { value, media_type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-extra-settings'] });
      queryClient.invalidateQueries({ queryKey: ['home-page'] });
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
      const { publicUrl } = await api.admin.upload(file, path);
      let nextPosterUrl = settings?.hero_image_url?.value || null;

      if (isVideo) {
        try {
          const posterFile = await createPosterFromVideo(file);
          const posterPath = `hero/hero-poster-${Date.now()}.jpg`;
          const { publicUrl: posterUrl } = await api.admin.upload(posterFile, posterPath);
          nextPosterUrl = posterUrl;
        } catch (posterError) {
          console.error(posterError);
        }
      } else {
        nextPosterUrl = publicUrl;
      }

      await api.settings.upsert('hero_media', { value: publicUrl, media_type: isVideo ? 'video' : 'image' });
      if (nextPosterUrl) {
        await api.settings.upsert('hero_image_url', { value: nextPosterUrl, media_type: 'image' });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-extra-settings'] });
      queryClient.invalidateQueries({ queryKey: ['home-page'] });
    } catch (err) {
      console.error(err);
    } finally {
      setHeroUploading(false);
      if (heroInputRef.current) heroInputRef.current.value = '';
    }
  };

  const commitHeroFocus = () => {
    upsertSetting.mutate({ key: 'hero_video_focus_x', value: String(Math.round(heroFocusX)) });
    upsertSetting.mutate({ key: 'hero_video_focus_y', value: String(Math.round(heroFocusY)) });
  };

  const handleProcessImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessUploading(index);
    try {
      const path = `process/step-${index + 1}-${Date.now()}.${file.name.split('.').pop()}`;
      const { publicUrl } = await api.admin.upload(file, path);
      const current = settings?.processSection || [];
      const next = [...current];
      while (next.length <= index) next.push({});
      next[index] = { ...next[index], image: publicUrl };
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
    return <p>Loading...</p>;
  }

  const heroMedia = settings?.hero_media;
  const heroPosterUrl = settings?.hero_image_url?.value || null;
  const processSection = settings?.processSection || [];

  return (
    <div className="admin-extra-grid">
      <section className="admin-extra-card">
        <h2 className="admin-extra-card-title">
          <Video size={18} />
          Hero video / image
        </h2>
        <p className="admin-extra-card-desc">
          Change the homepage hero media. Hero videos now always play muted, and a poster image is generated automatically to remove the black loading gap on the client side.
        </p>
        {heroMedia?.value && (
          <div className="admin-extra-preview">
            {heroMedia.media_type === 'video' ? (
              <video
                src={heroMedia.value}
                controls
                muted
                preload="metadata"
                poster={heroPosterUrl || undefined}
                className="admin-extra-preview-media"
                style={{
                  objectPosition: `${heroFocusX}% ${heroFocusY}%`,
                }}
              />
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
          <div className="admin-extra-focus">
            <span className="admin-extra-music-label">Desktop video focus (laptop only)</span>
            <div className="admin-extra-focus-row">
              <label>Horizontal</label>
              <input
                type="range"
                min={0}
                max={100}
                value={heroFocusX}
                onChange={(e) => setHeroFocusX(Number(e.target.value))}
                onMouseUp={commitHeroFocus}
                onTouchEnd={commitHeroFocus}
              />
              <span>{Math.round(heroFocusX)}%</span>
            </div>
            <div className="admin-extra-focus-row">
              <label>Vertical</label>
              <input
                type="range"
                min={0}
                max={100}
                value={heroFocusY}
                onChange={(e) => setHeroFocusY(Number(e.target.value))}
                onMouseUp={commitHeroFocus}
                onTouchEnd={commitHeroFocus}
              />
              <span>{Math.round(heroFocusY)}%</span>
            </div>
            <p className="admin-extra-focus-note">This only changes the crop/focus on desktop. Mobile stays centered.</p>
          </div>
        )}
      </section>

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
  );
}

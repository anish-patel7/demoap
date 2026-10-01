import { useState, useEffect } from 'react';
import { useProfile, initialsFrom } from '../../context/ProfileContext';

export default function ProfileModal({ open, onClose }) {
  const { profile, saveProfile } = useProfile();
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset the form to the current profile each time the modal opens.
  useEffect(() => {
    if (open) {
      setName(profile.display_name || '');
      setSubtitle(profile.subtitle || '');
      setError(null);
    }
  }, [open, profile]);

  if (!open) return null;

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProfile({ display_name: name.trim(), subtitle: subtitle.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-full border border-primary bg-surface-variant flex items-center justify-center text-primary font-bold">
            {initialsFrom(name)}
          </div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            Edit Profile
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-body-sm text-on-surface-variant mb-1">
              Display name
            </label>
            <input
              autoFocus
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-1 focus:ring-primary outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-body-sm text-on-surface-variant mb-1">
              Subtitle <span className="opacity-60">(optional)</span>
            </label>
            <input
              value={subtitle}
              maxLength={40}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-1 focus:ring-primary outline-none"
              placeholder="e.g. Pro Account"
            />
          </div>

          {error && <p className="text-body-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

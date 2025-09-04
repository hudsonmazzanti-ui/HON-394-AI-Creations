import React from 'react';
import { UserPreferences } from '../types';
// FIX: Import 'MusicIcon' to resolve reference error.
import { UserIcon, MusicNoteIcon, MicIcon, MusicIcon } from './icons';

interface UserInputProps {
  title: string;
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const InputField: React.FC<{ id: string; label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; icon: React.ReactNode; }> = ({ id, label, placeholder, value, onChange, icon }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-base font-semibold mb-2 text-slate-300 flex items-center gap-2">
            {icon}
            {label}
        </label>
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
        />
    </div>
);


const UserInput: React.FC<UserInputProps> = ({ title, prefs, setPrefs }) => {
  const handleChange = (field: keyof UserPreferences) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrefs(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
        <UserIcon className="w-6 h-6 text-cyan-400" />
        {title}
      </h2>
      <InputField
        id={`${title}-songs`}
        label="Favorite Songs"
        placeholder="Separate with commas, e.g., Blinding Lights, As It Was"
        value={prefs.songs}
        onChange={handleChange('songs')}
        icon={<MusicNoteIcon className="w-5 h-5 text-slate-400"/>}
      />
      <InputField
        id={`${title}-artists`}
        label="Favorite Artists"
        placeholder="e.g., The Weeknd, Harry Styles"
        value={prefs.artists}
        onChange={handleChange('artists')}
        icon={<MicIcon className="w-5 h-5 text-slate-400"/>}
      />
      <InputField
        id={`${title}-genres`}
        label="Favorite Genres"
        placeholder="e.g., Pop, Indie, Hip-hop"
        value={prefs.genres}
        onChange={handleChange('genres')}
        icon={<MusicIcon className="w-5 h-5 text-slate-400"/>}
      />
    </div>
  );
};

export default UserInput;
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  x_handle: string;
  discord_handle: string;
  role: string;
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onProfileUpdate: () => void;
}

export default function EditProfileModal({ isOpen, onClose, profile, onProfileUpdate }: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  // We use functional updates or default values to handle null profile safely
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    x_handle: profile?.x_handle || "",
    discord_handle: profile?.discord_handle || "",
    role: profile?.role || "",
    avatar_url: profile?.avatar_url || "",
  });

  // Reset form when profile changes (e.g. when opening modal)
  // But doing this in useEffect might cause loops or issues if not careful.
  // Instead we can initialize form state when modal opens or just rely on key.
  // For simplicity, we'll sync manually or rely on `profile` key prop in parent.
  
  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const supabase = createClient();
      
      // Upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        
        <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700 group cursor-pointer bg-zinc-800">
              <Image 
                src={formData.avatar_url || profile?.avatar_url || "/default-avatar.png"} // fallback needed?
                alt="Avatar"
                fill
                className="object-cover"
              />
              <div 
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-xs text-white font-medium">Change</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
            {uploading && <span className="text-xs text-blue-400">Uploading...</span>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Full Name</label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="Display Name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Role</label>
            <input
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. Founder"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">X Handle</label>
              <input
                name="x_handle"
                value={formData.x_handle}
                onChange={handleInputChange}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                placeholder="@handle"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Discord</label>
              <input
                name="discord_handle"
                value={formData.discord_handle}
                onChange={handleInputChange}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                placeholder="username"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

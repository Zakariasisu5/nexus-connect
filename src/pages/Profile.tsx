import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Globe, 
  Linkedin, 
  Github,
  Edit3,
  Save,
  Upload,
  X,
  QrCode,
  Share2
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import ChipTag from '@/components/ui/ChipTag';
import QRCodeModal from '@/components/ui/QRCodeModal';
import { toast } from '@/hooks/use-toast';
import { showNotification } from '@/components/ui/NotificationCenter';

interface ProfileData {
  name: string;
  title: string;
  company: string;
  location: string;
  bio: string;
  email: string;
  website: string;
  linkedin: string;
  github: string;
  skills: string[];
  interests: string[];
  avatar: string;
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        name: parsed.name || 'John Doe',
        title: parsed.title || 'Product Designer',
        company: parsed.company || 'Acme Inc',
        location: parsed.location || 'San Francisco, CA',
        bio: parsed.bio || 'Passionate about creating amazing products.',
        email: 'john@example.com',
        website: 'https://johndoe.com',
        linkedin: 'johndoe',
        github: 'johndoe',
        skills: parsed.skills || ['Product Design', 'UX Research', 'Figma'],
        interests: parsed.interests || ['DeFi', 'AI/ML', 'Web3'],
        avatar: parsed.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      };
    }
    return {
      name: 'John Doe',
      title: 'Product Designer',
      company: 'Acme Inc',
      location: 'San Francisco, CA',
      bio: 'Passionate about creating amazing products and connecting with like-minded professionals.',
      email: 'john@example.com',
      website: 'https://johndoe.com',
      linkedin: 'johndoe',
      github: 'johndoe',
      skills: ['Product Design', 'UX Research', 'Figma', 'DeFi'],
      interests: ['DeFi', 'AI/ML', 'Web3', 'Startups'],
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    };
  });

  const [editForm, setEditForm] = useState(profile);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setProfile(editForm);
    localStorage.setItem('userProfile', JSON.stringify(editForm));
    setIsEditing(false);
    toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your professional profile</p>
          </div>
          {!isEditing ? (
            <div className="flex gap-3">
              <NeonButton variant="secondary" onClick={() => setShowQRModal(true)}>
                <QrCode className="w-4 h-4" />
                <span>Share QR</span>
              </NeonButton>
              <NeonButton onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </NeonButton>
            </div>
          ) : (
            <div className="flex gap-3">
              <NeonButton variant="secondary" onClick={handleCancel}>
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </NeonButton>
              <NeonButton onClick={handleSave}>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </NeonButton>
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <GlassCard className="p-8" glow="primary">
                <div className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex justify-center">
                    <motion.label
                      className="relative w-32 h-32 rounded-full cursor-pointer group"
                      whileHover={{ scale: 1.05 }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <img
                        src={editForm.avatar}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover border-4 border-primary/50"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </motion.label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="neon-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="neon-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Company</label>
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="neon-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="neon-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="neon-input min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Profile Header */}
              <GlassCard className="p-8" glow="primary">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <motion.img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/50"
                    whileHover={{ scale: 1.05 }}
                  />
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-bold text-foreground">{profile.name}</h2>
                    <p className="text-lg text-primary">{profile.title}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {profile.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </span>
                    </div>
                    <p className="mt-4 text-muted-foreground max-w-lg">{profile.bio}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Skills & Interests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6" glow="accent">
                  <h3 className="text-lg font-bold mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <ChipTag key={skill} label={skill} color="primary" />
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-6" glow="secondary">
                  <h3 className="text-lg font-bold mb-4">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <ChipTag key={interest} label={interest} color="accent" />
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Social Links */}
              <GlassCard className="p-6" glow="none">
                <h3 className="text-lg font-bold mb-4">Connect</h3>
                <div className="flex flex-wrap gap-4">
                  <motion.a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <span>Email</span>
                  </motion.a>
                  <motion.a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Globe className="w-5 h-5 text-accent" />
                    <span>Website</span>
                  </motion.a>
                  <motion.a
                    href={`https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Linkedin className="w-5 h-5 text-[#0077b5]" />
                    <span>LinkedIn</span>
                  </motion.a>
                  <motion.a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Github className="w-5 h-5" />
                    <span>GitHub</span>
                  </motion.a>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          profileId={profile.email.split('@')[0]}
          profileName={profile.name}
          onScanResult={(id) => {
            showNotification(
              'match',
              'New Connection!',
              `Successfully connected via QR code`,
              {
                action: {
                  label: 'View Matches',
                  onClick: () => window.location.href = '/matches',
                },
              }
            );
          }}
        />
      </div>
    </Layout>
  );
};

export default Profile;

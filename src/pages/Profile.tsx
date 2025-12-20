import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import ChipTag from '@/components/ui/ChipTag';
import QRCodeModal from '@/components/ui/QRCodeModal';
import { toast } from '@/hooks/use-toast';
import { showNotification } from '@/components/ui/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const Profile = () => {
  const navigate = useNavigate();
  const { session, signOut, loading: authLoading } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    full_name: '',
    title: '',
    company: '',
    location: '',
    bio: '',
    website: '',
    linkedin_url: '',
    github_url: '',
    skills: [] as string[],
    interests: [] as string[],
    avatar_url: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [session, authLoading, navigate]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        title: profile.title || '',
        company: profile.company || '',
        location: profile.location || '',
        bio: profile.bio || '',
        website: profile.website || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, avatar_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        title: profile.title || '',
        company: profile.company || '',
        location: profile.location || '',
        bio: profile.bio || '',
        website: profile.website || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
        avatar_url: profile.avatar_url || '',
      });
    }
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const displayProfile = profile || editForm;

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
              <NeonButton variant="secondary" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </NeonButton>
            </div>
          ) : (
            <div className="flex gap-3">
              <NeonButton variant="secondary" onClick={handleCancel}>
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </NeonButton>
              <NeonButton onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
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
                        src={editForm.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'}
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
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Website</label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="neon-input"
                        placeholder="https://yoursite.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        value={editForm.linkedin_url}
                        onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                        className="neon-input"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
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
                    src={displayProfile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'}
                    alt={displayProfile.full_name || 'Profile'}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/50"
                    whileHover={{ scale: 1.05 }}
                  />
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-bold text-foreground">{displayProfile.full_name || 'Your Name'}</h2>
                    <p className="text-lg text-primary">{displayProfile.title || 'Your Title'}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-muted-foreground">
                      {displayProfile.company && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {displayProfile.company}
                        </span>
                      )}
                      {displayProfile.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {displayProfile.location}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-muted-foreground max-w-lg">{displayProfile.bio || 'Add a bio to tell others about yourself.'}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Skills & Interests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6" glow="accent">
                  <h3 className="text-lg font-bold mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(displayProfile.skills && displayProfile.skills.length > 0) ? (
                      displayProfile.skills.map((skill) => (
                        <ChipTag key={skill} label={skill} color="primary" />
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No skills added yet</p>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-6" glow="secondary">
                  <h3 className="text-lg font-bold mb-4">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {(displayProfile.interests && displayProfile.interests.length > 0) ? (
                      displayProfile.interests.map((interest) => (
                        <ChipTag key={interest} label={interest} color="accent" />
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No interests added yet</p>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Social Links */}
              <GlassCard className="p-6" glow="none">
                <h3 className="text-lg font-bold mb-4">Connect</h3>
                <div className="flex flex-wrap gap-4">
                  {session?.user?.email && (
                    <motion.a
                      href={`mailto:${session.user.email}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Mail className="w-5 h-5 text-primary" />
                      <span>Email</span>
                    </motion.a>
                  )}
                  {displayProfile.website && (
                    <motion.a
                      href={displayProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Globe className="w-5 h-5 text-accent" />
                      <span>Website</span>
                    </motion.a>
                  )}
                  {displayProfile.linkedin_url && (
                    <motion.a
                      href={displayProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Linkedin className="w-5 h-5 text-[#0077b5]" />
                      <span>LinkedIn</span>
                    </motion.a>
                  )}
                  {displayProfile.github_url && (
                    <motion.a
                      href={displayProfile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Github className="w-5 h-5" />
                      <span>GitHub</span>
                    </motion.a>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          profileId={profile?.qr_code_id || session?.user?.id || ''}
          profileName={displayProfile.full_name || 'User'}
          onScanResult={(id) => {
            showNotification(
              'match',
              'New Connection!',
              `Successfully connected via QR code`,
              {
                action: {
                  label: 'View Matches',
                  onClick: () => navigate('/matches'),
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

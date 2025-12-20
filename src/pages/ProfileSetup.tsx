import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Target, 
  Briefcase, 
  Sparkles,
  Upload,
  Check
} from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import ChipTag from '@/components/ui/ChipTag';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const skillOptions = [
  'Product Design', 'UX Research', 'Frontend Dev', 'Backend Dev', 'AI/ML',
  'Blockchain', 'Smart Contracts', 'DeFi', 'Web3', 'Data Science',
  'Marketing', 'Growth', 'Community', 'Sales', 'Business Dev',
];

const interestOptions = [
  'Startups', 'Investing', 'NFTs', 'DAOs', 'Gaming',
  'Sustainability', 'Healthcare', 'Fintech', 'EdTech', 'SaaS',
  'Networking', 'Mentorship', 'Speaking', 'Writing', 'Podcasting',
];

const goalOptions = [
  'Find co-founders', 'Get funding', 'Hire talent', 'Find mentors',
  'Learn new skills', 'Make connections', 'Explore opportunities', 'Share knowledge',
];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { profile: existingProfile, updateProfile, loading: profileLoading } = useProfile();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    name: '',
    title: '',
    company: '',
    location: '',
    bio: '',
    skills: [] as string[],
    interests: [] as string[],
    goals: [] as string[],
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [session, authLoading, navigate]);

  // Pre-fill with existing profile data
  useEffect(() => {
    if (existingProfile) {
      setProfile({
        name: existingProfile.full_name || '',
        title: existingProfile.title || '',
        company: existingProfile.company || '',
        location: existingProfile.location || '',
        bio: existingProfile.bio || '',
        skills: existingProfile.skills || [],
        interests: existingProfile.interests || [],
        goals: existingProfile.goals || [],
      });
      if (existingProfile.avatar_url) {
        setAvatar(existingProfile.avatar_url);
      }
    }
  }, [existingProfile]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleSelection = (field: 'skills' | 'interests' | 'goals', value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        full_name: profile.name,
        title: profile.title,
        company: profile.company,
        location: profile.location,
        bio: profile.bio,
        skills: profile.skills,
        interests: profile.interests,
        goals: profile.goals,
        avatar_url: avatar,
      });
      toast({ title: 'Profile Complete!', description: 'Start exploring your matches.' });
      navigate('/matches');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: User },
    { number: 2, title: 'Skills', icon: Briefcase },
    { number: 3, title: 'Goals', icon: Target },
  ];

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress Steps */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <motion.div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    step >= s.number
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-glow-primary'
                      : 'bg-muted/50 text-muted-foreground border border-border'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {step > s.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </motion.div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded-full transition-colors duration-300 ${
                      step > s.number ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8" glow="primary">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold gradient-text">Let's Set Up Your Profile</h2>
                    <p className="text-muted-foreground">Tell us about yourself</p>
                  </div>

                  {/* Avatar Upload */}
                  <div className="flex justify-center">
                    <motion.label
                      className="relative w-28 h-28 rounded-full cursor-pointer group"
                      whileHover={{ scale: 1.05 }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover border-4 border-primary/50"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/30 group-hover:border-primary/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </motion.label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="neon-input"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                      <input
                        type="text"
                        value={profile.title}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        className="neon-input"
                        placeholder="Product Designer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Company</label>
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        className="neon-input"
                        placeholder="Acme Inc"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="neon-input"
                        placeholder="San Francisco, CA"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="neon-input min-h-[100px] resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <NeonButton onClick={() => setStep(2)} className="w-full">
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8" glow="accent">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold gradient-text">Your Skills & Interests</h2>
                    <p className="text-muted-foreground">Select all that apply</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Skills</label>
                      <div className="flex flex-wrap gap-2">
                        {skillOptions.map((skill) => (
                          <ChipTag
                            key={skill}
                            label={skill}
                            selected={profile.skills.includes(skill)}
                            onSelect={() => toggleSelection('skills', skill)}
                            color="primary"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Interests</label>
                      <div className="flex flex-wrap gap-2">
                        {interestOptions.map((interest) => (
                          <ChipTag
                            key={interest}
                            label={interest}
                            selected={profile.interests.includes(interest)}
                            onSelect={() => toggleSelection('interests', interest)}
                            color="accent"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <NeonButton variant="secondary" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back</span>
                    </NeonButton>
                    <NeonButton onClick={() => setStep(3)} className="flex-1">
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8" glow="secondary">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold gradient-text">Your Goals</h2>
                    <p className="text-muted-foreground">What do you want to achieve?</p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {goalOptions.map((goal) => (
                      <ChipTag
                        key={goal}
                        label={goal}
                        selected={profile.goals.includes(goal)}
                        onSelect={() => toggleSelection('goals', goal)}
                        color="secondary"
                      />
                    ))}
                  </div>

                  {/* Summary Preview */}
                  <GlassCard className="p-4 bg-muted/20" hover={false} glow="none">
                    <div className="flex items-center gap-4">
                      {avatar && (
                        <img src={avatar} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{profile.name || 'Your Name'}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.title || 'Your Title'} at {profile.company || 'Your Company'}
                        </p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {profile.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                              {skill}
                            </span>
                          ))}
                          {profile.skills.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{profile.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  <div className="flex gap-4">
                    <NeonButton variant="secondary" onClick={() => setStep(2)} className="flex-1">
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back</span>
                    </NeonButton>
                    <NeonButton onClick={handleComplete} className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Complete Setup</span>
                        </>
                      )}
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileSetup;

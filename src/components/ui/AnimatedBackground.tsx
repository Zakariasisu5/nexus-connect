const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient mesh background - CSS only */}
      <div 
        className="absolute inset-0 animate-mesh-shift"
        style={{
          background: `
            radial-gradient(ellipse 80% 80% at 20% 80%, hsl(217 91% 60% / 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 80% 80% at 80% 20%, hsl(160 84% 39% / 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at 50% 50%, hsl(262 83% 58% / 0.1) 0%, transparent 50%)
          `,
          backgroundSize: '200% 200%',
        }}
      />

      {/* Static blurred orbs instead of framer-motion animated ones */}
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl animate-float-slow"
        style={{
          background: 'radial-gradient(circle, hsl(217 91% 60% / 0.2) 0%, transparent 70%)',
          left: '10%',
          top: '20%',
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl animate-float-slow-reverse"
        style={{
          background: 'radial-gradient(circle, hsl(160 84% 39% / 0.15) 0%, transparent 70%)',
          right: '15%',
          top: '30%',
        }}
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;

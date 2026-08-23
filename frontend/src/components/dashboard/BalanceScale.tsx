import React from 'react';
import { motion } from 'framer-motion';

interface BalanceScaleProps {
  totalIncome: number;
  totalExpense: number;
}

export const BalanceScale: React.FC<BalanceScaleProps> = ({ totalIncome, totalExpense }) => {
  const balance = totalIncome - totalExpense;
  
  // Calculate tilt angle based on ratio of difference to max
  // Capped at +/- 15 degrees
  const maxAmount = Math.max(totalIncome, totalExpense, 1);
  const rawRatio = (totalIncome - totalExpense) / maxAmount; 
  // rawRatio is between -1 and +1
  // If left (income) is heavier, we want counter-clockwise rotation (negative degrees).
  const tiltAngle = -rawRatio * 15;

  // Determine color theme based on surplus/deficit
  const isDeficit = balance < 0;
  const glowColor = isDeficit ? 'rgba(211, 31, 46, 0.4)' : 'rgba(43, 168, 90, 0.4)'; // Red vs Green
  const beamColor = isDeficit ? '#D31F2E' : '#2BA85A'; // Red vs Green

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-8 relative rounded-md border border-brass/20 bg-surface overflow-hidden">
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at center 30%, ${glowColor} 0%, transparent 50%)`,
          opacity: 0.8
        }}
      />
      
      {/* Central Balance Display */}
      <div className="z-10 text-center mb-6 mt-4">
        <div className="text-sm font-semibold text-brass uppercase tracking-widest mb-1">Festival Balance</div>
        <div className="text-5xl md:text-6xl font-display font-bold text-brass tabular-nums drop-shadow-md">
          ₹{balance.toLocaleString()}
        </div>
      </div>

      <div className="relative w-full max-w-[500px] aspect-[2/1] sm:h-[220px] z-10 flex justify-center mt-2">
        <svg viewBox="0 0 500 250" className="w-full h-full overflow-visible">
          <defs>
            <radialGradient id="panGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#D9A441" />
              <stop offset="100%" stopColor="#8A6A27" />
            </radialGradient>
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F2C879" />
              <stop offset="50%" stopColor="#B08D3F" />
              <stop offset="100%" stopColor="#5E481A" />
            </linearGradient>
            <radialGradient id="glowG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={glowColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient Glow behind fulcrum */}
          <circle cx="250" cy="90" r="120" fill="url(#glowG)" className="pointer-events-none" />

          {/* Pedestal Base */}
          <path d="M210 240 L290 240 L280 220 L220 220 Z" fill="#5E481A" stroke="#2C241B" strokeWidth="2" />
          <path d="M220 220 L280 220 L260 90 L240 90 Z" fill="#B08D3F" stroke="#2C241B" strokeWidth="2" />
          
          {/* Animated Beam */}
          <motion.g
            animate={{ rotate: tiltAngle }}
            transition={{ type: "spring", stiffness: 30, damping: 10, mass: 1.2 }}
            style={{ transformOrigin: "250px 90px" }}
          >
            {/* Beam 3D Bar */}
            <rect x="50" y="85" width="400" height="10" rx="5" fill="url(#beamGradient)" stroke="#2C241B" strokeWidth="1.5" />
            
            {/* Beam End Caps */}
            <circle cx="50" cy="90" r="8" fill="#B08D3F" stroke="#2C241B" strokeWidth="1.5" />
            <circle cx="450" cy="90" r="8" fill="#B08D3F" stroke="#2C241B" strokeWidth="1.5" />

            {/* Central Pivot Ring */}
            <circle cx="250" cy="90" r="14" fill="#FFFFFF" stroke="#F2C879" strokeWidth="4" />
            
            {/* Left Pan (Income) */}
            <motion.g 
              animate={{ rotate: -tiltAngle }}
              transition={{ type: "spring", stiffness: 30, damping: 10, mass: 1.2 }}
              style={{ transformOrigin: "50px 90px" }}
            >
              {/* Chains converging to ring */}
              <circle cx="50" cy="100" r="4" fill="none" stroke="#B08D3F" strokeWidth="2" />
              <line x1="50" y1="104" x2="20" y2="180" stroke="#B08D3F" strokeWidth="1.5" />
              <line x1="50" y1="104" x2="50" y2="180" stroke="#B08D3F" strokeWidth="1.5" />
              <line x1="50" y1="104" x2="80" y2="180" stroke="#B08D3F" strokeWidth="1.5" />
              
              {/* 3D Pan */}
              <path d="M10 180 Q50 210 90 180 Z" fill="url(#panGradient)" stroke="#2C241B" strokeWidth="1" />
              <path d="M10 180 Q50 195 90 180 Q50 165 10 180 Z" fill="#FFFFFF" stroke="#F2C879" strokeWidth="1.5" />
              
              <text x="50" y="225" textAnchor="middle" fill="#22C55E" className="text-xl font-display font-bold tabular-nums">
                ₹{totalIncome.toLocaleString()}
              </text>
              <text x="50" y="242" textAnchor="middle" fill="#94A3B8" className="text-xs uppercase tracking-widest font-semibold">
                Income
              </text>
            </motion.g>

            {/* Right Pan (Expense) */}
            <motion.g 
              animate={{ rotate: -tiltAngle }} 
              transition={{ type: "spring", stiffness: 30, damping: 10, mass: 1.2 }}
              style={{ transformOrigin: "450px 90px" }}
            >
              <circle cx="450" cy="100" r="4" fill="none" stroke="#B08D3F" strokeWidth="2" />
              <line x1="450" y1="104" x2="420" y2="180" stroke="#B08D3F" strokeWidth="1.5" />
              <line x1="450" y1="104" x2="450" y2="180" stroke="#B08D3F" strokeWidth="1.5" />
              <line x1="450" y1="104" x2="480" y2="180" stroke="#B08D3F" strokeWidth="1.5" />
              
              <path d="M410 180 Q450 210 490 180 Z" fill="url(#panGradient)" stroke="#2C241B" strokeWidth="1" />
              <path d="M410 180 Q450 195 490 180 Q450 165 410 180 Z" fill="#FFFFFF" stroke="#F2C879" strokeWidth="1.5" />
              
              <text x="450" y="225" textAnchor="middle" fill="#EF4444" className="text-xl font-display font-bold tabular-nums">
                ₹{totalExpense.toLocaleString()}
              </text>
              <text x="450" y="242" textAnchor="middle" fill="#94A3B8" className="text-xs uppercase tracking-widest font-semibold">
                Expense
              </text>
            </motion.g>
          </motion.g>

          {/* Finial (Front of beam) */}
          <path d="M245 90 Q250 50 250 40 Q250 50 255 90 Z" fill="#F2C879" stroke="#2C241B" strokeWidth="1" />
          <circle cx="250" cy="90" r="6" fill="#F2C879" />
        </svg>
      </div>

    </div>
  );
};

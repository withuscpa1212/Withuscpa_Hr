import React from 'react';

interface CatMascotProps {
  color?: string; // ex: "#FFD600"
  animated?: boolean;
}

/**
 * 완전 단색 고양이 마스코트 (색상/움직임 커스텀)
 */
const CatMascot: React.FC<CatMascotProps> = ({ color = "#FFD600", animated = true }) => (
  <div
    className={`w-10 h-10 flex items-center justify-center${animated ? ' animate-cat-wiggle' : ''}`}
    style={{ minWidth: 40 }}
    aria-label="귀여운 고양이 마스코트"
  >
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 단색 바디 */}
      <ellipse cx="16" cy="19" rx="10" ry="9" fill={color} />
      {/* 단색 귀 */}
      <ellipse cx="8" cy="7" rx="3.5" ry="5" fill={color} />
      <ellipse cx="24" cy="7" rx="3.5" ry="5" fill={color} />
      {/* 얼굴 - 눈/코/입만 검정 */}
      <ellipse cx="12.5" cy="21.5" rx="0.9" ry="1.3" fill="#222" />
      <ellipse cx="19.5" cy="21.5" rx="0.9" ry="1.3" fill="#222" />
      <ellipse cx="16" cy="24" rx="1.2" ry="0.7" fill="#222" />
      <path d="M14.5 23 Q16 25 17.5 23" stroke="#222" strokeWidth="0.6" fill="none" />
    </svg>
    {animated && (
      <style>{`
        @keyframes cat-wiggle {
          0% { transform: rotate(-8deg); }
          20% { transform: rotate(8deg); }
          40% { transform: rotate(-8deg); }
          60% { transform: rotate(8deg); }
          80% { transform: rotate(-8deg); }
          100% { transform: rotate(-8deg); }
        }
        .animate-cat-wiggle {
          animation: cat-wiggle 2.5s infinite cubic-bezier(.36,.07,.19,.97);
          display: inline-block;
        }
      `}</style>
    )}
  </div>
);

export default CatMascot;

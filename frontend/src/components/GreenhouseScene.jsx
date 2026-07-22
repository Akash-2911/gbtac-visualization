import React from 'react';
import { useTheme } from './ThemeContext';

export default function GreenhouseScene() {
  const { theme } = useTheme();
  return theme === 'light' ? <DayScene /> : <NightScene />;
}

function DayScene() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 680 380" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor="#3E86C4"/><stop offset="60%" stopColor="#79B4DE"/><stop offset="100%" stopColor="#C3E0EE"/>
</linearGradient>
        <linearGradient id="hillFarDay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C9A5D"/><stop offset="100%" stopColor="#3B7F4C"/>
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
  <stop offset="0%" stopColor="#FFE9A8" stopOpacity="0.45"/><stop offset="100%" stopColor="#FFE9A8" stopOpacity="0"/>
</radialGradient>
        <linearGradient id="panelGlint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0"/><stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6"/><stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <style>{`
        @keyframes sunSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes drift1 { 0% { transform: translateX(0); } 100% { transform: translateX(50px); } }
        @keyframes drift2 { 0% { transform: translateX(0); } 100% { transform: translateX(-40px); } }
        @keyframes glint { 0% { transform: translateX(-160px); } 100% { transform: translateX(320px); } }
        @keyframes sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        .sunrays { animation: sunSpin 24s linear infinite; }
        .cloud1 { animation: drift1 30s ease-in-out infinite alternate; }
        .cloud2 { animation: drift2 24s ease-in-out infinite alternate; }
        .glintbar { animation: glint 5s ease-in-out infinite; }
        .leaf { transform-origin: bottom center; animation: sway 3.5s ease-in-out infinite; }
      `}</style>
      <rect x="0" y="0" width="680" height="380" fill="url(#skyDay)"/>
      <circle cx="480" cy="110" r="70" fill="url(#sunGlow)"/>
      <g className="sunrays" style={{ transformOrigin: '480px 110px' }}>
        <g stroke="#FFD873" strokeWidth="3" strokeLinecap="round" opacity="0.85">
          <line x1="480" y1="65" x2="480" y2="49"/><line x1="480" y1="171" x2="480" y2="155"/>
          <line x1="425" y1="110" x2="409" y2="110"/><line x1="551" y1="110" x2="535" y2="110"/>
          <line x1="441" y1="71" x2="430" y2="60"/><line x1="530" y1="149" x2="519" y2="138"/>
          <line x1="441" y1="149" x2="430" y2="160"/><line x1="530" y1="71" x2="519" y2="82"/>
        </g>
      </g>
      <circle cx="480" cy="110" r="28" fill="#FFD873"/>
      <g className="cloud1" opacity="0.9">
        <ellipse cx="130" cy="70" rx="42" ry="14" fill="#FFFFFF"/><ellipse cx="160" cy="62" rx="30" ry="12" fill="#FFFFFF"/><ellipse cx="100" cy="65" rx="26" ry="11" fill="#FFFFFF"/>
      </g>
      <g className="cloud2" opacity="0.85">
        <ellipse cx="340" cy="45" rx="34" ry="10" fill="#FFFFFF"/><ellipse cx="362" cy="40" rx="22" ry="9" fill="#FFFFFF"/>
      </g>
      <path d="M0 250 Q 120 215 260 238 T 500 224 T 680 242 L 680 380 L 0 380 Z" fill="url(#hillFarDay)"/>
      <path d="M0 292 Q 150 265 320 284 T 680 274 L 680 380 L 0 380 Z" fill="#2E6B3F"/>
      <g transform="translate(600,260)">
        <line x1="0" y1="40" x2="0" y2="10" stroke="#2E6B3F" strokeWidth="4" strokeLinecap="round"/>
        <ellipse className="leaf" cx="0" cy="8" rx="14" ry="9" fill="#3B8A4E"/>
      </g>
      <g transform="translate(30,270)">
        <line x1="0" y1="35" x2="0" y2="8" stroke="#2E6B3F" strokeWidth="3" strokeLinecap="round"/>
        <ellipse className="leaf" cx="0" cy="6" rx="11" ry="7" fill="#3B8A4E"/>
      </g>
      <g>
        <rect x="120" y="220" width="150" height="70" fill="#EAF6FB" opacity="0.85"/>
        <path d="M120 220 L195 178 L270 220 Z" fill="#EAF6FB" opacity="0.85"/>
        <rect x="140" y="235" width="20" height="30" fill="#BFE3F0"/><rect x="170" y="235" width="20" height="30" fill="#BFE3F0"/>
        <rect x="200" y="235" width="20" height="30" fill="#BFE3F0"/><rect x="230" y="235" width="20" height="30" fill="#BFE3F0"/>
        <line x1="195" y1="178" x2="195" y2="290" stroke="#8FB9C9" strokeWidth="1"/><line x1="120" y1="220" x2="270" y2="220" stroke="#8FB9C9" strokeWidth="1"/>
      </g>
      {[[360,255,'pclip1',0],[20,300,'pclip2',1.5],[510,300,'pclip3',3]].map(([x,y,id,delay]) => (
        <g key={id} transform={`translate(${x},${y})`}>
          <polygon points="0,40 130,40 150,10 20,10" fill="#274B6E"/>
          <polygon points="0,40 130,40 150,10 20,10" fill="none" stroke="#4A6E92" strokeWidth="0.5"/>
          <line x1="32" y1="32.5" x2="140" y2="17" stroke="#4A6E92" strokeWidth="0.5"/><line x1="42" y1="25" x2="150" y2="10" stroke="#4A6E92" strokeWidth="0.5"/>
          <line x1="0" y1="40" x2="20" y2="10" stroke="#4A6E92" strokeWidth="0.5"/><line x1="43" y1="40" x2="63" y2="10" stroke="#4A6E92" strokeWidth="0.5"/><line x1="86" y1="40" x2="106" y2="10" stroke="#4A6E92" strokeWidth="0.5"/>
          <clipPath id={id}><polygon points="0,40 130,40 150,10 20,10"/></clipPath>
          <rect className="glintbar" x="-160" y="0" width="60" height="40" fill="url(#panelGlint)" clipPath={`url(#${id})`} style={{ animationDelay: `${delay}s` }}/>
        </g>
      ))}
      <rect x="0" y="340" width="680" height="40" fill="#2A5C3A"/>
    </svg>
  );
}

function NightScene() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 680 380" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#060D1D"/><stop offset="55%" stopColor="#0B1B33"/><stop offset="85%" stopColor="#1B2E52"/><stop offset="100%" stopColor="#2C3F68"/>
        </linearGradient>
        <linearGradient id="glow3" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#E8A85C" stopOpacity="0.35"/><stop offset="100%" stopColor="#E8A85C" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="hillFar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14213F"/><stop offset="100%" stopColor="#0F1A33"/>
        </linearGradient>
        <radialGradient id="moonGlow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EDE4D3" stopOpacity="0.55"/><stop offset="100%" stopColor="#EDE4D3" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="panelGlint2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7FB3FF" stopOpacity="0"/><stop offset="50%" stopColor="#7FB3FF" stopOpacity="0.7"/><stop offset="100%" stopColor="#7FB3FF" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <style>{`
        @keyframes twinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 1; } }
        @keyframes windowPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.9; } }
        @keyframes moonPulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.6; } }
        @keyframes drift { 0% { transform: translateX(0); } 100% { transform: translateX(40px); } }
        @keyframes shoot { 0% { transform: translate(0,0); opacity: 0; } 5% { opacity: 1; } 20% { transform: translate(-180px,90px); opacity: 0; } 100% { transform: translate(-180px,90px); opacity: 0; } }
        @keyframes glintNight { 0% { transform: translateX(-160px); } 100% { transform: translateX(320px); } }
        @keyframes spark { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: 0.9; } 100% { transform: translateY(-90px); opacity: 0; } }
        .star1{animation:twinkle 3.2s ease-in-out infinite}.star2{animation:twinkle 4.1s ease-in-out infinite .6s}
        .star3{animation:twinkle 2.6s ease-in-out infinite 1.1s}.star4{animation:twinkle 3.8s ease-in-out infinite .3s}
        .star5{animation:twinkle 3.4s ease-in-out infinite 1.6s}.star6{animation:twinkle 2.9s ease-in-out infinite .9s}
        .star7{animation:twinkle 4.4s ease-in-out infinite 1.9s}.star8{animation:twinkle 3.1s ease-in-out infinite .2s}
        .win1{animation:windowPulse 3.4s ease-in-out infinite}.win2{animation:windowPulse 3.4s ease-in-out infinite .8s}
        .win3{animation:windowPulse 3.4s ease-in-out infinite 1.6s}.win4{animation:windowPulse 3.4s ease-in-out infinite .4s}
        .moonhalo{animation:moonPulse 5s ease-in-out infinite}.cloudlayer{animation:drift 36s linear infinite alternate}
        .shootingstar{animation:shoot 6s ease-in infinite 2s}.glintbarN{animation:glintNight 4.5s ease-in-out infinite}
        .spark1{animation:spark 4s ease-out infinite}.spark2{animation:spark 4s ease-out infinite 1.5s}.spark3{animation:spark 4s ease-out infinite 2.8s}
      `}</style>
      <rect x="0" y="0" width="680" height="380" fill="url(#sky3)"/>
      <rect x="0" y="180" width="680" height="80" fill="url(#glow3)"/>
      <g className="cloudlayer" opacity="0.5">
        <ellipse cx="120" cy="65" rx="55" ry="7" fill="#1B2E52"/><ellipse cx="480" cy="45" rx="70" ry="8" fill="#1B2E52"/>
      </g>
      <g className="shootingstar">
        <line x1="560" y1="55" x2="600" y2="45" stroke="#EDE4D3" strokeWidth="2" strokeLinecap="round"/><circle cx="600" cy="45" r="2" fill="#EDE4D3"/>
      </g>
      <circle cx="480" cy="105" r="44" fill="url(#moonGlow2)" className="moonhalo"/>
      <circle cx="480" cy="105" r="24" fill="#EDE4D3" opacity="0.92"/>
      <circle cx="488" cy="98" r="24" fill="#0B1B33" opacity="0.18"/>
      {[[90,50,'star1',1.5],[150,90,'star2',1.1],[230,40,'star3',1.3],[330,70,'star4',1.1],[420,35,'star5',1.5],[470,100,'star6',1.1],[620,55,'star7',1.3],[650,110,'star8',1.1],[40,110,'star3',1.1],[290,20,'star5',1.1]].map(([cx,cy,cls,r],i) => (
        <circle key={i} className={cls} cx={cx} cy={cy} r={r} fill="#EDE4D3"/>
      ))}
      <path d="M0 250 Q 120 210 260 235 T 500 220 T 680 240 L 680 380 L 0 380 Z" fill="url(#hillFar3)"/>
      <path d="M0 290 Q 150 260 320 280 T 680 270 L 680 380 L 0 380 Z" fill="#0A1428"/>
      <g>
        <rect x="120" y="220" width="150" height="70" fill="#0A1428"/>
        <path d="M120 220 L195 178 L270 220 Z" fill="#0A1428"/>
        <rect className="win1" x="140" y="235" width="20" height="30" fill="#E8A85C"/><rect className="win2" x="170" y="235" width="20" height="30" fill="#E8A85C"/>
        <rect className="win3" x="200" y="235" width="20" height="30" fill="#E8A85C"/><rect className="win4" x="230" y="235" width="20" height="30" fill="#E8A85C"/>
        <line x1="195" y1="178" x2="195" y2="290" stroke="#162140" strokeWidth="1"/><line x1="120" y1="220" x2="270" y2="220" stroke="#162140" strokeWidth="1"/>
        <circle className="spark1" cx="150" cy="230" r="1.4" fill="#FFCB8A"/><circle className="spark2" cx="195" cy="228" r="1.4" fill="#FFCB8A"/><circle className="spark3" cx="240" cy="230" r="1.4" fill="#FFCB8A"/>
      </g>
      {[[360,255,'npclip1',0],[20,300,'npclip2',1.5],[510,300,'npclip3',3]].map(([x,y,id,delay]) => (
        <g key={id} transform={`translate(${x},${y})`}>
          <polygon points="0,40 130,40 150,10 20,10" fill="#0F1D38"/>
          <polygon points="0,40 130,40 150,10 20,10" fill="none" stroke="#25365C" strokeWidth="0.5"/>
          <line x1="32" y1="32.5" x2="140" y2="17" stroke="#25365C" strokeWidth="0.5"/><line x1="42" y1="25" x2="150" y2="10" stroke="#25365C" strokeWidth="0.5"/>
          <line x1="0" y1="40" x2="20" y2="10" stroke="#25365C" strokeWidth="0.5"/><line x1="43" y1="40" x2="63" y2="10" stroke="#25365C" strokeWidth="0.5"/><line x1="86" y1="40" x2="106" y2="10" stroke="#25365C" strokeWidth="0.5"/>
          <clipPath id={id}><polygon points="0,40 130,40 150,10 20,10"/></clipPath>
          <rect className="glintbarN" x="-160" y="0" width="60" height="40" fill="url(#panelGlint2)" clipPath={`url(#${id})`} style={{ animationDelay: `${delay}s` }}/>
        </g>
      ))}
      <rect x="0" y="340" width="680" height="40" fill="#080F1E"/>
    </svg>
  );
}
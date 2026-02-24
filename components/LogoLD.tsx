import React from 'react';

const LogoLD: React.FC<{ expanded?: boolean }> = ({ expanded = true }) => {
    return (
        <div className="flex items-center gap-3 select-none group">
            {/* 3D-like Icon Segment */}
            <div className="relative w-12 h-12 perspective-1000">
                <div
                    className="w-full h-full rounded-[22%] transition-transform duration-500 transform group-hover:rotate-y-12 group-hover:rotate-x-6 relative shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden"
                    style={{
                        background: 'linear-gradient(to bottom, #0067B4, #01A4F1)',
                    }}
                >
                    {/* Subtle Inner Glow */}
                    <div className="absolute inset-0 rounded-[22%] border border-white/20 pointer-events-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]"></div>

                    {/* "LD" Text */}
                    <span className="text-white font-[system-ui] font-bold text-2xl tracking-tighter drop-shadow-md">
                        LD
                    </span>

                    {/* Glass Overlay for Depth */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                </div>
            </div>

            {/* Brand Text Segment */}
            {expanded && (
                <div className="flex flex-col justify-center">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-white text-xl font-black tracking-tighter uppercase leading-none">LD</span>
                    </div>
                    <span className="text-[#FF6201] text-[10px] uppercase font-black tracking-[0.25em] leading-tight mt-0.5">
                        ALUGUÉIS
                    </span>
                </div>
            )}
        </div>
    );
};

export default LogoLD;

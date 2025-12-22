export function NoiseOverlay() {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] mix-blend-overlay">
            <svg
                className="w-full h-full"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <filter id="noise">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.8"
                        numOctaves="4"
                        stitchTiles="stitch"
                    />
                </filter>
                <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>
        </div>
    );
}

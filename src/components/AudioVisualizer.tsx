import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
    data?: Uint8Array;
    isAnimating?: boolean;
    barColor?: string;
    height?: number;
    width?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    data,
    isAnimating = false,
    barColor = '#62d1ee',
    height = 40,
    width = 200
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = 4;
            const gap = 2;
            const barCount = Math.floor(canvas.width / (barWidth + gap));

            for (let i = 0; i < barCount; i++) {
                let barHeight;

                if (data && data.length > 0) {
                    // Use real data if available
                    // Map i to frequency index (0 to ~half of data length usually)
                    const dataIndex = Math.floor((i / barCount) * (data.length / 2));
                    const value = data[dataIndex] || 0;
                    barHeight = (value / 255) * canvas.height;
                } else if (isAnimating) {
                    // Fake animation
                    barHeight = Math.random() * canvas.height * 0.8 + canvas.height * 0.2;
                } else {
                    // Idle state
                    barHeight = 2;
                }

                const x = i * (barWidth + gap);
                const y = (canvas.height - barHeight) / 2; // Center vertically

                ctx.fillStyle = barColor;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, 2);
                ctx.fill();
            }

            if (isAnimating || (data && data.length > 0)) {
                animationId = requestAnimationFrame(draw);
            }
        };

        draw();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [data, isAnimating, barColor, height, width]);

    return <canvas ref={canvasRef} width={width} height={height} />;
};

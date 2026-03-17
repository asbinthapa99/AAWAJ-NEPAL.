'use client';

import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

export function ParticlesBackground() {
    const [init, setInit] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Detect theme for particle colors
        const isDark = document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const updateTheme = (isDarkNow: boolean) => {
            setTheme(isDarkNow ? 'dark' : 'light');
        };
        
        // Set initial theme
        updateTheme(isDark);

        const observer = new MutationObserver(() => {
            const isDarkNow = document.documentElement.classList.contains('dark');
            updateTheme(isDarkNow);
        });

        observer.observe(document.documentElement, { attributes: true });

        // Initialize particles engine
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });

        return () => observer.disconnect();
    }, []);

    if (!init) return null;

    const isLight = theme === 'light';

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
            <Particles
                id="tsparticles"
                className="absolute inset-0 w-full h-full opacity-60 transition-opacity duration-1000"
                options={{
                    fullScreen: { enable: false, zIndex: 0 },
                    background: {
                        color: {
                            value: "transparent",
                        },
                    },
                    fpsLimit: 60,
                    interactivity: {
                        events: {
                            onClick: {
                                enable: true,
                                mode: "push",
                            },
                            onHover: {
                                enable: true,
                                mode: "grab",
                            },
                        },
                        modes: {
                            push: {
                                quantity: 3,
                            },
                            grab: {
                                distance: 180,
                                links: {
                                    opacity: isLight ? 0.3 : 0.6,
                                },
                            },
                        },
                    },
                    particles: {
                        color: {
                            value: isLight ? ["#1877F2", "#10B981", "#64748b"] : ["#3b82f6", "#10B981", "#cbd5e1"],
                        },
                        links: {
                            color: isLight ? "#94a3b8" : "#475569",
                            distance: 180,
                            enable: true,
                            opacity: isLight ? 0.3 : 0.4,
                            width: 1,
                        },
                        move: {
                            direction: "none",
                            enable: true,
                            outModes: {
                                default: "bounce",
                            },
                            random: true,
                            speed: 1.5,
                            straight: false,
                        },
                        number: {
                            density: {
                                enable: true,
                                width: 800,
                                height: 800,
                            },
                            value: 60,
                        },
                        opacity: {
                            value: { min: 0.1, max: 0.7 },
                        },
                        shape: {
                            type: ["circle", "triangle", "polygon"],
                            options: {
                                polygon: {
                                    sides: 6,
                                },
                            },
                        },
                        size: {
                            value: { min: 1, max: 5 },
                        },
                    },
                    detectRetina: true,
                }}
            />
        </div>
    );
}

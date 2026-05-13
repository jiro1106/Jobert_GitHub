import Particles from "@tsparticles/react";
import { useEffect, useState } from "react";
import { initParticles } from "../particlesEngine";

export default function ParticleBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { initParticlesEngine } = await import("@tsparticles/react");

      await initParticlesEngine(initParticles);

      setReady(true);
    };

    load();
  }, []);

  if (!ready) return null;

  return (
    <Particles
      className="w-full h-full"
      options={{
        fullScreen: false,
        background: { color: "transparent" },
        fpsLimit: 60,
        particles: {
          number: { value: 40 },
          color: { value: "#ffffff" },
          links: {
            enable: true,
            color: "#7dd3fc",
            distance: 140,
            opacity: 0.3,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.6,
            outModes: { default: "bounce" },
          },
          size: { value: { min: 1, max: 3 } },
          opacity: { value: 0.4 },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
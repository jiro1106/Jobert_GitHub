import { Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

let loaded = false;

export async function initParticles(engine: Engine) {
  if (loaded) return;
  await loadSlim(engine);
  loaded = true;
}
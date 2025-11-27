import confetti from "canvas-confetti";

export function launchConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
  });
}

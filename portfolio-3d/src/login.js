import * as THREE from "three";
import gsap from "gsap";

export function initLogin({
  sdCard,
  sdCardTarget,
  controls,
  startMainExperience
}) {

  const loginUI = document.getElementById("loginUI");
  const loginBtn = document.getElementById("loginBtn");
  const input = document.getElementById("passwordInput");

  const correctPassword = "1234";

  // 🔥 FORCE SHOW LOGIN
  loginUI.style.display = "";
  loginUI.classList.add("active");

  loginBtn.addEventListener("click", () => {
    if (input.value === correctPassword) {
      unlock();
    } else {
      shake();
    }
  });

  function shake() {
    const box = document.querySelector(".login-box");

    gsap.fromTo(box,
      { x: -10 },
      { x: 10, duration: 0.1, repeat: 5, yoyo: true }
    );
  }

  function unlock() {
    if (!sdCard || !sdCardTarget) return;

    // stop pointer lock if active
    if (controls.isLocked) controls.unlock();

    // hide UI properly
    loginUI.classList.remove("active");

    setTimeout(() => {
      loginUI.style.display = "none";
      loginUI.style.pointerEvents = "none";
    }, 300);

/*    // animate SD card
    const targetPos = sdCardTarget.getWorldPosition(new THREE.Vector3());

    gsap.to(sdCard.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.5,
      ease: "power2.inOut"
    });

    gsap.to(sdCard.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 0.4,
      yoyo: true,
      repeat: 1
    });
*/
    // continue after animation
    setTimeout(() => {
      startMainExperience();
    }, 1500);
  }
}
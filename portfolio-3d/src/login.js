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
    // stop pointer lock if active
    if (controls.isLocked) controls.unlock();

    // hide UI properly
    loginUI.classList.remove("active");

    setTimeout(() => {
      loginUI.style.display = "none";
      loginUI.style.pointerEvents = "none";
    }, 300);

    // continue after animation
    setTimeout(() => {
      startMainExperience();
    }, 1500);
  }
}
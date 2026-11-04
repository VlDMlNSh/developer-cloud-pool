/* Static fixture only. Deliberately contains no fetch(), WebSocket, credentials or dispatch actions. */
(() => {
  "use strict";
  const links = [...document.querySelectorAll(".mobile-nav-link")];
  const sections = ["overview", "tasks", "agents", "pool", "activity"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    for (const link of links) {
      const active = link.getAttribute("href") === "#" + visible.target.id;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }, { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.25, 0.5] });
  sections.forEach((section) => observer.observe(section));
})();

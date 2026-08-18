/* =========================================================
   Dziwe — Lakeside Table — script.js
   1) Mobile nav toggle (runs on every page)
   2) Order form (runs only on menu.html, where #orderForm exists)
   ========================================================= */

// ---------- 1. Mobile nav toggle ----------
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// ---------- 2. Order form ----------
// The restaurant's inbox. Change this if the owner's email ever changes.
const RESTAURANT_EMAIL = "malume200zes@gmail.com";

const orderForm = document.getElementById("orderForm");

if (orderForm) {
  const statusEl = document.getElementById("formStatus");
  const fallbackEl = document.getElementById("fallbackMail");
  const submitBtn = document.getElementById("submitBtn");

  orderForm.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the normal full-page form submit

    const name = orderForm.name.value.trim();
    const meal = orderForm.meal.value; // value of the checked radio button
    const message = orderForm.message.value.trim();

    // ---- simple client-side validation ----
    if (!name) {
      showStatus("Please tell us your name.", "error");
      orderForm.name.focus();
      return;
    }
    if (!meal) {
      showStatus("Please choose breakfast, lunch, or dinner.", "error");
      return;
    }
    if (!message) {
      showStatus("Please add a short message with your order.", "error");
      orderForm.message.focus();
      return;
    }

    sendOrder({ name, meal, message });
  });

  function sendOrder(order) {
    setLoading(true);
    showStatus("Sending your order…", "");

    // FormSubmit.co delivers this straight to the restaurant's inbox —
    // no backend server or API key needed. The first time an order is
    // sent, FormSubmit emails RESTAURANT_EMAIL a one-time confirmation
    // link; after that link is clicked, every future order is delivered
    // automatically.
    fetch(`https://formsubmit.co/ajax/${RESTAURANT_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: order.name,
        meal: order.meal,
        message: order.message,
        _subject: `New ${order.meal} order from ${order.name}`,
        _captcha: "false",
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then(() => {
        showStatus(
          `Thanks, ${order.name}! Your ${order.meal.toLowerCase()} order is on its way to our kitchen.`,
          "success"
        );
        orderForm.reset();
        hideFallback();
      })
      .catch(() => {
        // If the request can't reach FormSubmit (offline, blocked, not yet
        // confirmed, etc.) fall back to opening the visitor's own email app
        // with everything pre-filled, addressed to the restaurant.
        showStatus(
          "We couldn't send that automatically. Use the button below to email it instead.",
          "error"
        );
        showFallback(order);
      })
      .finally(() => setLoading(false));
  }

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = "form-status" + (type ? " " + type : "");
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Sending…" : "Send Order";
  }

  function showFallback(order) {
    const subject = encodeURIComponent(`${order.meal} order from ${order.name}`);
    const body = encodeURIComponent(
      `Name: ${order.name}\nMeal: ${order.meal}\nMessage: ${order.message}`
    );
    fallbackEl.href = `mailto:${RESTAURANT_EMAIL}?subject=${subject}&body=${body}`;
    fallbackEl.classList.add("show");
  }

  function hideFallback() {
    fallbackEl.classList.remove("show");
  }
}

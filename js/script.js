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

  async function sendOrder(order) {
    setLoading(true);
    hideFallback();
    showStatus("Sending your order…", "");

    // FormSubmit.co requires the recipient to confirm the address the first
    // time it receives a submission. A successful HTTP response alone does
    // not guarantee that the order was accepted, so check the JSON result too.
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${RESTAURANT_EMAIL}`, {
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
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The email service returned an unexpected response.");
      }

      // FormSubmit returns success as the string "true". Treat a non-2xx
      // response or any other success value as a failed submission.
      if (!response.ok || String(result.success).toLowerCase() !== "true") {
        throw new Error(result.message || "The email service could not accept your order.");
      }

      showStatus(
        `Thanks, ${order.name}! Your ${order.meal.toLowerCase()} order was accepted for delivery to our kitchen.`,
        "success"
      );
      orderForm.reset();
    } catch (error) {
      // If the request fails (offline, blocked, unconfirmed address, or a
      // rejected FormSubmit response), offer a mailto fallback and never show
      // the success message.
      showStatus(
        `${error.message || "We couldn't send that automatically."} Use the link below to email it instead.`,
        "error"
      );
      showFallback(order);
    } finally {
      setLoading(false);
    }
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

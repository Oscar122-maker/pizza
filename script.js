const body = document.body;
const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const orderAnnouncer = document.querySelector("#order-announcer");
const toast = document.querySelector("[data-toast]");
const customerNameInput = document.querySelector("[data-customer-name]");
const customerPhoneInput = document.querySelector("[data-customer-phone]");
const whatsappButton = document.querySelector("[data-checkout]");
const yocoButton = document.querySelector("[data-yoco-checkout]");
const whatsappNumber = "27711134764";
const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });

let cart = loadCart();
let toastTimer;
let deferredInstallPrompt = null;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("peter-dons-cart") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveCart() {
  try { localStorage.setItem("peter-dons-cart", JSON.stringify(cart)); } catch (error) { /* Optional enhancement only. */ }
}

function announce(message) {
  if (orderAnnouncer) orderAnnouncer.textContent = message;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3800);
}

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

function closeNav() {
  body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Open navigation");
}

navToggle?.addEventListener("click", () => {
  const open = body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeNav();
});

document.querySelectorAll("[data-cart-scroll]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector("#cart")?.scrollIntoView({ behavior: "smooth", block: "start" }));
});

function getProductFromCard(card) {
  const sizeSelect = card.querySelector(".product-size");
  const quantityInput = card.querySelector(".product-quantity");
  const selected = sizeSelect?.selectedOptions[0];
  return {
    id: card.dataset.productId,
    name: card.dataset.productName,
    size: selected?.value || "Medium",
    price: Number(selected?.dataset.price || 0),
    quantity: Math.min(12, Math.max(1, Number(quantityInput?.value || 1)))
  };
}

document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest("[data-product-id]");
    if (!card) return;
    const product = getProductFromCard(card);
    const existing = cart.find((item) => item.id === product.id && item.size === product.size);
    if (existing) existing.quantity = Math.min(12, existing.quantity + product.quantity);
    else cart.push(product);
    saveCart();
    renderCart();
    showToast(product.name + " added to your basket");
    announce(product.name + ", " + product.size + ", added to basket.");
    document.querySelector("#cart")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

function cartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function getCustomer() {
  return {
    name: String(customerNameInput?.value || "").trim().replace(/\s+/g, " "),
    phone: String(customerPhoneInput?.value || "").trim()
  };
}

function isCustomerValid() {
  const customer = getCustomer();
  const digits = normalizePhone(customer.phone).replace(/\D/g, "");
  return customer.name.length >= 2 && digits.length >= 7 && digits.length <= 15;
}

function updateCheckoutState() {
  const enabled = cart.length > 0 && isCustomerValid();
  if (whatsappButton) whatsappButton.disabled = !enabled;
  if (yocoButton) yocoButton.disabled = !enabled;
}

function renderCart() {
  const count = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach((element) => { element.textContent = count; });
  const label = document.querySelector("[data-cart-items-label]");
  if (label) label.textContent = count + " " + (count === 1 ? "item" : "items");
  document.querySelectorAll("[data-cart-subtotal]").forEach((element) => { element.textContent = currency.format(cartTotal()); });
  const container = document.querySelector("[data-cart-items]");
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = `<p class="empty-cart"><span class="empty-cart-mark" aria-hidden="true">✦</span><strong>Your basket is waiting.</strong><span>Choose a favourite above to get started.</span></p>`;
    updateCheckoutState();
    return;
  }
  container.innerHTML = cart.map((item, index) => `
    <article class="cart-item" data-cart-index="${index}">
      <div class="cart-item-main"><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml(item.size)} · ${currency.format(item.price)} each</p></div>
      <div class="cart-item-controls"><span class="cart-item-price">${currency.format(item.price * item.quantity)}</span><div class="quantity-control" aria-label="Quantity for ${escapeHtml(item.name)}"><button type="button" data-quantity-action="decrease" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity-action="increase" aria-label="Increase quantity">+</button></div><button class="remove-item" type="button" data-remove-item>Remove</button></div>
    </article>`).join("");
  updateCheckoutState();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character]);
}

document.querySelector("[data-cart-items]")?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-cart-index]");
  if (!item) return;
  const index = Number(item.dataset.cartIndex);
  const action = event.target.closest("[data-quantity-action]")?.dataset.quantityAction;
  if (action) cart[index].quantity = Math.min(12, Math.max(1, cart[index].quantity + (action === "increase" ? 1 : -1)));
  if (event.target.closest("[data-remove-item]")) {
    const removed = cart.splice(index, 1)[0];
    if (removed) showToast(removed.name + " removed from your basket");
  }
  saveCart();
  renderCart();
});

customerNameInput?.addEventListener("input", updateCheckoutState);
customerPhoneInput?.addEventListener("input", updateCheckoutState);

function orderPayload(source) {
  return {
    source,
    customer: getCustomer(),
    items: cart.map((item) => ({ id: item.id, size: item.size, quantity: item.quantity }))
  };
}

async function apiPost(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  let data = null;
  try { data = await response.json(); } catch (error) { /* The server may return a plain-text error. */ }
  if (!response.ok) throw new Error(data?.error || "The request could not be completed.");
  return data;
}

function buildWhatsAppMessage(orderId) {
  const customer = getCustomer();
  const lines = [
    "Hi Peter Don's Pizza, I would like to place an order.",
    "",
    ...cart.map((item) => `${item.name} — ${item.size} x${item.quantity} — ${currency.format(item.price * item.quantity)}`),
    "",
    `Estimated total: ${currency.format(cartTotal())}`,
    `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`,
    orderId ? `Order reference: ${orderId}` : "",
    "Please confirm pickup or delivery details with me."
  ];
  return lines.filter(Boolean).join("\n");
}

function openModal() {
  const modal = document.querySelector("#confirm-modal");
  const summary = document.querySelector("#confirm-summary");
  if (!modal || !summary) return Promise.resolve(false);
  const previousFocus = document.activeElement;
  summary.textContent = buildWhatsAppMessage("");
  modal.setAttribute("aria-hidden", "false");
  body.classList.add("is-locked");
  const confirm = modal.querySelector("[data-modal-confirm]");
  const cancel = modal.querySelector("[data-modal-cancel]");
  const close = modal.querySelector("[data-modal-close]");
  const backdrop = modal.querySelector("[data-modal-backdrop]");

  return new Promise((resolve) => {
    const finish = (confirmed) => {
      modal.setAttribute("aria-hidden", "true");
      body.classList.remove("is-locked");
      confirm?.removeEventListener("click", onConfirm);
      cancel?.removeEventListener("click", onCancel);
      close?.removeEventListener("click", onCancel);
      backdrop?.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus?.();
      resolve(confirmed);
    };
    const onConfirm = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (event) => { if (event.key === "Escape") onCancel(); };
    confirm?.addEventListener("click", onConfirm);
    cancel?.addEventListener("click", onCancel);
    close?.addEventListener("click", onCancel);
    backdrop?.addEventListener("click", onCancel);
    document.addEventListener("keydown", onKey);
    confirm?.focus();
  });
}

async function submitWhatsAppOrder() {
  const popup = window.open("about:blank", "_blank");
  let orderId = "";
  try {
    const result = await apiPost("/api/save-order", orderPayload("whatsapp"));
    orderId = result.orderId || "";
    showToast("Order saved. Opening WhatsApp…");
  } catch (error) {
    showToast("Could not save online, but WhatsApp will still open.");
  }
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage(orderId))}`;
  if (popup) popup.location.href = url;
  else window.location.href = url;
}

whatsappButton?.addEventListener("click", async () => {
  if (!isCustomerValid()) {
    showToast("Enter your name and a valid phone number first.");
    return;
  }
  const confirmed = await openModal();
  if (confirmed) await submitWhatsAppOrder();
});

yocoButton?.addEventListener("click", async () => {
  if (!isCustomerValid()) {
    showToast("Enter your name and a valid phone number first.");
    return;
  }
  yocoButton.disabled = true;
  whatsappButton.disabled = true;
  yocoButton.setAttribute("aria-busy", "true");
  showToast("Preparing your secure Yoco checkout…");
  try {
    const result = await apiPost("/api/create-yoco-checkout", orderPayload("yoco"));
    if (!result.redirectUrl) throw new Error("Yoco did not return a checkout URL.");
    announce("Redirecting to secure Yoco checkout.");
    window.location.assign(result.redirectUrl);
  } catch (error) {
    yocoButton.removeAttribute("aria-busy");
    showToast(error.message === "Yoco is not configured." ? "Online payments are not configured yet. Please use WhatsApp." : "Could not start payment. Please try WhatsApp.");
    updateCheckoutState();
  }
});

function showPaymentReturnMessage() {
  const params = new URLSearchParams(window.location.search);
  const paymentState = params.get("payment");
  if (paymentState === "success") {
    showToast("Payment submitted. We’ll confirm your order shortly.");
    announce("Payment submitted. Your order is being confirmed.");
  } else if (paymentState === "cancelled") {
    showToast("Payment cancelled. Your basket is still here.");
  } else if (paymentState === "failed") {
    showToast("Payment did not go through. You can try again or use WhatsApp.");
  }
}

const settingsPanel = document.querySelector("[data-settings-panel]");
const settingsScrim = document.querySelector("[data-settings-scrim]");
const settingsToggle = document.querySelector("[data-settings-toggle]");
const typeRange = document.querySelector("[data-type-range]");
const typeOutput = document.querySelector("[data-type-output]");

function setTypeScale(value) {
  const scale = Number(value);
  document.documentElement.style.setProperty("--type-scale", String(scale / 100));
  if (typeRange) typeRange.value = String(scale);
  if (typeOutput) typeOutput.textContent = `${scale}%`;
  try { localStorage.setItem("peter-dons-type-scale", String(scale)); } catch (error) { /* Optional enhancement only. */ }
}

try {
  setTypeScale(Number(localStorage.getItem("peter-dons-type-scale") || 100));
} catch (error) {
  setTypeScale(100);
}

typeRange?.addEventListener("input", (event) => setTypeScale(event.target.value));
document.querySelector("[data-type-reset]")?.addEventListener("click", () => setTypeScale(100));

function closeSettings() {
  settingsPanel?.classList.remove("is-open");
  settingsPanel?.setAttribute("aria-hidden", "true");
  settingsScrim?.classList.remove("is-visible");
  settingsToggle?.setAttribute("aria-expanded", "false");
}

settingsToggle?.addEventListener("click", () => {
  const open = !settingsPanel?.classList.contains("is-open");
  if (open) {
    settingsPanel?.classList.add("is-open");
    settingsPanel?.setAttribute("aria-hidden", "false");
    settingsScrim?.classList.add("is-visible");
    settingsToggle.setAttribute("aria-expanded", "true");
  } else closeSettings();
});

document.querySelector("[data-settings-close]")?.addEventListener("click", closeSettings);
settingsScrim?.addEventListener("click", closeSettings);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const install = document.querySelector("[data-install]");
  if (install) install.hidden = false;
});

document.querySelector("[data-install]")?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});

window.addEventListener("appinstalled", () => {
  const note = document.querySelector("[data-install-note]");
  if (note) note.textContent = "Installed — Peter Don's is ready on your home screen.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => undefined));
}

renderCart();
showPaymentReturnMessage();

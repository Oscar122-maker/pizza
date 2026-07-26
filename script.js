const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const orderForm = document.querySelector("[data-order-form]");
const orderSize = document.querySelector("[data-order-size]");
const orderQuantity = document.querySelector("[data-order-quantity]");
const orderSummary = document.querySelector("[data-order-summary]");
const sizeShortcuts = document.querySelectorAll("[data-order-size-shortcut]");

const whatsappNumber = "27711134764";

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  }
});

const getSelectedPrice = () => {
  const selectedOption = orderSize.options[orderSize.selectedIndex];
  return Number(selectedOption.dataset.price || 0);
};

const updateOrderSummary = () => {
  const quantity = Math.max(1, Number(orderQuantity.value || 1));
  orderSummary.textContent = `Estimated total: R${getSelectedPrice() * quantity}`;
};

orderSize.addEventListener("change", updateOrderSummary);
orderQuantity.addEventListener("input", updateOrderSummary);

sizeShortcuts.forEach((shortcut) => {
  shortcut.addEventListener("click", () => {
    orderSize.value = shortcut.dataset.orderSizeShortcut;
    updateOrderSummary();
  });
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(orderForm);
  const flavour = formData.get("flavour");
  const size = formData.get("size");
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const customer = String(formData.get("customer") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const total = getSelectedPrice() * quantity;

  const message = [
    "Hi Peter Don's Pizza, I would like to place an order.",
    "",
    `Flavour: ${flavour}`,
    `Size: ${size}`,
    `Quantity: ${quantity}`,
    `Estimated total: R${total}`,
    customer ? `Customer name: ${customer}` : "",
    notes ? `Notes: ${notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
});

updateOrderSummary();

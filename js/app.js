const stripe = Stripe("YOUR_PUBLIC_STRIPE_KEY");

document.getElementById("buyBook")?.addEventListener("click", () => {
  fetch("/create-checkout-session", { method:"POST" })
    .then(res => res.json())
    .then(data => stripe.redirectToCheckout({ sessionId:data.id }));
});

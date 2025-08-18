const fs = require('fs');
const path = require('path');

// Helper to generate menu HTML from menu.json
function generateMenuHTML(menu) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menu</title>
  <link rel="stylesheet" href="css menu pizza website take 1.css">
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="pizza-icon-192.png">
</head>
<body>
  <header>
    <h1 class="main-heading no-underline">Inspired by Naples, perfected at None Go Bye.</h1>
    <nav class="main-nav">
      <a href="pizza website take 1.html"><b>Home</b></a>
      <a href="menu pizza website take 1.html"><b>Menu</b></a>
      <a href="checkout.html"><b>Checkout</b></a>
      <a href="allergens.html"><b>Allergens</b></a>
    </nav>
  </header>
  <section id="menu">
    <h2 class="menu-heading underlined">Menu</h2>
    <div id="dynamic-menu">
      ${menu.map(item => `
        <div class="menu-item">
          <p><strong>${item.name}</strong> – £${item.price.toFixed(2)}</p>
          <p>${item.description || ''}</p>
          <button onclick="addToCart('${item.name.replace(/'/g, "\'")}', ${item.price})">Add to Cart</button>
        </div>
      `).join('')}
    </div>
  </section>
</body>
</html>`;
}

module.exports = { generateMenuHTML };

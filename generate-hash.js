// Run this script in Node.js to generate a bcrypt hash for your password
const bcrypt = require('bcryptjs');
const password = 'Sammi-1991'; // Change this to your desired password
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hash:', hash);
});

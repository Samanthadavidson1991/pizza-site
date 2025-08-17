
const bcrypt = require('bcryptjs');
const password = 'Sammi-1991'; 
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hash:', hash);
});

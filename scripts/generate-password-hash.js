const bcrypt = require('bcryptjs');

const password = 'password123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }

  console.log('\nPassword: password123');
  console.log('Hash:', hash);
  console.log('\nGanti hash di database/seed.sql dengan hash ini');
});

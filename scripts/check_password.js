const bcrypt = require('bcryptjs');
const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgKyJTI7K';
const plain = 'Admin123';
console.log('hash:', hash);
console.log('plain:', plain);
console.log('match:', bcrypt.compareSync(plain, hash));

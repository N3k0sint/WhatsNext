const User = require('./models/User');
const sequelize = require('./config/database');

async function check() {
  await sequelize.sync();
  const users = await User.findAll();
  console.log('--- Users in Database ---');
  users.forEach(u => {
    console.log(`ID: ${u.id}, Username: ${u.username}, Role: ${u.role}`);
  });
  process.exit(0);
}

check();

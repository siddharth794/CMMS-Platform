import sequelize from '../config/database';

async function updateEnum() {
  try {
    // Explicitly modify the ENUM column using raw SQL since Sequelize alter: true doesn't always update ENUMs properly in MySQL
    await sequelize.query(`
      ALTER TABLE work_orders 
      MODIFY COLUMN status ENUM('new', 'open', 'in_progress', 'on_hold', 'pending_review', 'completed', 'cancelled') 
      DEFAULT 'new';
    `);
    console.log('Successfully updated ENUM column in database');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update ENUM:', error);
    process.exit(1);
  }
}
updateEnum();
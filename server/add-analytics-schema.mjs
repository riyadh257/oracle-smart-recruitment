import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('Creating notification_analytics table...');
  
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notification_analytics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      notification_id INT NOT NULL,
      user_id INT NOT NULL,
      event_type ENUM('sent', 'delivered', 'opened', 'clicked', 'dismissed', 'failed') NOT NULL,
      event_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_notification_id (notification_id),
      INDEX idx_user_id (user_id),
      INDEX idx_event_type (event_type),
      INDEX idx_created_at (created_at)
    )
  `);
  
  console.log('✅ notification_analytics table created successfully!');
} catch (error) {
  console.error('❌ Failed to create table:', error);
  process.exit(1);
} finally {
  await connection.end();
}

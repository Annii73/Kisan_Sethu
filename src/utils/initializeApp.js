// Initialize database tables when app starts
export const initializeApp = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 78c603dd15a83e48927e7dc52b2a8a6c',
    'X-Generated-App-ID': 'fb966449-837b-4a1b-b874-1afcdcab3e35',
    'X-Usage-Key': 'bea07626d89ebd2a9ab76e0ada0b62ad'
  };

  try {
    // Create users table
    await fetch('https://builder.empromptu.ai/api_tools/templates/call_postgres', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `CREATE TABLE IF NOT EXISTS newschema_fb966449837b4a1bb8741afcdcab3e35.users (
          id SERIAL PRIMARY KEY, 
          phone_number VARCHAR(15) UNIQUE NOT NULL, 
          name VARCHAR(100), 
          location VARCHAR(100), 
          farm_size DECIMAL(10,2), 
          soil_type VARCHAR(50), 
          created_at TIMESTAMP DEFAULT NOW()
        )`
      })
    });

    // Create feedback table
    await fetch('https://builder.empromptu.ai/api_tools/templates/call_postgres', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `CREATE TABLE IF NOT EXISTS newschema_fb966449837b4a1bb8741afcdcab3e35.feedback (
          id SERIAL PRIMARY KEY, 
          user_phone VARCHAR(15), 
          rating INTEGER, 
          category VARCHAR(50), 
          message TEXT, 
          suggestions TEXT, 
          created_at TIMESTAMP DEFAULT NOW()
        )`
      })
    });

    console.log('App initialization completed successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
};

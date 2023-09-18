const conString = process.env.DATABASE_URL;

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: conString,
      ssl: { rejectUnauthorized: false }, 
    },
    migrations: {
      directory: './db/migrations', 
    },
    seeds: {
      directory: './db/seeds', 
    },
  },
};

//Pool is a connection pooling mechanism specifically designed for PostgreSQL that helps manage and
//share connections among multiple clients or applications.
import { Pool } from 'pg';

const dotenv = require('dotenv');
//.config() will load the variables from the .env file into the Node.js environmen
dotenv.config();

const URI = process.env.SERCRET_URI;
console.log('URI', URI);
// const URI =
//   'postgres://zwyukzmm:oM8otmPCWbQqCaM6sYz8KAAapGA0aQXH@hattie.db.elephantsql.com/zwyukzmm';

const pool = new Pool({
  connectionString: URI,
});

module.exports = {
  query: (text: string, params: string[]) => {
    console.log('executed query', text);
    return pool.query(text, params);
  },
  pool: pool,
};

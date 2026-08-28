import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const sql = fs.readFileSync('../supabase/migrations/00014_group_receipt_sequences.sql', 'utf8');
    await client.query(sql);
    
    console.log('Migration applied successfully');
  } catch (e) {
    console.error('Error applying migration:', e);
  } finally {
    await client.end();
  }
}

run();

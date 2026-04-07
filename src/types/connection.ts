export interface Connection {
  id: string;
  name: string;
  db_type: 'mysql' | 'postgresql';
  host: string;
  port: number;
  username: string;
  password?: string;
  database?: string;
  environment?: 'production' | 'staging' | 'development';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateConnectionInput {
  name: string;
  db_type: 'mysql' | 'postgresql';
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
  environment?: 'production' | 'staging' | 'development';
  tags?: string[];
}

export interface UpdateConnectionInput {
  name?: string;
  db_type?: 'mysql' | 'postgresql';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  environment?: 'production' | 'staging' | 'development';
  tags?: string[];
}
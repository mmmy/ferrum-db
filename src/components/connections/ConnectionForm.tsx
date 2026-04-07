import { useState, useEffect } from 'react';
import { Connection, CreateConnectionInput, UpdateConnectionInput } from '@/types/connection';

interface ConnectionFormProps {
  connection?: Connection;
  onSubmit: (data: CreateConnectionInput | UpdateConnectionInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConnectionForm({ connection, onSubmit, onCancel, isLoading }: ConnectionFormProps) {
  const [formData, setFormData] = useState<CreateConnectionInput>({
    name: '',
    db_type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database: '',
    environment: 'development',
    tags: [],
  });

  useEffect(() => {
    if (connection) {
      setFormData({
        name: connection.name,
        db_type: connection.db_type,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: '', // Don't populate password for security
        database: connection.database || '',
        environment: connection.environment || 'development',
        tags: connection.tags,
      });
    }
  }, [connection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateConnectionInput, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-label text-on-surface-variant mb-1.5">
          Connection Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          className="w-full bg-surface-container border border-neutral-800/50 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary/50"
          placeholder="My Database"
        />
      </div>

      {/* Database Type */}
      <div>
        <label className="block text-sm font-label text-on-surface-variant mb-1.5">
          Database Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { handleChange('db_type', 'mysql'); handleChange('port', 3306); }}
            className={`flex-1 py-2 rounded-lg text-sm font-label transition-colors ${
              formData.db_type === 'mysql'
                ? 'bg-primary text-neutral-950'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            MySQL
          </button>
          <button
            type="button"
            onClick={() => { handleChange('db_type', 'postgresql'); handleChange('port', 5432); }}
            className={`flex-1 py-2 rounded-lg text-sm font-label transition-colors ${
              formData.db_type === 'postgresql'
                ? 'bg-primary text-neutral-950'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            PostgreSQL
          </button>
        </div>
      </div>

      {/* Host & Port */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-label text-on-surface-variant mb-1.5">
            Host
          </label>
          <input
            type="text"
            value={formData.host}
            onChange={(e) => handleChange('host', e.target.value)}
            required
            className="w-full bg-surface-container border border-neutral-800/50 rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary/50"
            placeholder="localhost"
          />
        </div>
        <div>
          <label className="block text-sm font-label text-on-surface-variant mb-1.5">
            Port
          </label>
          <input
            type="number"
            value={formData.port}
            onChange={(e) => handleChange('port', parseInt(e.target.value) || 0)}
            required
            className="w-full bg-surface-container border border-neutral-800/50 rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Username & Password */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-label text-on-surface-variant mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            required
            className="w-full bg-surface-container border border-neutral-800/50 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary/50"
            placeholder="root"
          />
        </div>
        <div>
          <label className="block text-sm font-label text-on-surface-variant mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required={!connection}
            className="w-full bg-surface-container border border-neutral-800/50 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary/50"
            placeholder={connection ? '(unchanged)' : '••••••••'}
          />
        </div>
      </div>

      {/* Database & Environment */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-label text-on-surface-variant mb-1.5">
            Database
          </label>
          <input
            type="text"
            value={formData.database}
            onChange={(e) => handleChange('database', e.target.value)}
            className="w-full bg-surface-container border border-neutral-800/50 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary/50"
            placeholder="mydb"
          />
        </div>
        <div>
          <label className="block text-sm font-label text-on-surface-variant mb-1.5">
            Environment
          </label>
          <select
            value={formData.environment}
            onChange={(e) => handleChange('environment', e.target.value)}
            className="w-full bg-surface-container border border-neutral-800/50 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary/50"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800/50">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-label text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-neutral-950 rounded-lg text-sm font-label font-medium hover:bg-primary-dim transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : connection ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
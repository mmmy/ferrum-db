import { Connection } from '@/types/connection';
import { DataBrowserFixture } from '@/types/workspace';

const fixtures: Record<string, DataBrowserFixture> = {
  'prod-1': {
    connectionId: 'prod-1',
    databaseLabel: 'orders',
    schemas: [
      {
        id: 'public',
        name: 'public',
        tables: [
          {
            id: 'public.orders',
            name: 'orders',
            description: 'Primary order ledger with shipping and payment rollups.',
            rowCountLabel: '14.8M rows',
            columns: [
              { name: 'id', type: 'uuid', isPrimaryKey: true },
              { name: 'customer_id', type: 'uuid' },
              { name: 'status', type: 'text' },
              { name: 'total_cents', type: 'bigint' },
              { name: 'created_at', type: 'timestamp' },
            ],
            previewRows: [
              {
                id: 'ord_1001',
                customer_id: 'cus_8842',
                status: 'paid',
                total_cents: 18250,
                created_at: '2026-04-09 09:14:00',
              },
              {
                id: 'ord_1002',
                customer_id: 'cus_3321',
                status: 'packed',
                total_cents: 9080,
                created_at: '2026-04-09 09:18:00',
              },
            ],
          },
          {
            id: 'public.order_items',
            name: 'order_items',
            description: 'Line items joined to the primary orders table.',
            rowCountLabel: '48.3M rows',
            columns: [
              { name: 'id', type: 'uuid', isPrimaryKey: true },
              { name: 'order_id', type: 'uuid' },
              { name: 'sku', type: 'text' },
              { name: 'quantity', type: 'integer' },
            ],
            previewRows: [
              {
                id: 'itm_1001',
                order_id: 'ord_1001',
                sku: 'SKU-XL-9',
                quantity: 2,
              },
            ],
          },
        ],
      },
      {
        id: 'analytics',
        name: 'analytics',
        tables: [
          {
            id: 'analytics.hourly_revenue',
            name: 'hourly_revenue',
            description: 'Read-only revenue snapshots materialized every hour.',
            rowCountLabel: '720 rows',
            columns: [
              { name: 'hour_bucket', type: 'timestamp', isPrimaryKey: true },
              { name: 'gross_cents', type: 'bigint' },
              { name: 'refund_cents', type: 'bigint', nullable: true },
            ],
            previewRows: [
              {
                hour_bucket: '2026-04-09 09:00:00',
                gross_cents: 542200,
                refund_cents: 12000,
              },
            ],
          },
        ],
      },
    ],
  },
  'stage-1': {
    connectionId: 'stage-1',
    databaseLabel: 'warehouse',
    schemas: [
      {
        id: 'core',
        name: 'core',
        tables: [
          {
            id: 'core.accounts',
            name: 'accounts',
            description: 'Staging snapshot of customer accounts and segmentation.',
            rowCountLabel: '124K rows',
            columns: [
              { name: 'id', type: 'bigint', isPrimaryKey: true },
              { name: 'name', type: 'varchar' },
              { name: 'segment', type: 'varchar', nullable: true },
            ],
            previewRows: [
              {
                id: 101,
                name: 'Northwind Ops',
                segment: 'enterprise',
              },
            ],
          },
          {
            id: 'core.empty_sync_queue',
            name: 'empty_sync_queue',
            description: 'A fixture table with no rows to validate empty preview handling.',
            rowCountLabel: '0 rows',
            columns: [
              { name: 'id', type: 'bigint', isPrimaryKey: true },
              { name: 'payload', type: 'json', nullable: true },
            ],
            previewRows: [],
          },
        ],
      },
    ],
  },
  'dev-1': {
    connectionId: 'dev-1',
    databaseLabel: 'sandbox',
    schemas: [
      {
        id: 'public',
        name: 'public',
        tables: [
          {
            id: 'public.feature_flags',
            name: 'feature_flags',
            description: 'Local feature toggles for fast iteration in development.',
            rowCountLabel: '12 rows',
            columns: [
              { name: 'key', type: 'text', isPrimaryKey: true },
              { name: 'enabled', type: 'boolean' },
              { name: 'owner', type: 'text', nullable: true },
            ],
            previewRows: [
              {
                key: 'new-data-browser',
                enabled: 'true',
                owner: 'frontend',
              },
            ],
          },
        ],
      },
    ],
  },
};

function buildFallbackFixture(connection: Connection): DataBrowserFixture {
  const databaseLabel =
    connection.database ?? `${connection.name.toLowerCase().replace(/\s+/g, '_')}_db`;

  return {
    connectionId: connection.id,
    databaseLabel,
    schemas: [
      {
        id: 'default',
        name: 'default',
        tables: [
          {
            id: 'default.connection_inventory',
            name: 'connection_inventory',
            description: 'Fallback structure for prototype-only connections.',
            rowCountLabel: '0 rows',
            columns: [
              { name: 'id', type: 'text', isPrimaryKey: true },
              { name: 'name', type: 'text' },
              { name: 'status', type: 'text', nullable: true },
            ],
            previewRows: [],
          },
        ],
      },
    ],
  };
}

export function getDataBrowserFixture(connection: Connection): DataBrowserFixture {
  return fixtures[connection.id] ?? buildFallbackFixture(connection);
}

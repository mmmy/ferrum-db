import { mockInvoke, resetMockBackend } from '@/backend/mockBackend';

describe('mock backend', () => {
  afterEach(() => {
    resetMockBackend();
  });

  it('serves seeded connections and supports create, update, and delete flows', async () => {
    const initialConnections = await mockInvoke<
      Array<{ id: string; name: string; tags: string[]; environment?: string }>
    >('list_connections');

    expect(initialConnections).toHaveLength(4);
    expect(initialConnections[0]?.name).toBe('Main Orders');

    const createdConnection = await mockInvoke<{
      id: string;
      name: string;
      tags: string[];
      environment?: string;
    }>('create_connection', {
      data: {
        name: 'Mock QA',
        db_type: 'postgresql',
        host: 'qa.internal',
        port: 5432,
        username: 'qa',
        password: 'secret',
        database: 'qa_db',
        environment: 'development',
        tags: ['qa'],
      },
    });

    expect(createdConnection.name).toBe('Mock QA');

    const updatedConnection = await mockInvoke<{ id: string; name: string; tags: string[] } | null>(
      'update_connection',
      {
        id: createdConnection.id,
        data: {
          name: 'Mock QA Updated',
          db_type: 'postgresql',
          host: 'qa.internal',
          port: 5432,
          username: 'qa',
          database: 'qa_db',
          environment: 'staging',
          tags: ['qa', 'refined'],
        },
      }
    );

    expect(updatedConnection?.name).toBe('Mock QA Updated');
    expect(updatedConnection?.tags).toEqual(['qa', 'refined']);

    await mockInvoke('delete_connection', { id: createdConnection.id });

    const finalConnections = await mockInvoke<Array<{ id: string }>>('list_connections');
    expect(finalConnections).toHaveLength(4);
    expect(finalConnections.some((connection) => connection.id === createdConnection.id)).toBe(false);
  });

  it('returns null when updating a missing connection', async () => {
    const result = await mockInvoke<null>('update_connection', {
      id: 'missing-id',
      data: {
        name: 'Missing',
        db_type: 'mysql',
        host: 'missing.internal',
        port: 3306,
        username: 'missing',
        database: 'missing',
        environment: 'development',
        tags: [],
      },
    });

    expect(result).toBeNull();
  });
});

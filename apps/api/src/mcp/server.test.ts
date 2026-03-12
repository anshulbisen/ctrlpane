import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { type BlueprintApiClient, createBlueprintMcpServer } from './server.js';

// ---------------------------------------------------------------------------
// Mock API client — returns predictable data for each method
// ---------------------------------------------------------------------------

function createMockApiClient(): BlueprintApiClient {
  return {
    listItems: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'bpi_01JTEST000000000000000001',
          title: 'Test item',
          status: 'pending',
          priority: 'medium',
        },
      ],
      pagination: { next_cursor: null, prev_cursor: null, has_more: false, limit: 25 },
    }),

    getItem: vi.fn().mockResolvedValue({
      data: {
        id: 'bpi_01JTEST000000000000000001',
        title: 'Test item',
        status: 'pending',
        priority: 'medium',
        description: 'A test item',
        tags: [],
        comments: [],
        sub_items: [],
      },
    }),

    createItem: vi.fn().mockResolvedValue({
      data: {
        id: 'bpi_01JTEST000000000000000002',
        title: 'New item',
        status: 'pending',
        priority: 'medium',
      },
    }),

    updateItem: vi.fn().mockResolvedValue({
      data: {
        id: 'bpi_01JTEST000000000000000001',
        title: 'Updated item',
        status: 'pending',
        priority: 'high',
      },
    }),

    changeStatus: vi.fn().mockResolvedValue({
      data: {
        id: 'bpi_01JTEST000000000000000001',
        status: 'in_progress',
      },
    }),

    searchItems: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'bpi_01JTEST000000000000000001',
          title: 'Test item',
          status: 'pending',
        },
      ],
      pagination: { next_cursor: null, prev_cursor: null, has_more: false, limit: 25 },
    }),

    addComment: vi.fn().mockResolvedValue({
      data: {
        id: 'bpc_01JTEST000000000000000001',
        item_id: 'bpi_01JTEST000000000000000001',
        content: 'Test comment',
      },
    }),

    listTags: vi.fn().mockResolvedValue({
      data: [
        { id: 'bpt_01JTEST000000000000000001', name: 'bug', color: '#FF0000' },
        { id: 'bpt_01JTEST000000000000000002', name: 'feature', color: '#00FF00' },
      ],
    }),

    assignTag: vi.fn().mockResolvedValue({
      data: {
        item_id: 'bpi_01JTEST000000000000000001',
        tag_id: 'bpt_01JTEST000000000000000001',
      },
    }),
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

async function createClientServerPair(mockClient: BlueprintApiClient) {
  const mcpServer = createBlueprintMcpServer(mockClient);
  const client = new Client({ name: 'test-client', version: '0.1.0' });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await mcpServer.connect(serverTransport);
  await client.connect(clientTransport);

  return { mcpServer, client, clientTransport, serverTransport };
}

/** Extract the text content from the first content block of a tool result. */
function getResultText(result: Awaited<ReturnType<Client['callTool']>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  const first = content[0];
  if (!first) throw new Error('Tool result has no content blocks');
  return first.text;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('unit: MCP Blueprint Server', () => {
  let mockApiClient: BlueprintApiClient;
  let client: Client;
  let mcpServer: ReturnType<typeof createBlueprintMcpServer>;

  beforeAll(async () => {
    mockApiClient = createMockApiClient();
    const pair = await createClientServerPair(mockApiClient);
    client = pair.client;
    mcpServer = pair.mcpServer;
  });

  afterAll(async () => {
    await client.close();
    await mcpServer.close();
  });

  // -----------------------------------------------------------------------
  // Tool registration
  // -----------------------------------------------------------------------

  describe('tool registration', () => {
    it('registers exactly 9 tools', async () => {
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(9);
    });

    it('registers all expected tool names', async () => {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name).sort();
      expect(names).toEqual([
        'blueprint_add_comment',
        'blueprint_assign_tag',
        'blueprint_change_status',
        'blueprint_create_item',
        'blueprint_get_item',
        'blueprint_list_items',
        'blueprint_list_tags',
        'blueprint_search_items',
        'blueprint_update_item',
      ]);
    });

    it('each tool has a description', async () => {
      const { tools } = await client.listTools();
      for (const tool of tools) {
        expect(tool.description).toBeTruthy();
      }
    });

    it('each tool has a valid inputSchema with type "object"', async () => {
      const { tools } = await client.listTools();
      for (const tool of tools) {
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Tool execution — happy paths
  // -----------------------------------------------------------------------

  describe('blueprint_list_items', () => {
    it('returns items with no filters', async () => {
      const result = await client.callTool({
        name: 'blueprint_list_items',
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      const text = getResultText(result);
      const parsed = JSON.parse(text);
      expect(parsed.data).toBeInstanceOf(Array);
      expect(mockApiClient.listItems).toHaveBeenCalled();
    });

    it('passes filters through to the API client', async () => {
      await client.callTool({
        name: 'blueprint_list_items',
        arguments: { status: 'pending', priority: 'high', limit: 10 },
      });

      expect(mockApiClient.listItems).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          priority: 'high',
          limit: 10,
        }),
      );
    });
  });

  describe('blueprint_get_item', () => {
    it('returns a single item by ID', async () => {
      const result = await client.callTool({
        name: 'blueprint_get_item',
        arguments: { id: 'bpi_01JTEST000000000000000001' },
      });

      expect(result.isError).toBeFalsy();
      const text = getResultText(result);
      const parsed = JSON.parse(text);
      expect(parsed.data.id).toBe('bpi_01JTEST000000000000000001');
      expect(mockApiClient.getItem).toHaveBeenCalledWith('bpi_01JTEST000000000000000001');
    });
  });

  describe('blueprint_create_item', () => {
    it('creates a new item with required fields', async () => {
      const result = await client.callTool({
        name: 'blueprint_create_item',
        arguments: { title: 'New task' },
      });

      expect(result.isError).toBeFalsy();
      const text = getResultText(result);
      const parsed = JSON.parse(text);
      expect(parsed.data.id).toBeDefined();
      expect(mockApiClient.createItem).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New task' }),
      );
    });

    it('passes all optional fields', async () => {
      await client.callTool({
        name: 'blueprint_create_item',
        arguments: {
          title: 'Detailed task',
          description: 'Some description',
          priority: 'critical',
          status: 'in_progress',
          assigned_to: 'user-1',
          parent_id: 'bpi_01JTEST000000000000000001',
          tag_ids: ['bpt_01JTEST000000000000000001'],
        },
      });

      expect(mockApiClient.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Detailed task',
          description: 'Some description',
          priority: 'critical',
          status: 'in_progress',
          assigned_to: 'user-1',
          parent_id: 'bpi_01JTEST000000000000000001',
          tag_ids: ['bpt_01JTEST000000000000000001'],
        }),
      );
    });
  });

  describe('blueprint_update_item', () => {
    it('updates item fields', async () => {
      const result = await client.callTool({
        name: 'blueprint_update_item',
        arguments: {
          id: 'bpi_01JTEST000000000000000001',
          fields: { title: 'Updated title', priority: 'high' },
        },
      });

      expect(result.isError).toBeFalsy();
      expect(mockApiClient.updateItem).toHaveBeenCalledWith(
        'bpi_01JTEST000000000000000001',
        expect.objectContaining({ title: 'Updated title', priority: 'high' }),
      );
    });
  });

  describe('blueprint_change_status', () => {
    it('transitions status with valid transition (pending -> in_progress)', async () => {
      const result = await client.callTool({
        name: 'blueprint_change_status',
        arguments: {
          id: 'bpi_01JTEST000000000000000001',
          new_status: 'in_progress',
        },
      });

      expect(result.isError).toBeFalsy();
      expect(mockApiClient.changeStatus).toHaveBeenCalledWith(
        'bpi_01JTEST000000000000000001',
        'in_progress',
      );
    });

    it('rejects invalid status transition (pending -> done)', async () => {
      const result = await client.callTool({
        name: 'blueprint_change_status',
        arguments: {
          id: 'bpi_01JTEST000000000000000001',
          new_status: 'done',
        },
      });

      expect(result.isError).toBe(true);
      const text = getResultText(result);
      expect(text).toContain('Status transition error');
      expect(text).toContain('Invalid transition');
      // changeStatus should NOT have been called because validation failed
      expect(mockApiClient.changeStatus).not.toHaveBeenCalledWith(
        'bpi_01JTEST000000000000000001',
        'done',
      );
    });
  });

  describe('blueprint_search_items', () => {
    it('searches items by query string', async () => {
      const result = await client.callTool({
        name: 'blueprint_search_items',
        arguments: { query: 'test' },
      });

      expect(result.isError).toBeFalsy();
      expect(mockApiClient.searchItems).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'test' }),
      );
    });

    it('passes optional filters alongside query', async () => {
      await client.callTool({
        name: 'blueprint_search_items',
        arguments: { query: 'bug', status: 'pending', priority: 'critical' },
      });

      expect(mockApiClient.searchItems).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'bug',
          status: 'pending',
          priority: 'critical',
        }),
      );
    });
  });

  describe('blueprint_add_comment', () => {
    it('adds a comment to an item', async () => {
      const result = await client.callTool({
        name: 'blueprint_add_comment',
        arguments: {
          item_id: 'bpi_01JTEST000000000000000001',
          content: 'This is a test comment',
        },
      });

      expect(result.isError).toBeFalsy();
      expect(mockApiClient.addComment).toHaveBeenCalledWith(
        'bpi_01JTEST000000000000000001',
        'This is a test comment',
      );
    });
  });

  describe('blueprint_list_tags', () => {
    it('lists all tags', async () => {
      const result = await client.callTool({
        name: 'blueprint_list_tags',
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      const text = getResultText(result);
      const parsed = JSON.parse(text);
      expect(parsed.data).toBeInstanceOf(Array);
      expect(parsed.data).toHaveLength(2);
      expect(mockApiClient.listTags).toHaveBeenCalled();
    });
  });

  describe('blueprint_assign_tag', () => {
    it('assigns a tag to an item', async () => {
      const result = await client.callTool({
        name: 'blueprint_assign_tag',
        arguments: {
          item_id: 'bpi_01JTEST000000000000000001',
          tag_id: 'bpt_01JTEST000000000000000001',
        },
      });

      expect(result.isError).toBeFalsy();
      expect(mockApiClient.assignTag).toHaveBeenCalledWith(
        'bpi_01JTEST000000000000000001',
        'bpt_01JTEST000000000000000001',
      );
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe('error handling', () => {
    it('returns isError=true when API client throws', async () => {
      const errorClient = createMockApiClient();
      (errorClient.getItem as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Item not found'),
      );

      const pair = await createClientServerPair(errorClient);

      try {
        const result = await pair.client.callTool({
          name: 'blueprint_get_item',
          arguments: { id: 'bpi_01JNOTFOUND0000000000000' },
        });

        expect(result.isError).toBe(true);
        const text = getResultText(result);
        expect(text).toContain('Item not found');
      } finally {
        await pair.client.close();
        await pair.mcpServer.close();
      }
    });

    it('returns isError=true when create fails due to API error', async () => {
      const errorClient = createMockApiClient();
      (errorClient.createItem as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Validation failed: title too long'),
      );

      const pair = await createClientServerPair(errorClient);

      try {
        const result = await pair.client.callTool({
          name: 'blueprint_create_item',
          arguments: { title: 'Valid title' },
        });

        expect(result.isError).toBe(true);
        const text = getResultText(result);
        expect(text).toContain('Validation failed');
      } finally {
        await pair.client.close();
        await pair.mcpServer.close();
      }
    });

    it('returns isError when input violates the Zod schema (title too long)', async () => {
      // The MCP SDK validates input against the Zod schema before calling
      // the handler. A title > 500 chars is rejected at the protocol level
      // and returned as a tool result with isError=true.
      const result = await client.callTool({
        name: 'blueprint_create_item',
        arguments: { title: 'x'.repeat(501) },
      });

      expect(result.isError).toBe(true);
      const text = getResultText(result);
      expect(text).toContain('too_big');
    });

    it('returns isError=true when listing tags fails', async () => {
      const errorClient = createMockApiClient();
      (errorClient.listTags as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database connection lost'),
      );

      const pair = await createClientServerPair(errorClient);

      try {
        const result = await pair.client.callTool({
          name: 'blueprint_list_tags',
          arguments: {},
        });

        expect(result.isError).toBe(true);
        const text = getResultText(result);
        expect(text).toContain('Database connection lost');
      } finally {
        await pair.client.close();
        await pair.mcpServer.close();
      }
    });

    it('returns isError=true when assigning tag fails', async () => {
      const errorClient = createMockApiClient();
      (errorClient.assignTag as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Tag not found'),
      );

      const pair = await createClientServerPair(errorClient);

      try {
        const result = await pair.client.callTool({
          name: 'blueprint_assign_tag',
          arguments: {
            item_id: 'bpi_01JTEST000000000000000001',
            tag_id: 'bpt_01JNOTFOUND0000000000000',
          },
        });

        expect(result.isError).toBe(true);
        const text = getResultText(result);
        expect(text).toContain('Tag not found');
      } finally {
        await pair.client.close();
        await pair.mcpServer.close();
      }
    });
  });
});

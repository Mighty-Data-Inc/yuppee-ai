import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

interface PreferencesStoreConfig {
  tableName?: string;
  region?: string;
  useMock?: boolean;
}

export class PreferencesStore {
  private readonly config: Required<PreferencesStoreConfig>;
  private readonly mockStore: Map<
    string,
    Record<string, Record<string, unknown>>
  >;
  private dynamoClient?: DynamoDBDocumentClient;

  constructor(config: PreferencesStoreConfig = {}) {
    this.config = {
      tableName:
        config.tableName ??
        process.env["DYNAMODB_TABLE_NAME"] ??
        "yuppee-preferences",
      region: config.region ?? process.env["AWS_REGION"] ?? "us-east-1",
      useMock: config.useMock ?? true,
    };
    this.mockStore = new Map();

    if (!this.config.useMock) {
      const client = new DynamoDBClient({ region: this.config.region });
      this.dynamoClient = DynamoDBDocumentClient.from(client);
    }
  }

  async getPreferences(
    userId: string,
  ): Promise<Record<string, Record<string, unknown>>> {
    if (this.config.useMock) {
      return this.mockStore.get(userId) ?? {};
    }

    return this.realGetPreferences(userId);
  }

  async savePreferences(
    userId: string,
    queryCategory: string,
    prefs: Record<string, unknown>,
  ): Promise<void> {
    if (this.config.useMock) {
      const existing = this.mockStore.get(userId) ?? {};
      this.mockStore.set(userId, { ...existing, [queryCategory]: prefs });
      return;
    }

    await this.realSavePreferences(userId, queryCategory, prefs);
  }

  private async realGetPreferences(
    userId: string,
  ): Promise<Record<string, Record<string, unknown>>> {
    if (!this.dynamoClient) throw new Error("DynamoDB client not initialized");

    const result = await this.dynamoClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { userId },
      }),
    );

    if (!result.Item) return {};

    const { preferences } = result.Item as {
      preferences?: Record<string, Record<string, unknown>>;
    };
    return preferences ?? {};
  }

  private async realSavePreferences(
    userId: string,
    queryCategory: string,
    prefs: Record<string, unknown>,
  ): Promise<void> {
    if (!this.dynamoClient) throw new Error("DynamoDB client not initialized");

    const existing = await this.realGetPreferences(userId);

    await this.dynamoClient.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          userId,
          preferences: { ...existing, [queryCategory]: prefs },
          updatedAt: new Date().toISOString(),
        },
      }),
    );
  }
}

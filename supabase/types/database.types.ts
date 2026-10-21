export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string;
          name: string;
          avatar: string | null;
          role: string;
          theme: string;
          language: string;
          preferredLlm: string;
          defaultCompression: string;
          isActive: boolean;
          emailVerified: boolean;
          lastLoginAt: string | null;
          lastLoginIp: string | null;
          failedLoginCount: number;
          lockedUntil: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          name: string;
          avatar?: string | null;
          role?: string;
          theme?: string;
          language?: string;
          preferredLlm?: string;
          defaultCompression?: string;
          isActive?: boolean;
          emailVerified?: boolean;
          lastLoginAt?: string | null;
          lastLoginIp?: string | null;
          failedLoginCount?: number;
          lockedUntil?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          name?: string;
          avatar?: string | null;
          role?: string;
          theme?: string;
          language?: string;
          preferredLlm?: string;
          defaultCompression?: string;
          isActive?: boolean;
          emailVerified?: boolean;
          lastLoginAt?: string | null;
          lastLoginIp?: string | null;
          failedLoginCount?: number;
          lockedUntil?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          userId: string;
          tokenHash: string;
          refreshHash: string;
          ipAddress: string | null;
          userAgent: string | null;
          expiresAt: string;
          revokedAt: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          tokenHash: string;
          refreshHash: string;
          ipAddress?: string | null;
          userAgent?: string | null;
          expiresAt: string;
          revokedAt?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          tokenHash?: string;
          refreshHash?: string;
          ipAddress?: string | null;
          userAgent?: string | null;
          expiresAt?: string;
          revokedAt?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      password_resets: {
        Row: {
          id: string;
          userId: string;
          tokenHash: string;
          usedAt: string | null;
          expiresAt: string;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          tokenHash: string;
          usedAt?: string | null;
          expiresAt: string;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          tokenHash?: string;
          usedAt?: string | null;
          expiresAt?: string;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "password_resets_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      api_keys: {
        Row: {
          id: string;
          userId: string;
          provider: string;
          label: string | null;
          encryptedKey: string;
          keyPrefix: string;
          keyFingerprint: string;
          isActive: boolean;
          lastUsedAt: string | null;
          usageCount: number;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          provider: string;
          label?: string | null;
          encryptedKey: string;
          keyPrefix: string;
          keyFingerprint: string;
          isActive?: boolean;
          lastUsedAt?: string | null;
          usageCount?: number;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          provider?: string;
          label?: string | null;
          encryptedKey?: string;
          keyPrefix?: string;
          keyFingerprint?: string;
          isActive?: boolean;
          lastUsedAt?: string | null;
          usageCount?: number;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          id: string;
          userId: string;
          filename: string;
          originalName: string;
          mimeType: string;
          size: number;
          documentType: string;
          language: string | null;
          content: string | null;
          pages: number | null;
          words: number | null;
          characters: number | null;
          tokens: number | null;
          storagePath: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          filename: string;
          originalName: string;
          mimeType: string;
          size: number;
          documentType: string;
          language?: string | null;
          content?: string | null;
          pages?: number | null;
          words?: number | null;
          characters?: number | null;
          tokens?: number | null;
          storagePath?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          filename?: string;
          originalName?: string;
          mimeType?: string;
          size?: number;
          documentType?: string;
          language?: string | null;
          content?: string | null;
          pages?: number | null;
          words?: number | null;
          characters?: number | null;
          tokens?: number | null;
          storagePath?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      compressions: {
        Row: {
          id: string;
          userId: string;
          documentId: string | null;
          originalText: string;
          compressedText: string;
          originalTokens: number;
          compressedTokens: number;
          compressionRatio: number;
          semanticScore: number;
          compressionLevel: string;
          requestedLevel: string | null;
          llmProvider: string | null;
          llmModel: string | null;
          documentType: string;
          language: string | null;
          originalCost: number;
          compressedCost: number;
          costSavings: number;
          latencyOriginalMs: number | null;
          latencyCompressedMs: number | null;
          latencyImprovement: number | null;
          processingTimeMs: number | null;
          accuracyTarget: number;
          metTarget: boolean;
          adaptiveFallback: boolean;
          status: string;
          errorMessage: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          documentId?: string | null;
          originalText: string;
          compressedText: string;
          originalTokens: number;
          compressedTokens: number;
          compressionRatio: number;
          semanticScore: number;
          compressionLevel: string;
          requestedLevel?: string | null;
          llmProvider?: string | null;
          llmModel?: string | null;
          documentType: string;
          language?: string | null;
          originalCost: number;
          compressedCost: number;
          costSavings: number;
          latencyOriginalMs?: number | null;
          latencyCompressedMs?: number | null;
          latencyImprovement?: number | null;
          processingTimeMs?: number | null;
          accuracyTarget?: number;
          metTarget?: boolean;
          adaptiveFallback?: boolean;
          status?: string;
          errorMessage?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          documentId?: string | null;
          originalText?: string;
          compressedText?: string;
          originalTokens?: number;
          compressedTokens?: number;
          compressionRatio?: number;
          semanticScore?: number;
          compressionLevel?: string;
          requestedLevel?: string | null;
          llmProvider?: string | null;
          llmModel?: string | null;
          documentType?: string;
          language?: string | null;
          originalCost?: number;
          compressedCost?: number;
          costSavings?: number;
          latencyOriginalMs?: number | null;
          latencyCompressedMs?: number | null;
          latencyImprovement?: number | null;
          processingTimeMs?: number | null;
          accuracyTarget?: number;
          metTarget?: boolean;
          adaptiveFallback?: boolean;
          status?: string;
          errorMessage?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compressions_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compressions_documentId_fkey";
            columns: ["documentId"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          }
        ];
      };
      compression_metrics: {
        Row: {
          id: string;
          compressionId: string;
          tokensSaved: number;
          wordsSaved: number;
          charactersSaved: number;
          moneySaved: number;
          latencyReduced: number;
          semanticSimilarity: number;
          reasoningRetention: number;
          estimatedAccuracy: number;
          approved: boolean;
          agentCount: number;
          agentTimings: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          compressionId: string;
          tokensSaved: number;
          wordsSaved: number;
          charactersSaved: number;
          moneySaved: number;
          latencyReduced: number;
          semanticSimilarity: number;
          reasoningRetention: number;
          estimatedAccuracy: number;
          approved?: boolean;
          agentCount?: number;
          agentTimings?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          compressionId?: string;
          tokensSaved?: number;
          wordsSaved?: number;
          charactersSaved?: number;
          moneySaved?: number;
          latencyReduced?: number;
          semanticSimilarity?: number;
          reasoningRetention?: number;
          estimatedAccuracy?: number;
          approved?: boolean;
          agentCount?: number;
          agentTimings?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compression_metrics_compressionId_fkey";
            columns: ["compressionId"];
            isOneToOne: true;
            referencedRelation: "compressions";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          userId: string;
          action: string;
          resource: string | null;
          resourceId: string | null;
          metadata: string | null;
          ipAddress: string | null;
          userAgent: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          action: string;
          resource?: string | null;
          resourceId?: string | null;
          metadata?: string | null;
          ipAddress?: string | null;
          userAgent?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          action?: string;
          resource?: string | null;
          resourceId?: string | null;
          metadata?: string | null;
          ipAddress?: string | null;
          userAgent?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      jobs: {
        Row: {
          id: string;
          userId: string;
          type: string;
          status: string;
          progress: number;
          stage: string;
          input: string;
          result: string | null;
          error: string | null;
          startedAt: string | null;
          completedAt: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          type: string;
          status?: string;
          progress?: number;
          stage?: string;
          input: string;
          result?: string | null;
          error?: string | null;
          startedAt?: string | null;
          completedAt?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          type?: string;
          status?: string;
          progress?: number;
          stage?: string;
          input?: string;
          result?: string | null;
          error?: string | null;
          startedAt?: string | null;
          completedAt?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      llm_provider_configs: {
        Row: {
          id: string;
          provider: string;
          name: string;
          defaultModel: string;
          contextWindow: number;
          costPer1kPrompt: number;
          costPer1kCompletion: number;
          is_enabled: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          provider: string;
          name: string;
          defaultModel: string;
          contextWindow?: number;
          costPer1kPrompt?: number;
          costPer1kCompletion?: number;
          is_enabled?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          name?: string;
          defaultModel?: string;
          contextWindow?: number;
          costPer1kPrompt?: number;
          costPer1kCompletion?: number;
          is_enabled?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_analytics_summary: {
        Args: {
          target_user_id: string;
        };
        Returns: {
          total_prompts: number;
          total_tokens_saved: number;
          avg_compression_ratio: number;
          avg_accuracy: number;
          total_money_saved: number;
          avg_latency_reduction: number;
        }[];
      };
      clean_expired_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      user_role: "admin" | "developer" | "researcher" | "guest";
      compression_level: "low" | "medium" | "high" | "extreme";
      job_status: "queued" | "running" | "completed" | "failed" | "cancelled";
      job_type: "compression" | "ocr" | "ocr-compress";
      llm_provider:
        | "openai"
        | "gemini"
        | "anthropic"
        | "deepseek"
        | "mistral"
        | "llama"
        | "ollama";
    };
  };
};

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cache: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("byKey", ["key"]),
  documents: defineTable({
    embedding: v.array(v.number()),
    text: v.string(),
    metadata: v.any(),
  }).vectorIndex("byEmbedding", {
    vectorField: "embedding",
    dimensions: 1536,
  }),
  messages: defineTable({
    sessionId: v.string(),
    message: v.object({
      type: v.string(),
      data: v.object({
        content: v.string(),
        role: v.optional(v.string()),
        name: v.optional(v.string()),
        additional_kwargs: v.optional(v.any()),
        response_metadata: v.optional(v.any()),
        id: v.optional(v.string()),
        invalid_tool_calls: v.optional(v.array(v.any())),
        tool_calls: v.optional(v.array(v.any())),
      }),
    }),
  }).index("bySessionId", ["sessionId"]),
});

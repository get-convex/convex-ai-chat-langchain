import { v } from "convex/values";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ConvexChatMessageHistory } from "@langchain/community/stores/message/convex";
import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { internalAction } from "./_generated/server";

const OPENAI_MODEL = "gpt-3.5-turbo";

export const answer = internalAction({
  args: {
    sessionId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { sessionId, message }) => {
    const vectorStore = new ConvexVectorStore(new OpenAIEmbeddings(), { ctx });

    const model = new ChatOpenAI({ modelName: OPENAI_MODEL });
    const memory = new BufferMemory({
      chatHistory: new ConvexChatMessageHistory({ sessionId, ctx }),
      memoryKey: "chat_history",
      outputKey: "text",
      returnMessages: true,
    });
    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(),
      { memory }
    );

    await chain.call({ question: message });
  },
});

"use node";

import { load } from "cheerio";
import { v } from "convex/values";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { CacheBackedEmbeddings } from "langchain/embeddings/cache_backed";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ConvexKVStore } from "langchain/storage/convex";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ConvexVectorStore } from "langchain/vectorstores/convex";
import { map } from "modern-async";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

export const scrapeAndEmbedSite = internalAction({
  args: {
    sitemapUrl: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { sitemapUrl, limit }) => {
    const response = await fetch(sitemapUrl);
    const xml = await response.text();
    const $ = load(xml, { xmlMode: true });
    const urls = $("url > loc")
      .map((i, elem) => $(elem).text())
      .get()
      .slice(0, limit);
    await map(urls, (url) =>
      ctx.runAction(internal.ingest.load.fetchAndEmbedSingle, { url })
    );
  },
});

export const fetchAndEmbedSingle = internalAction({
  args: {
    url: v.string(),
  },
  handler: async (ctx, { url }) => {
    const loader = new CheerioWebBaseLoader(url);
    const data = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(data);

    const embeddings = new CacheBackedEmbeddings({
      underlyingEmbeddings: new OpenAIEmbeddings(),
      documentEmbeddingStore: new ConvexKVStore({ ctx }),
    });

    await ConvexVectorStore.fromDocuments(splitDocs, embeddings, { ctx });
  },
});

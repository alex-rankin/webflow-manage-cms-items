const axios = require("axios");
const dotenv = require("dotenv").config();
const Bottleneck = require("bottleneck");

const API_TOKEN = process.env.API_TOKEN;
const SITE_ID = process.env.SITE_ID;
const BASE_URL = process.env.BASE_URL;

const limiter = new Bottleneck({
  minTime: 1000, // 1 second between requests (60 requests per minute)
});

async function getCollections() {
  try {
    const response = await limiter.schedule(() =>
      axios.get(`${BASE_URL}/v2/sites/${SITE_ID}/collections`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Accept-Version": "1.0.0",
        },
      })
    );
    return response.data.collections;
  } catch (error) {
    console.error("Error getting collections:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function getCollectionItems(collectionId) {
  let items = [];
  let offset = 0;
  const limit = 100;

  try {
    while (true) {
      const response = await limiter.schedule(() =>
        axios.get(`${BASE_URL}/v2/collections/${collectionId}/items`, {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Accept-Version": "1.0.0",
          },
          params: {
            offset,
            limit,
          },
        })
      );

      items = items.concat(response.data.items);
      offset += limit;

      if (response.data.items.length < limit) {
        break;
      }
    }

    return items;
  } catch (error) {
    console.error("Error getting collection items:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function deleteCollectionItem(collectionId, itemId) {
  try {
    const response = await limiter.schedule(() =>
      axios.delete(`${BASE_URL}/v2/collections/${collectionId}/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Accept-Version": "1.0.0",
          "Content-Type": "application/json",
        },
      })
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting collection item with ID ${itemId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
}

async function processCollection(collectionId) {
  const items = await getCollectionItems(collectionId);
  for (const item of items) {
    try {
      await deleteCollectionItem(collectionId, item.id);
      console.log(`Deleted item with ID ${item.id} in collection ${collectionId}`);
    } catch (error) {
      console.error(`Error deleting item ${item.id} in collection ${collectionId}`, error.message);
      continue; // Skip to the next item
    }
  }
}

async function main() {
  try {
    console.log("Processing all collections");
    const collections = await getCollections();
    for (const collection of collections) {
      await processCollection(collection.id);
    }
  } catch (error) {
    console.error("Error in main process:", error.message);
  }
}

main();

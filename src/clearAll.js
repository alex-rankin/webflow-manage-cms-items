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

async function getCollectionDetails(collectionId) {
  try {
    const response = await limiter.schedule(() =>
      axios.get(`${BASE_URL}/v2/collections/${collectionId}`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Accept-Version": "1.0.0",
        },
      })
    );
    return response.data;
  } catch (error) {
    console.error("Error getting collection details:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function updateField(collectionId, fieldId) {
  try {
    await limiter.schedule(() =>
      axios.patch(
        `${BASE_URL}/v2/collections/${collectionId}/fields/${fieldId}`,
        {
          isRequired: false,
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Accept-Version": "1.0.0",
            "Content-Type": "application/json",
          },
        }
      )
    );
  } catch (error) {
    console.error("Error updating field:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function updateCollectionFields(collectionId) {
  try {
    const collectionDetails = await getCollectionDetails(collectionId);
    const fields = collectionDetails.fields;
    for (const field of fields) {
      if (field.slug !== "name" && field.slug !== "slug" && field.isRequired) {
        await updateField(collectionId, field.id);
        console.log(`Updated field ${field.slug} in collection ${collectionId}`);
      }
    }
  } catch (error) {
    console.error("Error updating collection fields:", error.message);
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

async function patchCollectionItem(collectionId, itemId, fieldData) {
  try {
    const updatedFieldData = { ...fieldData };
    for (const key in updatedFieldData) {
      if (key !== "name" && key !== "slug") {
        updatedFieldData[key] = "";
      }
    }

    const response = await limiter.schedule(() =>
      axios.patch(
        `${BASE_URL}/v2/collections/${collectionId}/items/${itemId}`,
        {
          fieldData: updatedFieldData,
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Accept-Version": "1.0.0",
            "Content-Type": "application/json",
          },
        }
      )
    );
    return response.data;
  } catch (error) {
    console.error(`Error patching collection item with ID ${itemId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
}

async function processCollection(collectionId) {
  await updateCollectionFields(collectionId);
  const items = await getCollectionItems(collectionId);
  for (const item of items) {
    try {
      await patchCollectionItem(collectionId, item.id, item.fieldData);
      console.log(`Patched item with ID ${item.id} in collection ${collectionId}`);
    } catch (error) {
      console.error(`Error patching item ${item.id} in collection ${collectionId}`, error.message);
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

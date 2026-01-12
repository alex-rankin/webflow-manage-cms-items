# Webflow CMS Items Manager

This project provides 4x scripts to manage Webflow CMS items by updating required fields and clearing fields in batch mode. In the rare cases where you have a deeply multi referenced site with a lot of CMS data it can take a long time to untangle.

By getting the collections and removing required fields we can clear every connection within an item and once done just run delete scripts to remove all data completely if needed.

The scripts are rate-limited to avoid hitting Webflow's rate limits.

**USE AT YOUR OWN RISK. You are responsible for any data errors and/or manipulations caused on your Webflow site.**

## Prerequisites

- Node.js
- Yarn / NPM
- A Webflow API token

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/alex-rankin/webflow-manage-cms-items.git
   cd webflow-manage-cms-items
   ```

2. Install the dependencies:

   ```bash
   yarn install
   ```

3. Create a `.env` file in the root directory of your project and add the following:
   ```plaintext
   API_TOKEN=your_webflow_api_token
   SITE_ID=your_webflow_site_id
   BASE_URL=https://api.webflow.com
   ```

## Usage

### Clear All Collections

This script processes all collections, updates required fields to be not required, and clears fields except for `name` and `slug`.

```bash
npm run clearall
```

### Clear Specific Individual Collection

This script processes a specific collection, updates required fields to be not required, and clears fields except for name and slug.

```bash
npm run clearspecific -- <collection_id>
```

### Delete ALL Collections Items

This script deletes all items within all collections on the site. It retrieves all collections and their items, then deletes each item one by one. This is useful when you need to clear out all data across your entire Webflow site.

```bash
npm run deleteall
```

### Delete ALL Specific Collection Items

This script deletes all items within a specified collection. You need to provide the collection ID as an argument. The script retrieves all items in the specified collection and deletes each item one by one. This is useful when you need to clear out data from a specific collection without affecting other collections.

```bash
npm run deletespecific -- <collection_id>
```

### Rate Limiting

The scripts use the `bottleneck` library to limit API requests to 60 requests per minute to stay within Webflow's rate limits.

### Contributing

Feel free to submit issues and pull requests. For major changes, please open an issue first to discuss what you would like to change.

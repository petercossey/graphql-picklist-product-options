## Querying inventory for pick list options on a product using the GraphQL API

Quick demo/screencast for using Storefront GraphQL API to grab inventory for Pick List options: https://www.loom.com/share/6c4bc96d9500405194d1343c65b86046?sid=3f599386-9baa-4fc1-9ca6-97be3429f9eb

Here's a summary of the approach:

1. We first query the product details using its ID, which includes information about the product's pick list options.
1. From this initial query, we extract the product IDs associated with each pick list option.
1. We then make a second query using these extracted product IDs to fetch the inventory information for each option.
1. Finally, we merge the product option data with the corresponding inventory data, creating a comprehensive view of each pick list option and its current inventory status.

This two-step query process allows us to efficiently retrieve both the product structure (options) and the real-time inventory data for those options, providing a complete picture of the product's available configurations and their stock levels.
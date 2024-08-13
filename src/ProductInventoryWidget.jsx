import React, { useState, useCallback } from 'react';

const GRAPHQL_ENDPOINT = 'https://peters-everything2-store.mybigcommerce.com/graphql';

const ProductInventoryWidget = () => {
  const [productId, setProductId] = useState('370');
  const [authToken, setAuthToken] = useState('');
  const [productData, setProductData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!authToken) {
      setError('Please enter an authentication token');
      return;
    }

    if (!productId) {
      setError('Please enter a product ID');
      return;
    }

    setLoading(true);
    setError(null);
    setProductData(null);
    setInventoryData(null);

    try {
      const parsedProductId = parseInt(productId, 10);
      if (isNaN(parsedProductId)) {
        throw new Error('Invalid product ID');
      }

      // Fetch product data
      const productQuery = `
        query getProductPackageInfo($productId: Int!) {
          site {
            product(entityId: $productId) {
              name
              sku
              productOptions {
                edges {
                  node {
                    ... on MultipleChoiceOption {
                      displayName
                      values {
                        edges {
                          node {
                            ... on ProductPickListOptionValue {
                              productId
                              defaultImage {
                                url(width: 240)
                              }
                              entityId
                              label
                              isDefault
                              isSelected
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const productResponse = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: productQuery,
          variables: { productId: parsedProductId },
        }),
      });

      const productResult = await productResponse.json();
      if (productResult.errors) {
        throw new Error(productResult.errors[0].message);
      }
      setProductData(productResult.data.site.product);

      // Extract product IDs for inventory query
      const productIds = productResult.data.site.product.productOptions.edges
        .flatMap(edge => edge.node.values.edges
          .map(valueEdge => valueEdge.node.productId));

      // Fetch inventory data
      const inventoryQuery = `
        query getMealOptionInventory($entityIds: [Int!]) {
          site {
            products(entityIds: $entityIds) {
              edges {
                node {
                  name
                  sku
                  entityId
                  inventory {
                    aggregated {
                      availableToSell
                      warningLevel
                    }
                    isInStock
                  }
                }
              }
            }
          }
        }
      `;

      const inventoryResponse = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: inventoryQuery,
          variables: { entityIds: productIds },
        }),
      });

      const inventoryResult = await inventoryResponse.json();
      if (inventoryResult.errors) {
        throw new Error(inventoryResult.errors[0].message);
      }
      setInventoryData(inventoryResult.data.site.products.edges);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId, authToken]);

  return (
    <div className="product-inventory-widget">
      <div className="input-container">
        <input
          type="text"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
          placeholder="Enter Auth Token"
          style={{ width: '300px', marginRight: '10px' }}
        />
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Enter Product ID"
          style={{ width: '150px', marginRight: '10px' }}
        />
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {productData && inventoryData && (
        <>
          <h2>{productData.name} - Inventory</h2>
          <table>
            <thead>
              <tr>
                <th>Product Option</th>
                <th>Option Name</th>
                <th>Option Product ID</th>
                <th>Image</th>
                <th>Inventory Available</th>
                <th>Inventory Warning</th>
              </tr>
            </thead>
            <tbody>
              {productData.productOptions.edges.flatMap(edge =>
                edge.node.values.edges.map(valueEdge => {
                  const inventoryItem = inventoryData.find(item => item.node.entityId === valueEdge.node.productId);
                  return (
                    <tr key={valueEdge.node.entityId}>
                      <td>{edge.node.displayName}</td>
                      <td>{valueEdge.node.label}</td>
                      <td>{valueEdge.node.productId}</td>
                      <td>
                        <img src={valueEdge.node.defaultImage.url} alt={valueEdge.node.label} style={{width: '64px', height: '64px', objectFit: 'cover'}} />
                      </td>
                      <td>{inventoryItem?.node.inventory.aggregated.availableToSell ?? 'N/A'}</td>
                      <td>{inventoryItem?.node.inventory.aggregated.warningLevel ?? 'N/A'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ProductInventoryWidget;
import { useState } from "react";
import { useParams, useNavigate } from "react-router";

export default function ProductGroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ id: string; title: string; handle: string }>
  >([]);
  const handleSelectProducts = async () => {
    const selected = await shopify.resourcePicker({
      type: 'product',
      multiple: true
    });
    const products = selected.map((p: any) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
    }));
    setSelectedProducts(products);

    console.log('Selected products', products, selectedProducts);
  };
  return (
    <s-page heading="New product group">
      <s-section>
        <s-text-field
            label="Group title:"
            value={title}
            placeholder="Product Colors"
        />
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-heading>Products:</s-heading>
          <s-button onClick={handleSelectProducts}>
            Search products
          </s-button>
        </s-stack>
      </s-section>
      {selectedProducts.length > 0 && (
        <s-section padding="none">
            <s-table>
                <s-table-header-row>
                    <s-table-header>Name</s-table-header>
                    <s-table-header>Handle</s-table-header>
                </s-table-header-row>
                <s-table-body>
                    {selectedProducts.map((p) => (
                        <s-table-row key={p.id}>
                            <s-table-cell>{p.title}</s-table-cell>
                            <s-table-cell>{p.handle}</s-table-cell>
                        </s-table-row>
                    ))}
                </s-table-body>
            </s-table>
        </s-section>
      )}
    </s-page>
  );
}

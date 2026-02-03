import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { createProductGroup } from "../models/ProductGroup.server";
import { useFetcher } from "react-router";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const products = JSON.parse(formData.get("products") as string);

  await createProductGroup(session.shop, title);

  return null;
}

export default function ProductGroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();
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
  };
  const handleSaveGroup = () => {
    fetcher.submit(
      {
        title,
        products: JSON.stringify(selectedProducts),
      },
      { method: "post" }
    );
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
        <s-section>
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
          <s-grid gap="small-200" gridTemplateColumns="1fr auto">
            <s-button-group>
              <s-button slot="primary-action">Save</s-button>
              <s-button slot="secondary-actions" onClick={handleSaveGroup}>Cancel</s-button>
            </s-button-group>
          </s-grid>
        </s-section>
      )}
    </s-page>
  );
}

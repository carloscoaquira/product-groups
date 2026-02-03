import { useState } from "react";
import { useParams, useNavigate, useFetcher } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { saveProductGroup } from "../models/ProductGroup.server";

/* =========================
   ACTION
========================= */

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const products = JSON.parse(formData.get("products") as string);

  const result = await saveProductGroup({
    shop: session.shop,
    title,
    products,
  });

  return result;
}

/* =========================
   PAGE
========================= */

export default function ProductGroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [title, setTitle] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ id: string; title: string; handle: string }>
  >([]);

  const handleSubmit = (event) => {
    event.preventDefault();

    fetcher.submit(
      {
        title,
        products: JSON.stringify(
          selectedProducts.map((p) => ({
            handle: p.handle,
            title: p.title,
          }))
        ),
      },
      {
        method: "post",
      }
    );
  };

  const handleSelectProducts = async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      multiple: true,
    });

    const products = selected.map((p: any) => ({
      handle: p.handle,
      title: p.title,
    }));

    setSelectedProducts(products);
  };

  return (
    <s-page heading="New product group">
      <form onSubmit={handleSubmit} data-save-bar>
        <s-section>
          <s-text-field
            label="Group title:"
            name="title"
            required
            placeholder="Product Colors"
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          <s-stack direction="inline" gap="small-200" alignItems="center">
            <s-heading>Products:</s-heading>
            <s-button onClick={handleSelectProducts}>
              Search products
            </s-button>
          </s-stack>

          <s-stack paddingBlockStart="large">
            <s-button variant="primary" type="submit">
              Save product
            </s-button>
          </s-stack>
        </s-section>

        <s-divider />
      </form>

      {selectedProducts.length > 0 && (
        <s-section padding="none">
          <s-table>
            <s-table-header-row>
              <s-table-header>Name</s-table-header>
              <s-table-header>Handle</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {selectedProducts.map((p) => (
                <s-table-row key={p.handle}>
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

import { useState, useEffect } from "react";
import {
  useLoaderData,
  useParams,
  useFetcher,
} from "react-router";
import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import {
  saveProductGroup,
  getProductGroupById,
  deleteProductGroup,
  updateProductGroup,
} from "../models/ProductGroup.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

/* =========================
   LOADER
========================= */

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  if (params.id === "new") {
    return {
      id: null,
      title: "",
      products: [],
    };
  }

  const group = await getProductGroupById(shop, params.id!);

  if (!group) {
    throw new Response("Not Found", { status: 404 });
  }

  return group;
}

/* =========================
   ACTION
========================= */

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  /* -------- DELETE -------- */
  if (request.method === "DELETE") {
    const formData = await request.formData();
    const groupId = formData.get("groupId") as string;

    await deleteProductGroup(session.shop, groupId);

    return redirect("/app");
  }

  /* -------- CREATE / UPDATE -------- */
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const products = JSON.parse(formData.get("products") as string);

  // UPDATE
  if (params.id && params.id !== "new") {
    return updateProductGroup(params.id, {
      shop: session.shop,
      title,
      products,
    });
  }

  // CREATE
  const result = await saveProductGroup({
    shop: session.shop,
    title,
    products,
  });

  if (result.success) {
    return redirect(`/app/productgroups/${result.group!.id}`);
  }

  return result;
}

/* =========================
   PAGE
========================= */

type LoaderData = {
  id: string | null;
  title: string;
  products: Array<{
    title: string;
    handle: string;
  }>;
};

export default function ProductGroupPage() {
  const { id } = useParams();
  const fetcher = useFetcher();

  const group = useLoaderData<LoaderData>();

  const [title, setTitle] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ title: string; handle: string }>
  >([]);

  /* =========================
     HYDRATE STATE (EDIT MODE)
  ========================= */

  useEffect(() => {
    if (!group) return;

    setTitle(group.title || "");
    setSelectedProducts(
      group.products?.map((p) => ({
        title: p.title,
        handle: p.handle,
      })) || []
    );
  }, [group]);

  /* =========================
     HANDLERS
  ========================= */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
      { method: "post" }
    );
  };

  const handleSelectProducts = async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      multiple: true,
    });

    if (!selected) return;

    const products = selected.map((p: any) => ({
      handle: p.handle,
      title: p.title,
    }));

    setSelectedProducts(products);
  };

  const removeGroup = () => {
    if (!id || id === "new") return;

    fetcher.submit(
      { groupId: id },
      { method: "delete" }
    );
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <form onSubmit={handleSubmit} data-save-bar>
      <s-page
        heading={id === "new" ? "New product group" : "Edit product group"}
      >
        <s-section>
          <s-text-field
            label="Group title:"
            required
            placeholder="Product Colors"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          <s-stack direction="inline" gap="small-200" alignItems="center">
            <s-heading>Products:</s-heading>
            <s-button onClick={handleSelectProducts}>
              Search products
            </s-button>
          </s-stack>

          <s-stack paddingBlockStart="large">
            <s-button
              variant="primary"
              type="submit"
              loading={fetcher.state === "submitting"}
            >
              Save product group
            </s-button>
          </s-stack>

          {selectedProducts.length > 0 && (
            <s-stack paddingBlockStart="large" border="small-500">
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
            </s-stack>
          )}
        </s-section>

        {id !== "new" && (
          <s-section>
            <s-button
              tone="critical"
              onClick={removeGroup}
              loading={fetcher.state === "submitting"}
            >
              Delete
            </s-button>
          </s-section>
        )}
      </s-page>
    </form>
  );
}

/* =========================
   HEADERS (SHOPIFY)
========================= */

export const headers = (headersArgs: any) => {
  return boundary.headers(headersArgs);
};

import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/* =========================
   TYPES
========================= */

type ProductItem = {
  id: string;
  title: string;
  handle: string;
};

type ProductGroup = {
  id: string;
  title: string;
  products: ProductItem[];
};

type LoaderData = {
  shop: string;
  productHandle: string;
  groups: ProductGroup[];
};

/* =========================
   LOADER (APP PROXY)
========================= */

export async function loader({ request }: LoaderFunctionArgs) {
  // Validación obligatoria App Proxy
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);

  const shop = url.searchParams.get("shop");
  const productHandle = url.searchParams.get("product_handle");

  if (!shop) {
    return new Response("Missing shop parameter", { status: 400 });
  }

  if (!productHandle) {
    return new Response("Missing product_handle", { status: 400 });
  }

  // 🔹 CONSULTA REAL A TU DB
  const groups = await db.productGroup.findMany({
    where: {
      shop,
      products: {
        some: {
          handle: productHandle,
        },
      },
    },
    include: {
      products: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const data: LoaderData = {
    shop,
    productHandle,
    groups,
  };

  return data;
}

/* =========================
   HTML OUTPUT (STORE FRONT)
========================= */

export default function CustomProductGroups() {
  const { groups, productHandle } =
    useLoaderData<LoaderData>();

  if (groups.length === 0) {
    return null; // no renderiza nada en el theme
  }

  return (
    <div className="custom-product-groups">
      <h3>Related product groups</h3>

      {groups.map((group) => (
        <div key={group.id} className="product-group">
          <h4>{group.title}</h4>

          <ul>
            {group.products.map((product) => (
              <li
                key={product.id}
                style={{
                  opacity:
                    product.handle === productHandle ? 0.6 : 1,
                }}
              >
                {product.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

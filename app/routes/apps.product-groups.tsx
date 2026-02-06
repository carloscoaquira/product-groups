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
  image?: string;
  url?: string;
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
   STOREFRONT QUERY
========================= */

const STOREFRONT_QUERY = `
  query {
    products(first: 50) {
      nodes {
        handle
        title
        onlineStoreUrl
        featuredImage {
          url
          altText
        }
      }
    }
  }
`;

/* =========================
   SHOPIFY FETCH
========================= */

async function fetchProductsFromShopify(
  shop: string,
  handles: string[]
) {
  const response = await fetch(
    `https://${shop}/api/2024-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token":
          process.env.SHOPIFY_STOREFRONT_TOKEN!,
      },
      body: JSON.stringify({
        query: STOREFRONT_QUERY,
      }),
    }
  );

  const json = await response.json();

  const products = json?.data?.products?.nodes ?? [];

  return products.filter((p: any) =>
    handles.includes(p.handle)
  );
}

/* =========================
   LOADER (APP PROXY)
========================= */

export async function loader({ request }: LoaderFunctionArgs) {
  // 🔐 Validación obligatoria App Proxy
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

  // 🔹 DB query
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

  if (groups.length === 0) {
    return {
      shop,
      productHandle,
      groups: [],
    };
  }

  // 🔹 Handles únicos
  const handles = [
    ...new Set(
      groups.flatMap((g) =>
        g.products.map((p) => p.handle)
      )
    ),
  ];

  // 🔹 Shopify fetch
  const shopifyProducts = await fetchProductsFromShopify(
    shop,
    handles
  );

  // 🔹 Merge DB + Shopify
  const groupsWithImages: ProductGroup[] = groups.map(
    (group) => ({
      id: group.id,
      title: group.title,
      products: group.products.map((p) => {
        const sp = shopifyProducts.find(
          (x: any) => x.handle === p.handle
        );

        return {
          id: p.id,
          title: p.title,
          handle: p.handle,
          image: sp?.featuredImage?.url,
          url: sp?.onlineStoreUrl,
        };
      }),
    })
  );

  const data: LoaderData = {
    shop,
    productHandle,
    groups: groupsWithImages,
  };

  return data;
}

/* =========================
   HTML OUTPUT (STOREFRONT)
========================= */

export default function CustomProductGroups() {
  const { groups, productHandle } =
    useLoaderData<LoaderData>();

  if (groups.length === 0) return null;

  return (
    <div className="custom-product-groups">
      <h3>Related product groups</h3>

      {groups.map((group) => (
        <div key={group.id} className="product-group">
          <h4>{group.title}</h4>

          <ul className="product-group-list">
            {group.products.map((product) => (
              <li
                key={product.id}
                className="product-group-item"
                style={{
                  opacity:
                    product.handle === productHandle ? 0.6 : 1,
                }}
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    width={80}
                    height={80}
                  />
                )}

                {product.url ? (
                  <a href={product.url}>
                    {product.title}
                  </a>
                ) : (
                  <span>{product.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

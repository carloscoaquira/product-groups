import db from "../db.server";

/* =========================
   TYPES
========================= */

export type GroupProductInput = {
  handle: string;
  title: string;
};

export type ProductGroupInput = {
  shop: string;
  title: string;
  products: GroupProductInput[];
};

/* =========================
   QUERIES
========================= */

/**
 * Obtener todos los grupos de un shop
 * Devuelve [] si no existen
 */
export async function getProductGroups(shop: string) {
  const groups = await db.productGroup.findMany({
    where: { shop },
    include: { products: true },
    orderBy: { createdAt: "desc" },
  });

  if (groups.length === 0) {
    return [];
  }

  return groups;
}

/* =========================
   VALIDATION
========================= */

/**
 * Validación estilo validateQRCode
 * No lanza errores, retorna un objeto o null
 */
export function validateProductGroup(data: ProductGroupInput) {
  const errors: Record<string, string> = {};

  if (!data.shop) {
    errors.shop = "Shop is required";
  }

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.products || data.products.length === 0) {
    errors.products = "At least one product is required";
  }

  data.products?.forEach((product, index) => {
    if (!product.handle) {
      errors[`products.${index}.handle`] = "Product handle is required";
    }

    if (!product.title) {
      errors[`products.${index}.title`] = "Product title is required";
    }
  });

  if (Object.keys(errors).length) {
    return errors;
  }

  return null;
}

/* =========================
   MUTATIONS
========================= */

/**
 * Crear un grupo con productos
 * Retorna { errors } o { group }
 */
export async function saveProductGroup(data: ProductGroupInput) {
  const errors = validateProductGroup(data);

  if (errors) {
    return { 
      success: false as const,
      errors
    };
  }

  return db.$transaction(async (tx) => {
    const group = await tx.productGroup.create({
      data: {
        shop: data.shop,
        title: data.title,
      },
    });

    await tx.productGroupItem.createMany({
      data: data.products.map((product) => ({
        groupId: group.id,
        handle: product.handle,
        title: product.title,
      })),
    });

    const fullGroup = await tx.productGroup.findUnique({
      where: { id: group.id },
      include: { products: true },
    });

    return {
      sucess: true as const,
      group: fullGroup
    };
  });
}

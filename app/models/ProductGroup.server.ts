import invariant from "tiny-invariant";
import db from "../db.server";

/* =========================
   PRODUCT GROUPS
========================= */

/**
 * Obtener un grupo por ID y shop
 */
export async function getProductGroup(id: string, shop: string) {
  return db.productGroup.findFirst({
    where: {
      id,
      shop,
    },
    include: {
      products: true, // relación products
    },
  });
}

/**
 * Obtener todos los grupos de un shop
 */
export async function getProductGroups(shop: string) {
  return db.productGroup.findMany({
    where: { shop },
    include: {
      products: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Crear un nuevo grupo de productos
 */
export async function createProductGroup(
  shop: string,
  title: string
) {
  invariant(shop, "Shop is required");
  invariant(title, "Title is required");

  return db.productGroup.create({
    data: {
      shop,
      title,
    },
  });
}

/**
 * Eliminar un grupo de productos
 */
export async function deleteProductGroup(id: string, shop: string) {
  return db.productGroup.deleteMany({
    where: {
      id,
      shop,
    },
  });
}

/* =========================
   PRODUCT GROUP ITEMS
========================= */

/**
 * Agregar un producto a un grupo
 */
export async function addProductToGroup({
  groupId,
  handle,
  title,
}: {
  groupId: string;
  handle: string;
  title: string;
}) {
  invariant(groupId, "Group ID is required");
  invariant(handle, "Handle is required");
  invariant(title, "Title is required");

  return db.productGroupItem.create({
    data: {
      groupId,
      handle,
      title,
    },
  });
}

/**
 * Eliminar un producto de un grupo
 */
export async function removeProductFromGroup(itemId: string) {
  return db.productGroupItem.deleteMany({
    where: {
      id: itemId,
    },
  });
}

/**
 * Obtener todos los productos de un grupo
 */
export async function getGroupItems(groupId: string) {
  return db.productGroupItem.findMany({
    where: {
      groupId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

import db from "../db.server";
import invariant from "tiny-invariant";

/*TYPES*/
export type GroupProductInput = {
  handle: string;
  title: string;
};
export type ProductGroupInput = {
  shop: string;
  title: string;
  products: GroupProductInput[];
};

/*QUERIES*/
/**Obtener todos los grupos sin productos**/
export async function getProductGroups(shop: string) {
  return db.productGroup.findMany({
    where: { shop },
    include: { products: true },
    orderBy: { createdAt: "desc" },
  });
}
/**Obtener un grupo específico con sus productos**/
export async function getProductGroupById(
  shop: string,
  groupId: string
) {
  return db.productGroup.findFirst({
    where: { id: groupId, shop },
    include: { products: true },
  });
}

/*VALIDATION*/
export function validateProductGroup(data: ProductGroupInput) {
  const errors: Record<string, string> = {};
  if (!data.shop) errors.shop = "Shop is required";
  if (!data.title) errors.title = "Title is required";
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
  return Object.keys(errors).length ? errors : null;
}

/*MUTATIONS*/
/**CREAR**/
export async function saveProductGroup(data: ProductGroupInput) {
  const errors = validateProductGroup(data);
  if (errors) {
    return { success: false as const, errors };
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
    return { success: true as const, group: fullGroup };
  });
}
/**Editar,reemplaza título y productos**/
export async function updateProductGroup(
  groupId: string,
  data: ProductGroupInput
) {
  invariant(groupId, "Group ID is required");
  const errors = validateProductGroup(data);
  if (errors) {
    return { success: false as const, errors };
  }
  return db.$transaction(async (tx) => {
    // Asegurar pertenencia al shop
    const existing = await tx.productGroup.findFirst({
      where: { id: groupId, shop: data.shop },
    });
    if (!existing) {
      throw new Error("Group not found");
    }
    await tx.productGroup.update({
      where: { id: groupId },
      data: { title: data.title },
    });
    // Limpiar productos actuales
    await tx.productGroupItem.deleteMany({
      where: { groupId },
    });
    // Insertar nuevos productos
    await tx.productGroupItem.createMany({
      data: data.products.map((product) => ({
        groupId,
        handle: product.handle,
        title: product.title,
      })),
    });
    const fullGroup = await tx.productGroup.findUnique({
      where: { id: groupId },
      include: { products: true },
    });
    return { success: true as const, group: fullGroup };
  });
}
/**ELIMINAR**/
export async function deleteProductGroup(
  shop: string,
  groupId: string
) {
  invariant(groupId, "Group ID is required");
  const group = await db.productGroup.findFirst({
    where: { id: groupId, shop },
  });
  return db.$transaction(async (tx) => {
    // Delete all product items first
    await tx.productGroupItem.deleteMany({
      where: { groupId },
    });
    // Then delete the product group
    await tx.productGroup.delete({
      where: { id: groupId },
    });
    return { success: true as const };
  });
}

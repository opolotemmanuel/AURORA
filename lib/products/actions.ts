"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { CATALOG_CONTEXT_TAG } from "@/lib/ai/context/catalog"
import { requireAdmin } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { normalizeProductInput } from "@/lib/products/normalize"
import { productFormSchema, productSchema } from "@/lib/products/schemas"

export async function listProductsAction() {
  await requireAdmin()
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  })
}

export async function createProductAction(input: unknown) {
  const session = await requireAdmin()
  const form = productFormSchema.parse(input)
  const data = productSchema.parse(normalizeProductInput(form))

  const product = await prisma.product.create({
    data: {
      ...data,
      imageUrl: data.imageUrl || null,
      storeUrl: data.storeUrl || null,
      createdById: session.user.id,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/products")
  revalidateTag(CATALOG_CONTEXT_TAG, "max")
  return product
}

export async function updateProductAction(id: string, input: unknown) {
  await requireAdmin()
  const form = productFormSchema.parse(input)

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { sku: true, slug: true },
  })
  if (!existing) {
    throw new Error("Product not found")
  }

  const data = productSchema.parse(
    normalizeProductInput(form, {
      existingSku: existing.sku,
      existingSlug: existing.slug,
    }),
  )

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      imageUrl: data.imageUrl || null,
      storeUrl: data.storeUrl || null,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/products")
  revalidateTag(CATALOG_CONTEXT_TAG, "max")
  return product
}

export async function deleteProductAction(id: string) {
  await requireAdmin()
  await prisma.product.delete({ where: { id } })
  revalidatePath("/admin")
  revalidatePath("/admin/products")
  revalidateTag(CATALOG_CONTEXT_TAG, "max")
}

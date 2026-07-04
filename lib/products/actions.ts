"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { productSchema } from "@/lib/onboarding/schemas"

export async function listProductsAction() {
  await requireAdmin()
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  })
}

export async function createProductAction(input: unknown) {
  const session = await requireAdmin()
  const data = productSchema.parse(input)

  const product = await prisma.product.create({
    data: {
      ...data,
      imageUrl: data.imageUrl || null,
      createdById: session.user.id,
    },
  })

  revalidatePath("/admin")
  return product
}

export async function updateProductAction(id: string, input: unknown) {
  await requireAdmin()
  const data = productSchema.parse(input)

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      imageUrl: data.imageUrl || null,
    },
  })

  revalidatePath("/admin")
  return product
}

export async function deleteProductAction(id: string) {
  await requireAdmin()
  await prisma.product.delete({ where: { id } })
  revalidatePath("/admin")
}

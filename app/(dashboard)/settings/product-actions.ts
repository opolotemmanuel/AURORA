"use server"

import { revalidatePath } from "next/cache"

import {
  createProduct,
  deleteOrArchiveProduct,
  parseProductFormData,
  setProductActive,
  updateProduct,
} from "@/lib/backend/product-service"
import { saveAuditLog } from "@/lib/backend/report-store"
import { requireAdminAccess } from "@/lib/auth/admin"

export async function createProductAction(formData: FormData) {
  const auth = await requireAdminAccess("products:manage")
  const input = parseProductFormData(formData)
  const product = await createProduct(input)

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Created Aurora product",
    targetType: "admin",
    targetId: product.id,
  })

  revalidatePath("/settings")
}

export async function updateProductAction(formData: FormData) {
  const auth = await requireAdminAccess("products:manage")
  const input = parseProductFormData(formData)

  if (!input.id) {
    throw new Error("Product id is required.")
  }

  const product = await updateProduct({ ...input, id: input.id })

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Updated Aurora product",
    targetType: "admin",
    targetId: product.id,
  })

  revalidatePath("/settings")
}

export async function activateProductAction(formData: FormData) {
  const auth = await requireAdminAccess("products:manage")
  const id = getProductId(formData)
  await setProductActive(id, true)
  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Activated Aurora product",
    targetType: "admin",
    targetId: id,
  })

  revalidatePath("/settings")
}

export async function deactivateProductAction(formData: FormData) {
  const auth = await requireAdminAccess("products:manage")
  const id = getProductId(formData)
  await setProductActive(id, false)
  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Deactivated Aurora product",
    targetType: "admin",
    targetId: id,
  })

  revalidatePath("/settings")
}

export async function deleteProductAction(formData: FormData) {
  const auth = await requireAdminAccess("products:manage")
  const id = getProductId(formData)
  const result = await deleteOrArchiveProduct(id)

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: result.mode === "deleted" ? "Deleted Aurora product" : "Archived Aurora product",
    targetType: "admin",
    targetId: id,
  })

  revalidatePath("/settings")
}

function getProductId(formData: FormData) {
  const id = formData.get("id")
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Product id is required.")
  }

  return id
}

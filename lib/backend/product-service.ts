// Admin CRUD for the Aurora product catalog, plus the form-data parsing
// used by the admin product form (parseProductFormData) and the read path
// the recommendation engine uses (listActiveRecommendationProducts).
import { RoutineStep, type Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db"
import type { AuroraProduct, SkinConcern } from "@/lib/recommendations/types"

// Runtime list mirroring the SkinConcern union — needed because form input
// arrives as plain strings and must be validated against real concern
// values (see parseConcernList/getConcernArray) rather than trusted as-is.
const skinConcerns = [
  "hydration",
  "texture",
  "rednessAppearance",
  "pigmentationAppearance",
  "oilBalance",
  "barrierComfort",
  "radiance",
  "daytimeProtection",
] as const satisfies readonly SkinConcern[]

export type ProductFormInput = {
  id?: string
  slug: string
  name: string
  category: string
  routineStep: AuroraProduct["routineStep"]
  shortDescription: string
  imagePath?: string
  cosmeticBenefits: string[]
  bestFor: SkinConcern[]
  avoidIf?: SkinConcern[]
  keyIngredients?: string[]
  officialUrl?: string
  priority: number
  active: boolean
}

export async function listProducts() {
  const products = await prisma.product.findMany({
    orderBy: [{ active: "desc" }, { priority: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          recommendations: true,
        },
      },
    },
  })

  return products.map((product) => ({
    ...mapProduct(product),
    recommendationCount: product._count.recommendations,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }))
}

export async function listActiveRecommendationProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
  })

  return products.map(mapProduct)
}

export async function createProduct(input: ProductFormInput) {
  return prisma.product.create({
    data: {
      slug: input.slug,
      name: input.name,
      category: input.category,
      routineStep: toPrismaRoutineStep(input.routineStep),
      shortDescription: input.shortDescription,
      imagePath: input.imagePath,
      cosmeticBenefits: input.cosmeticBenefits,
      bestFor: input.bestFor,
      avoidIf: input.avoidIf,
      keyIngredients: input.keyIngredients,
      officialUrl: input.officialUrl,
      priority: input.priority,
      active: input.active,
    },
  })
}

export async function updateProduct(input: ProductFormInput & { id: string }) {
  return prisma.product.update({
    where: { id: input.id },
    data: {
      slug: input.slug,
      name: input.name,
      category: input.category,
      routineStep: toPrismaRoutineStep(input.routineStep),
      shortDescription: input.shortDescription,
      imagePath: input.imagePath,
      cosmeticBenefits: input.cosmeticBenefits,
      bestFor: input.bestFor,
      avoidIf: input.avoidIf,
      keyIngredients: input.keyIngredients,
      officialUrl: input.officialUrl,
      priority: input.priority,
      active: input.active,
    },
  })
}

export async function setProductActive(productId: string, active: boolean) {
  return prisma.product.update({
    where: { id: productId },
    data: { active },
  })
}

// Soft-delete when a product is referenced by past recommendations (so
// historic reports keep resolving it — though report-store's productSnapshot
// means they'd still render fine either way); hard-delete only when it's
// safe to remove outright.
export async function deleteOrArchiveProduct(productId: string) {
  const recommendationCount = await prisma.recommendation.count({
    where: { productId },
  })

  if (recommendationCount > 0) {
    await setProductActive(productId, false)
    return { mode: "archived" as const, recommendationCount }
  }

  await prisma.product.delete({
    where: { id: productId },
  })

  return { mode: "deleted" as const, recommendationCount }
}

export function parseProductFormData(formData: FormData): ProductFormInput {
  const name = getRequiredString(formData, "name")

  return {
    id: getOptionalString(formData, "id"),
    slug: getOptionalString(formData, "slug") || slugify(name),
    name,
    category: getRequiredString(formData, "category"),
    routineStep: parseRoutineStep(getRequiredString(formData, "routineStep")),
    shortDescription: getRequiredString(formData, "shortDescription"),
    imagePath: parseImagePath(getOptionalString(formData, "imagePath")),
    cosmeticBenefits: parseStringList(getRequiredString(formData, "cosmeticBenefits")),
    bestFor: parseConcernList(getRequiredString(formData, "bestFor")),
    avoidIf: parseConcernList(getOptionalString(formData, "avoidIf") ?? ""),
    keyIngredients: parseStringList(getOptionalString(formData, "keyIngredients") ?? ""),
    officialUrl: parseOfficialUrl(getOptionalString(formData, "officialUrl")),
    priority: parsePriority(getRequiredString(formData, "priority")),
    active: formData.get("active") === "on",
  }
}

function mapProduct(product: {
  id: string
  slug: string
  name: string
  category: string
  routineStep: RoutineStep
  shortDescription: string
  imagePath: string | null
  cosmeticBenefits: Prisma.JsonValue
  bestFor: Prisma.JsonValue
  avoidIf: Prisma.JsonValue | null
  keyIngredients: Prisma.JsonValue | null
  officialUrl: string | null
  priority: number
  active: boolean
}): AuroraProduct {
  return {
    id: product.slug,
    databaseId: product.id,
    name: product.name,
    category: product.category,
    routineStep: fromPrismaRoutineStep(product.routineStep),
    shortDescription: product.shortDescription,
    imagePath: product.imagePath ?? undefined,
    cosmeticBenefits: getStringArray(product.cosmeticBenefits),
    bestFor: getConcernArray(product.bestFor),
    avoidIf: product.avoidIf ? getConcernArray(product.avoidIf) : undefined,
    keyIngredients: product.keyIngredients ? getStringArray(product.keyIngredients) : undefined,
    officialUrl: product.officialUrl ?? undefined,
    priority: product.priority,
    active: product.active,
  }
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required.`)
  }

  return value.trim()
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function parseStringList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseConcernList(value: string): SkinConcern[] {
  return parseStringList(value).map((item) => {
    if (!skinConcerns.includes(item as SkinConcern)) {
      throw new Error(`Unknown cosmetic concern: ${item}`)
    }

    return item as SkinConcern
  })
}

function parsePriority(value: string) {
  const priority = Number(value)
  if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
    throw new Error("priority must be an integer from 0 to 100.")
  }

  return priority
}

// Enforces AGENTS.md's "no hotlinking external images" rule at the data
// layer: must be a root-relative path (starts with a single `/`), which
// rules out both full external URLs and protocol-relative `//host/...` URLs
// that a browser would still resolve to an external origin.
function parseImagePath(value: string | undefined) {
  if (!value) return undefined

  if (!value.startsWith("/") || value.startsWith("//")) {
    throw new Error("imagePath must be a local public path that starts with /.")
  }

  return value
}

// The report's "View Product on Aurora" button opens this in a new tab, so
// it must be a real absolute URL — not a relative path (that's imagePath's
// job) and not javascript:/data: or similar.
function parseOfficialUrl(value: string | undefined) {
  if (!value) return undefined

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error("officialUrl must be a valid absolute URL.")
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("officialUrl must use http or https.")
  }

  return value
}

function parseRoutineStep(value: string): AuroraProduct["routineStep"] {
  if (value === "cleanse" || value === "treat" || value === "moisturize" || value === "protect") {
    return value
  }

  throw new Error("routineStep must be cleanse, treat, moisturize, or protect.")
}

function toPrismaRoutineStep(step: AuroraProduct["routineStep"]) {
  if (step === "cleanse") return RoutineStep.CLEANSE
  if (step === "moisturize") return RoutineStep.MOISTURIZE
  if (step === "protect") return RoutineStep.PROTECT
  return RoutineStep.TREAT
}

function fromPrismaRoutineStep(step: RoutineStep): AuroraProduct["routineStep"] {
  if (step === RoutineStep.CLEANSE) return "cleanse"
  if (step === RoutineStep.MOISTURIZE) return "moisturize"
  if (step === RoutineStep.PROTECT) return "protect"
  return "treat"
}

function getStringArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function getConcernArray(value: Prisma.JsonValue) {
  return getStringArray(value).filter((item): item is SkinConcern => skinConcerns.includes(item as SkinConcern))
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

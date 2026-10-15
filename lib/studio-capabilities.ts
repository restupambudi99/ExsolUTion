/** Verified 9Router adapter reference formats; limits also respect this app's upload cap. */
export function routerImageReferenceMode(model: string): "multiple" | "single" | "unsupported" {
  const adapter = model.trim().split("/")[0].toLowerCase();
  if (["codex","cx","nanobanana","nb"].includes(adapter)) return "multiple";
  if (["fal-ai","fal","black-forest-labs","bfl","runwayml","runway"].includes(adapter)) return "single";
  return "unsupported";
}

export function routerImageReferenceLimit(model: string) {
  const mode = routerImageReferenceMode(model);
  return mode === "multiple" ? 14 : mode === "single" ? 1 : 0;
}

/** These 9Router adapters map a small fixed size vocabulary to aspect ratios. */
export function routerImageSizeStrategy(model: string): "mapped-ratio" | "dimensions" | "native" {
  const adapter = model.trim().split("/")[0].toLowerCase();
  if (["nanobanana","nb","fal-ai","fal","runwayml","runway"].includes(adapter)) return "mapped-ratio";
  if (["black-forest-labs","bfl"].includes(adapter)) return "dimensions";
  return "native";
}

export const routerMappedAspectRatios = ["1:1","9:16","16:9","2:3","3:2"] as const;

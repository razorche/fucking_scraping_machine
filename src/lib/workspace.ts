import { db } from "@/lib/db";

const DEFAULT_SLUG = "fom";

export async function getDefaultWorkspace() {
  const slug = process.env.FOM_DEFAULT_WORKSPACE_SLUG ?? DEFAULT_SLUG;
  let workspace = await db.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    workspace = await db.workspace.create({
      data: { name: "FOM Workspace", slug },
    });
  }
  return workspace;
}

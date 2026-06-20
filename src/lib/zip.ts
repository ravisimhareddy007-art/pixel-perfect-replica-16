import JSZip from "jszip";
import { getBlob } from "./idb";
import type { Doc } from "./types";

export async function buildZip(name: string, docs: Doc[]) {
  const zip = new JSZip();
  const folder = zip.folder(name.replace(/[^\w]+/g, "_")) || zip;
  for (const d of docs) {
    const blob = await getBlob(d.fileKey);
    if (blob) folder.file(d.name, blob);
  }
  folder.file("MANIFEST.txt",
    `LifePack AI — ${name}\nGenerated ${new Date().toLocaleString()}\n\n` +
    docs.map((d, i) => `${i + 1}. ${d.name}  [${d.docType}]`).join("\n"));
  const out = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(out);
  const a = document.createElement("a");
  a.href = url; a.download = `${name.replace(/[^\w]+/g, "_")}.zip`; a.click();
  URL.revokeObjectURL(url);
}

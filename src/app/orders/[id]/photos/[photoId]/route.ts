import { privateStore } from "@/lib/orders";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const { store, workshop } = await privateStore();
  const { id, photoId } = await params;
  const photo = await store.getPhoto(workshop.id, id, photoId);
  if (!photo) return new Response("Foto no encontrada.", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(photo.content, "base64")), { headers: { "Content-Type": photo.mimeType, "Cache-Control": "private, no-store", "Content-Disposition": 'inline; filename="foto-privada"', "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } });
}

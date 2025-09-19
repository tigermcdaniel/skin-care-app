export async function encodeImageFromUrl(url: string): Promise<{ dataUrl: string; mime: string }> {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`Only http(s) URLs supported on server: got ${url}`)
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)

  const mime = res.headers.get("content-type") || "image/jpeg"
  const buf = Buffer.from(await res.arrayBuffer())
  const base64 = buf.toString("base64")
  return { dataUrl: `data:${mime};base64,${base64}`, mime }
}

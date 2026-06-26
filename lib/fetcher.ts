export async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json() as Promise<T>;
}

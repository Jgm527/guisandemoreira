export async function postJson(endpoint, data) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const result = await response.json()
  if (!response.ok) {
    const error = new Error(result.message || "La solicitud no se pudo completar.")
    error.details = result.errors || result.collisions || []
    error.status = response.status
    error.overwriteRequired = result.overwriteRequired === true
    throw error
  }
  return result
}

export async function getProjectStatus() {
  const response = await fetch("/api/status")
  if (!response.ok) throw new Error(`El servidor respondió con HTTP ${response.status}.`)
  return response.json()
}

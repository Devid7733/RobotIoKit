function optionalEnv(name) {
  return String(process.env[name] || "").trim() || null;
}

export async function checkBakongTransactionByMd5(md5) {
  const apiToken = optionalEnv("BAKONG_API_TOKEN") || optionalEnv("BAKONG_API_KEY");
  const baseUrl = optionalEnv("BAKONG_API_BASE_URL") || "https://api-bakong.nbc.gov.kh";

  if (!apiToken) {
    const error = new Error("BAKONG_API_TOKEN is required for automatic KHQR verification.");
    error.status = 503;
    throw error;
  }

  if (!md5) {
    const error = new Error("KHQR MD5 reference is required for Bakong verification.");
    error.status = 400;
    throw error;
  }

  let response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/check_transaction_by_md5`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ md5 }),
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      const timeoutError = new Error("Payment verification timed out. Please try again.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.responseMessage || "Unable to check Bakong transaction status.");
    error.status = response.status;
    throw error;
  }

  return data;
}

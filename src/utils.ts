/**
 * Restfully handles HTTP responses, parsing JSON safely and throwing detailed, 
 * user-friendly errors even when the server reports network, Gateway, or HTML errors.
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  let bodyText = "";
  try {
    bodyText = await response.text();
  } catch (err) {
    throw new Error(`Không thể kết nối hoặc đọc phản hồi từ máy chủ (Mã lỗi: ${response.status}).`);
  }

  // Safe checks for JSON structure
  let data: any = null;
  let isJson = false;
  const trimmed = bodyText.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      data = JSON.parse(bodyText);
      isJson = true;
    } catch {
      // Not dynamic JSON
    }
  }

  if (!response.ok) {
    // If we parsed structured error metadata from the server
    if (isJson && data && (data.error || data.message)) {
      throw new Error(data.error || data.message);
    }
    // If it is standard HTML (a Gateway, Proxy, Vite or Cloud Run error message)
    if (bodyText.includes("<!DOCTYPE html>") || trimmed.startsWith("<")) {
      throw new Error(
        `Dịch vụ AI Core tạm thời không phản hồi đúng dữ liệu (Mã trạng thái: ${response.status}). Vui lòng thử lại trong giây lát.`
      );
    }
    // Standard text fallback
    throw new Error(trimmed || `Yêu cầu thất bại với mã trạng thái ${response.status}.`);
  }

  if (isJson) {
    return data as T;
  }

  // Fallback for non-JSON content
  return { text: bodyText } as unknown as T;
}

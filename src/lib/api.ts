import type {
  AuthTokens,
  ConversationRecord,
  CurrentUserPayload,
  ListingApplication,
  ListingDetailPayload,
  ListingRecord,
  MessageRecord,
  MessagesPayload,
  NotificationRecord,
  Paginated,
  UploadRecord,
  UploadSignResponse,
  AdminVerificationReview,
  UserProfile,
  UserRecord,
  VerificationRecord
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const AUTH_STORAGE_KEY = "shared-living-os.auth";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code = "API_ERROR", details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

type ApiErrorDetail = {
  path?: string;
  message?: string;
  code?: string;
};

let inMemoryTokens: AuthTokens | null = readStoredTokens();
let refreshPromise: Promise<AuthTokens | null> | null = null;

function readStoredTokens(): AuthTokens | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getAuthTokens(): AuthTokens | null {
  return inMemoryTokens;
}

export function setAuthTokens(tokens: AuthTokens | null): void {
  inMemoryTokens = tokens;

  if (!tokens) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearAuthTokens(): void {
  setAuthTokens(null);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as
    | {
        success: boolean;
        data?: T;
        error?: { code?: string; message?: string; details?: unknown };
      }
    | null;

  if (response.ok && json?.success) {
    return json.data as T;
  }

  const errorDetails = Array.isArray(json?.error?.details) ? (json?.error?.details as ApiErrorDetail[]) : undefined;
  const fallbackDetailMessage = errorDetails?.find((detail) => detail.message)?.message;
  const message =
    json?.error?.message === "Invalid request payload" && fallbackDetailMessage
      ? fallbackDetailMessage
      : json?.error?.message ?? `Request failed with status ${response.status}`;

  throw new ApiError(
    message,
    response.status,
    json?.error?.code ?? "API_ERROR",
    json?.error?.details
  );
}

async function refreshAccessToken(): Promise<AuthTokens | null> {
  const current = getAuthTokens();
  if (!current?.refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken: current.refreshToken })
    })
      .then(async (response) => {
        const tokens = await parseResponse<{ tokens: AuthTokens }>(response);
        setAuthTokens(tokens.tokens);
        return tokens.tokens;
      })
      .catch(() => {
        clearAuthTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const token = getAuthTokens()?.accessToken;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (response.status === 401 && auth && !path.startsWith("/auth/refresh")) {
    const refreshed = await refreshAccessToken();
    if (refreshed?.accessToken) {
      return apiFetch<T>(path, {
        ...options,
        headers: {
          ...(headers ?? {}),
          Authorization: `Bearer ${refreshed.accessToken}`
        }
      });
    }
  }

  return parseResponse<T>(response);
}

export const authApi = {
  requestOtp: (phone: string) =>
    apiFetch<{ phone: string; expiresIn: number; devOtp?: string }>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone })
    }),
  verifyOtp: (phone: string, otp: string) =>
    apiFetch<{
      user: UserRecord;
      profile: UserProfile | null;
      verification: VerificationRecord | null;
      tokens: AuthTokens;
    }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp })
    }),
  logout: (refreshToken: string) =>
    apiFetch<null>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    })
};

export const usersApi = {
  getMe: () => apiFetch<CurrentUserPayload>("/users/me", { auth: true }),
  updateMe: (payload: Partial<UserProfile> & { email?: string }) => {
    const normalizedPayload = {
      ...payload,
      email: payload.email?.trim() ? payload.email.trim() : undefined,
      profileImageUrl: payload.profileImageUrl?.trim() ? payload.profileImageUrl.trim() : undefined
    };

    return apiFetch<CurrentUserPayload>("/users/me", {
      method: "PUT",
      auth: true,
      body: JSON.stringify(normalizedPayload)
    });
  },
  getPublicProfile: (id: string) => apiFetch<{ profile: UserProfile; verificationStatus: string }>(`/profiles/${id}`)
};

export const uploadsApi = {
  sign: (payload: {
    purpose: "profile_photo" | "listing_image" | "kyc_document";
    fileName: string;
    contentType: string;
    fileSize: number;
  }) =>
    apiFetch<UploadSignResponse>("/uploads/sign", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload)
    }),
  confirm: (payload: {
    objectKey: string;
    entityType?: "profile" | "listing" | "verification";
    entityId?: string;
    publicUrl?: string;
    providerAssetId?: string;
  }) =>
    apiFetch<UploadRecord>("/uploads/confirm", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload)
    }),
  async uploadFile(
    file: File,
    purpose: "profile_photo" | "listing_image" | "kyc_document",
    entityType?: "profile" | "listing" | "verification",
    entityId?: string
  ): Promise<string> {
    const signed = await uploadsApi.sign({
      purpose,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size
    });

    if (signed.provider === "cloudinary" && signed.fields) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signed.fields.api_key);
      formData.append("timestamp", String(signed.fields.timestamp));
      formData.append("signature", signed.fields.signature);
      formData.append("folder", signed.fields.folder);
      formData.append("public_id", signed.fields.public_id);

      const cloudinaryResponse = await fetch(signed.uploadUrl, {
        method: "POST",
        body: formData
      });

      const cloudinaryJson = (await cloudinaryResponse.json().catch(() => null)) as
        | { secure_url?: string; public_id?: string; error?: { message?: string } }
        | null;

      if (!cloudinaryResponse.ok || !cloudinaryJson?.secure_url) {
        throw new ApiError(
          cloudinaryJson?.error?.message ?? "Cloudinary upload failed",
          cloudinaryResponse.status || 500,
          "UPLOAD_FAILED"
        );
      }

      const confirmed = await uploadsApi.confirm({
        objectKey: signed.objectKey,
        entityType,
        entityId,
        publicUrl: cloudinaryJson.secure_url,
        providerAssetId: cloudinaryJson.public_id
      });

      return confirmed.publicUrl;
    }

    const confirmed = await uploadsApi.confirm({
      objectKey: signed.objectKey,
      entityType,
      entityId
    });

    return confirmed.publicUrl;
  }
};

export const verificationApi = {
  getMine: () => apiFetch<VerificationRecord | null>("/verifications/me", { auth: true }),
  submit: (payload: { documentType: string; documentUrl: string }) =>
    apiFetch<VerificationRecord>("/verifications", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload)
    }),
  adminList: () => apiFetch<AdminVerificationReview[]>("/admin/verifications", { auth: true }),
  approve: (id: string) =>
    apiFetch<VerificationRecord>(`/admin/verifications/${id}/approve`, {
      method: "POST",
      auth: true
    }),
  reject: (id: string, reason: string) =>
    apiFetch<VerificationRecord>(`/admin/verifications/${id}/reject`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason })
    })
};

export const listingsApi = {
  list: (params: URLSearchParams) => apiFetch<Paginated<ListingRecord>>(`/listings?${params.toString()}`),
  get: (id: string, auth = false) => apiFetch<ListingDetailPayload>(`/listings/${id}`, { auth }),
  mine: () => apiFetch<ListingRecord[]>("/listings/me", { auth: true }),
  create: (payload: Record<string, unknown>) =>
    apiFetch<ListingDetailPayload>("/listings", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload)
    }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiFetch<ListingDetailPayload>(`/listings/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload)
    }),
  archive: (id: string) =>
    apiFetch<null>(`/listings/${id}`, {
      method: "DELETE",
      auth: true
    }),
  restore: (id: string) =>
    apiFetch<ListingRecord>(`/listings/${id}/restore`, {
      method: "POST",
      auth: true
    }),
  adminList: () => apiFetch<ListingRecord[]>("/admin/listings", { auth: true }),
  pause: (id: string, reason: string) =>
    apiFetch<ListingRecord>(`/admin/listings/${id}/pause`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason })
    }),
  adminArchive: (id: string, reason: string) =>
    apiFetch<ListingRecord>(`/admin/listings/${id}/archive`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason })
    }),
  adminRestore: (id: string) =>
    apiFetch<ListingRecord>(`/admin/listings/${id}/restore`, {
      method: "POST",
      auth: true
    }),
  adminRelive: (id: string) =>
    apiFetch<ListingRecord>(`/admin/listings/${id}/relive`, {
      method: "POST",
      auth: true
    })
};

export const applicationsApi = {
  apply: (listingId: string, message?: string) =>
    apiFetch<ListingApplication>(`/listings/${listingId}/apply`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ message })
    }),
  mine: () => apiFetch<ListingApplication[]>("/applications/me", { auth: true }),
  forListing: (listingId: string) => apiFetch<ListingApplication[]>(`/listings/${listingId}/applications`, { auth: true }),
  shortlist: (id: string) =>
    apiFetch<ListingApplication>(`/applications/${id}/shortlist`, {
      method: "POST",
      auth: true
    }),
  accept: (id: string) =>
    apiFetch<ListingApplication>(`/applications/${id}/accept`, {
      method: "POST",
      auth: true
    }),
  reject: (id: string, reason: string) =>
    apiFetch<ListingApplication>(`/applications/${id}/reject`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason })
    })
};

export const conversationsApi = {
  create: (participantId: string) =>
    apiFetch<ConversationRecord>("/conversations", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ participantId })
    }),
  list: () => apiFetch<ConversationRecord[]>("/conversations", { auth: true }),
  getMessages: (id: string, limit = 50) =>
    apiFetch<MessagesPayload>(`/conversations/${id}/messages?limit=${limit}`, { auth: true }),
  sendMessage: (conversationId: string, message: string) =>
    apiFetch<MessageRecord>("/messages", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ conversationId, message })
    }),
  markRead: (id: string, lastReadMessageId?: string) =>
    apiFetch<unknown>(`/conversations/${id}/read`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ lastReadMessageId })
    })
};

export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    apiFetch<Paginated<NotificationRecord>>(`/notifications?page=${page}&limit=${limit}`, {
      auth: true
    }),
  markRead: (id: string) =>
    apiFetch<NotificationRecord>(`/notifications/${id}/read`, {
      method: "POST",
      auth: true
    }),
  markAllRead: () =>
    apiFetch<{ acknowledged?: boolean; modifiedCount?: number }>(`/notifications/read-all`, {
      method: "POST",
      auth: true
    })
};

export const adminApi = {
  users: () => apiFetch<UserRecord[]>("/admin/users", { auth: true }),
  flagUser: (id: string, reason: string) =>
    apiFetch<UserRecord>(`/admin/users/${id}/flag`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason })
    }),
  unflagUser: (id: string) =>
    apiFetch<UserRecord>(`/admin/users/${id}/unflag`, {
      method: "POST",
      auth: true
    }),
  deactivateUser: (id: string, reason: string) =>
    apiFetch<UserRecord>(`/admin/users/${id}/deactivate`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason })
    }),
  activateUser: (id: string, reason: string) =>
    apiFetch<UserRecord>(`/admin/users/${id}/activate`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ reason })
    })
};

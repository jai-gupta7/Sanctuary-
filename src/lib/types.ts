export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
};

export type UserRecord = {
  _id: string;
  phone: string;
  email?: string;
  role: "user" | "admin";
  isActive: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UserProfile = {
  _id: string;
  userId: string;
  fullName?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  bio?: string;
  profileImageUrl?: string;
  profileCompletionScore: number;
  createdAt?: string;
  updatedAt?: string;
};

export type VerificationRecord = {
  _id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  status: "not_submitted" | "pending" | "verified" | "rejected";
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Eligibility = {
  eligible: boolean;
  score: number;
  hasPhoto: boolean;
};

export type CurrentUserPayload = {
  user: UserRecord;
  profile: UserProfile | null;
  verification: VerificationRecord | null;
  eligibility: Eligibility;
};

export type ListingRecord = {
  _id: string;
  createdBy: string;
  listingType: "replacement" | "flatmate_needed" | "full_flat";
  title: string;
  description: string;
  rent: number;
  deposit: number;
  locationText: string;
  exactAddress?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  moveInDate: string;
  status: "draft" | "active" | "paused" | "filled" | "archived";
  isDeleted: boolean;
  deletedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ListingImage = {
  _id: string;
  listingId: string;
  imageUrl: string;
  position: number;
};

export type ListingPreference = {
  _id: string;
  listingId: string;
  genderPreference?: string;
  smokingAllowed?: boolean;
  drinkingAllowed?: boolean;
  occupationPreference?: string;
};

export type ListingDetailPayload = {
  listing: ListingRecord;
  images: ListingImage[];
  preference: ListingPreference | null;
  listerProfile: UserProfile | null;
  listerVerificationStatus: "verified" | "not_verified";
  listerContact?: {
    phone?: string | null;
    email?: string | null;
    exactAddress?: string | null;
    navigationUrl: string;
  } | null;
  viewerContext?: {
    isOwner: boolean;
    hasAcceptedAccess?: boolean;
  };
};

export type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type ListingApplication = {
  _id: string;
  listingId: string;
  applicantId: string;
  status: "applied" | "shortlisted" | "accepted" | "rejected";
  message?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  listingTitle?: string | null;
  ownerContact?: {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    exactAddress?: string | null;
    navigationUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  applicantContact?: {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
};

export type ConversationRecord = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  participant?: {
    userId: string;
    fullName?: string | null;
    phone?: string | null;
    occupation?: string | null;
    profileImageUrl?: string | null;
  } | null;
  latestMessage?: {
    message: string;
    senderId: string;
    createdAt: string;
  } | null;
  unread?: boolean;
};

export type MessageRecord = {
  _id: string;
  conversationId: string;
  senderId: string;
  message: string;
  messageType: "text";
  createdAt: string;
};

export type MessagesPayload = {
  items: MessageRecord[];
  nextCursor: string | null;
};

export type NotificationRecord = {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type UploadSignResponse = {
  uploadId: string;
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  method: string;
  provider: "mock" | "cloudinary";
  fields?: {
    api_key: string;
    timestamp: number;
    signature: string;
    folder: string;
    public_id: string;
  };
};

export type UploadRecord = {
  _id: string;
  userId: string;
  purpose: "profile_photo" | "listing_image" | "kyc_document";
  fileName: string;
  contentType: string;
  fileSize: number;
  objectKey: string;
  publicUrl: string;
  provider?: "mock" | "cloudinary";
  providerAssetId?: string;
  status: "signed" | "confirmed";
  entityType?: "profile" | "listing" | "verification";
  entityId?: string;
  confirmedAt?: string;
};

export type ListingCardVM = {
  id: string;
  title: string;
  location: string;
  rent: number;
  deposit: number;
  moveInDate: string;
  status: ListingRecord["status"];
};

export type ListingDetailVM = {
  id: string;
  title: string;
  description: string;
  location: string;
  rent: number;
  deposit: number;
  moveInDate: string;
  status: ListingRecord["status"];
  images: string[];
  listerName: string;
  listerOccupation?: string;
  listerBio?: string;
  listerVerified: boolean;
  preferences: string[];
  isOwner: boolean;
  listerPhone?: string | null;
  listerEmail?: string | null;
  exactAddress?: string | null;
  navigationUrl?: string | null;
  latitude?: number;
  longitude?: number;
  hasAcceptedAccess: boolean;
};

export type ApplicationVM = {
  id: string;
  listingId: string;
  applicantId: string;
  status: ListingApplication["status"];
  message?: string;
  rejectionReason?: string;
  createdAt: string;
};

export type ConversationVM = {
  id: string;
  updatedAt: string;
  participantName?: string;
  participantPhone?: string;
  latestMessage?: string;
  latestMessageAt?: string;
  unread?: boolean;
};

export type NotificationVM = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type AdminVerificationVM = VerificationRecord;
export type AdminVerificationReview = VerificationRecord & {
  reviewerContext?: {
    phone?: string | null;
    email?: string | null;
    fullName?: string | null;
    occupation?: string | null;
  };
};

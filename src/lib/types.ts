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
  verificationStatus?: VerificationRecord["status"] | "not_submitted";
  verificationContext?: {
    status?: VerificationRecord["status"];
    rejectionReason?: string | null;
    resubmissionAllowedAt?: string | null;
    updatedAt?: string | null;
  } | null;
  profileContext?: {
    fullName?: string | null;
    age?: number | null;
    gender?: string | null;
    occupation?: string | null;
    bio?: string | null;
    profileImageUrl?: string | null;
    profileCompletionScore?: number | null;
  } | null;
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
  documentType: "aadhaar" | "passport" | "driving_license" | "voter_id";
  nameOnDocument: string;
  documentNumberLast4: string;
  documentUrl: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  status: "not_submitted" | "pending" | "verified" | "rejected";
  rejectionReason?: string;
  resubmissionAllowedAt?: string;
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

export type ListingPropertyDetails = {
  city?: string;
  urgency?: "immediate" | "within_7_days" | "this_month" | "future_move_in";
  propertyType?: "apartment" | "independent_house" | "gated_society" | "shared_home";
  layout?: string;
  furnishingStatus?: "fully_furnished" | "semi_furnished" | "unfurnished";
  floorNumber?: string;
  liftAvailable?: "yes" | "no";
  parkingAvailable?: "yes" | "no";
  maintenanceInfo?: string;
  utilitySplit?: string;
  brokerageInfo?: string;
  minimumStay?: string;
  roomType?: "private_room" | "shared_room" | "bed_in_shared_room" | "entire_flat";
  bathroomType?: "attached" | "shared" | "not_applicable";
  occupancyMode?: "single" | "double" | "flexible";
  balcony?: "yes" | "no";
  wardrobe?: "yes" | "no";
  airConditioning?: "yes" | "no";
  deskSetup?: "yes" | "no";
  naturalLight?: "high" | "moderate" | "low";
  openSpots?: string;
  totalCapacity?: string;
  bedroomsAvailable?: string;
  suitableFor?: string[];
};

export type ListingReplacementDetails = {
  replacementSpotType?: string;
  replacementHandoverDate?: string;
  depositTransferNotes?: string;
  landlordApprovalRequired?: "yes" | "no";
  flatmateApprovalRequired?: "yes" | "no";
};

export type ListingHouseholdProfile = {
  currentOccupants?: string;
  householdGenderMix?: string;
  householdAgeRange?: string;
  occupationMix?: string;
  workModeMix?: string;
  languagesSpoken?: string;
  ownerLivesThere?: "yes" | "no";
  petsInHome?: "yes" | "no";
};

export type ListingCompatibilityProfile = {
  smokingPolicy?: "not_allowed" | "balcony_only" | "allowed";
  drinkingPolicy?: "not_allowed" | "occasional" | "comfortable";
  kitchenPreference?: "vegetarian_only" | "mixed_kitchen" | "non_veg_friendly";
  guestPolicy?: "rare" | "moderate" | "comfortable";
  overnightGuestPolicy?: "rare" | "moderate" | "comfortable";
  cleanlinessLevel?: "very_tidy" | "moderate" | "relaxed";
  noiseTolerance?: "low" | "balanced" | "high";
  socialVibe?: "quiet" | "balanced" | "social";
  wakeSleepRoutine?: "early" | "mixed" | "late";
  wfhFriendly?: "yes" | "sometimes" | "not_ideal";
  choresSetup?: "shared_chores" | "maid_support" | "flexible";
};

export type ListingIdealFlatmateProfile = {
  preferredGender?: string;
  preferredAgeBand?: string;
  preferredOccupation?: string;
  preferredWorkStyle?: string;
  preferredPersonality?: "quiet" | "balanced" | "social";
  preferredFlatmateProfile?: string;
  bestSuitedFor?: string;
};

export type ListingHouseRules = {
  houseRules?: string;
  nonNegotiables?: string;
  restrictions?: string;
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
  propertyDetails?: ListingPropertyDetails;
  replacementDetails?: ListingReplacementDetails;
  householdProfile?: ListingHouseholdProfile;
  compatibilityProfile?: ListingCompatibilityProfile;
  idealFlatmateProfile?: ListingIdealFlatmateProfile;
  houseRules?: ListingHouseRules;
  status: "draft" | "active" | "paused" | "filled" | "archived";
  isDeleted: boolean;
  deletedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  coverImageUrl?: string | null;
  ownerContext?: {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    occupation?: string | null;
    verificationStatus?: "verified" | "not_verified";
  } | null;
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
  actionUrl?: string;
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
  coverImageUrl?: string | null;
};

export type ListingDetailVM = {
  id: string;
  listingType: ListingRecord["listingType"];
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
  propertyDetails?: ListingPropertyDetails;
  replacementDetails?: ListingReplacementDetails;
  householdProfile?: ListingHouseholdProfile;
  compatibilityProfile?: ListingCompatibilityProfile;
  idealFlatmateProfile?: ListingIdealFlatmateProfile;
  houseRules?: ListingHouseRules;
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

export type ListingWizardStep =
  | "basics"
  | "property"
  | "household"
  | "compatibility"
  | "review";

export type ListingFormDraft = {
  listingType: ListingRecord["listingType"];
  targetStatus: ListingRecord["status"];
  title: string;
  summary: string;
  city: string;
  locationText: string;
  exactAddress: string;
  googleMapsUrl: string;
  latitude?: number;
  longitude?: number;
  urgency: "immediate" | "within_7_days" | "this_month" | "future_move_in";
  moveInDate: string;
  propertyType: "apartment" | "independent_house" | "gated_society" | "shared_home";
  layout: string;
  furnishingStatus: "fully_furnished" | "semi_furnished" | "unfurnished";
  floorNumber: string;
  liftAvailable: "yes" | "no";
  parkingAvailable: "yes" | "no";
  rent: number;
  deposit: number;
  maintenanceInfo: string;
  utilitySplit: string;
  brokerageInfo: string;
  minimumStay: string;
  roomType: "private_room" | "shared_room" | "bed_in_shared_room" | "entire_flat";
  bathroomType: "attached" | "shared" | "not_applicable";
  occupancyMode: "single" | "double" | "flexible";
  balcony: "yes" | "no";
  wardrobe: "yes" | "no";
  airConditioning: "yes" | "no";
  deskSetup: "yes" | "no";
  naturalLight: "high" | "moderate" | "low";
  openSpots: string;
  totalCapacity: string;
  bedroomsAvailable: string;
  suitableFor: string[];
  replacementSpotType: string;
  replacementHandoverDate: string;
  depositTransferNotes: string;
  landlordApprovalRequired: "yes" | "no";
  flatmateApprovalRequired: "yes" | "no";
  currentOccupants: string;
  householdGenderMix: string;
  householdAgeRange: string;
  occupationMix: string;
  workModeMix: string;
  languagesSpoken: string;
  ownerLivesThere: "yes" | "no";
  petsInHome: "yes" | "no";
  smokingPolicy: "not_allowed" | "balcony_only" | "allowed";
  drinkingPolicy: "not_allowed" | "occasional" | "comfortable";
  kitchenPreference: "vegetarian_only" | "mixed_kitchen" | "non_veg_friendly";
  guestPolicy: "rare" | "moderate" | "comfortable";
  overnightGuestPolicy: "rare" | "moderate" | "comfortable";
  cleanlinessLevel: "very_tidy" | "moderate" | "relaxed";
  noiseTolerance: "low" | "balanced" | "high";
  socialVibe: "quiet" | "balanced" | "social";
  wakeSleepRoutine: "early" | "mixed" | "late";
  wfhFriendly: "yes" | "sometimes" | "not_ideal";
  choresSetup: "shared_chores" | "maid_support" | "flexible";
  preferredGender: string;
  preferredAgeBand: string;
  preferredOccupation: string;
  preferredWorkStyle: string;
  preferredPersonality: "quiet" | "balanced" | "social";
  preferredFlatmateProfile: string;
  bestSuitedFor: string;
  houseRules: string;
  nonNegotiables: string;
  restrictions: string;
};

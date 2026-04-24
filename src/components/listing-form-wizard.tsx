import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { listingsApi, uploadsApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import type { ListingDetailPayload, ListingFormDraft, ListingWizardStep } from "../lib/types";
import { MapPicker } from "./map-picker";
import { MapPreview } from "./map-preview";
import { Badge, Button, ButtonLink, Card, Field, InlineNotice, Input, LoadingBlock, PageHeader, Select, Textarea } from "./ui";

const DRAFT_STORAGE_KEY = "shared-living-os.listing-form-drafts.v1";
const STEP_ORDER: ListingWizardStep[] = ["basics", "property", "household", "compatibility", "review"];

const STEP_META: Array<{ id: ListingWizardStep; title: string; description: string }> = [
  {
    id: "basics",
    title: "Listing type and basics",
    description: "Start with the home, urgency, and a clear summary so the form feels easy at the beginning."
  },
  {
    id: "property",
    title: "Property, pricing, and room details",
    description: "Capture the commercial fit and exactly what kind of space the next person would get."
  },
  {
    id: "household",
    title: "Current household profile",
    description: "Describe who already lives here so the listing feels human, not just real-estate inventory."
  },
  {
    id: "compatibility",
    title: "Compatibility and house rules",
    description: "Collect the real lifestyle signals that help the next flatmate self-select accurately."
  },
  {
    id: "review",
    title: "Photos, trust, and review",
    description: "Check completeness, upload photos, and choose whether to save a draft or publish."
  }
];

const LISTING_TYPE_OPTIONS = [
  {
    value: "flatmate_needed",
    label: "Flatmate needed",
    description: "The home exists and you’re looking for one or more people who fit the current setup."
  },
  {
    value: "replacement",
    label: "Replacement",
    description: "Someone is moving out and you need a person to take over that exact spot."
  },
  {
    value: "full_flat",
    label: "Full flat available",
    description: "The whole flat or unit is available, not just one bed or room."
  }
] as const;

const URGENCY_OPTIONS = [
  { value: "immediate", label: "Immediate move-in" },
  { value: "within_7_days", label: "Within 7 days" },
  { value: "this_month", label: "This month" },
  { value: "future_move_in", label: "Future move-in" }
] as const;

const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartment" },
  { value: "independent_house", label: "Independent house" },
  { value: "gated_society", label: "Gated society flat" },
  { value: "shared_home", label: "PG-style shared home" }
] as const;

const FURNISHING_OPTIONS = [
  { value: "fully_furnished", label: "Fully furnished" },
  { value: "semi_furnished", label: "Semi furnished" },
  { value: "unfurnished", label: "Unfurnished" }
] as const;

const ROOM_TYPE_OPTIONS = [
  { value: "private_room", label: "Private room" },
  { value: "shared_room", label: "Shared room" },
  { value: "bed_in_shared_room", label: "Bed in shared room" },
  { value: "entire_flat", label: "Entire flat" }
] as const;

const SIMPLE_YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" }
] as const;

const BATHROOM_OPTIONS = [
  { value: "attached", label: "Attached bathroom" },
  { value: "shared", label: "Shared bathroom" },
  { value: "not_applicable", label: "Not applicable" }
] as const;

const OCCUPANCY_OPTIONS = [
  { value: "single", label: "Single occupancy" },
  { value: "double", label: "Double occupancy" },
  { value: "flexible", label: "Flexible" }
] as const;

const NATURAL_LIGHT_OPTIONS = [
  { value: "high", label: "Bright and airy" },
  { value: "moderate", label: "Balanced daylight" },
  { value: "low", label: "Limited daylight" }
] as const;

const SMOKING_POLICY_OPTIONS = [
  { value: "not_allowed", label: "Not allowed" },
  { value: "balcony_only", label: "Balcony only" },
  { value: "allowed", label: "Allowed" }
] as const;

const DRINKING_POLICY_OPTIONS = [
  { value: "not_allowed", label: "Not allowed" },
  { value: "occasional", label: "Occasional" },
  { value: "comfortable", label: "Comfortable" }
] as const;

const KITCHEN_OPTIONS = [
  { value: "vegetarian_only", label: "Vegetarian kitchen" },
  { value: "mixed_kitchen", label: "Mixed kitchen" },
  { value: "non_veg_friendly", label: "Non-veg friendly" }
] as const;

const GUEST_POLICY_OPTIONS = [
  { value: "rare", label: "Rare guests" },
  { value: "moderate", label: "Moderate guests" },
  { value: "comfortable", label: "Guests are welcome" }
] as const;

const CLEANLINESS_OPTIONS = [
  { value: "very_tidy", label: "Very tidy" },
  { value: "moderate", label: "Moderate" },
  { value: "relaxed", label: "Relaxed" }
] as const;

const NOISE_OPTIONS = [
  { value: "low", label: "Quiet home" },
  { value: "balanced", label: "Balanced" },
  { value: "high", label: "Lively home" }
] as const;

const SOCIAL_OPTIONS = [
  { value: "quiet", label: "Quiet routine" },
  { value: "balanced", label: "Balanced" },
  { value: "social", label: "Social home" }
] as const;

const ROUTINE_OPTIONS = [
  { value: "early", label: "Early sleepers" },
  { value: "mixed", label: "Mixed routine" },
  { value: "late", label: "Late-night friendly" }
] as const;

const WFH_OPTIONS = [
  { value: "yes", label: "WFH friendly" },
  { value: "sometimes", label: "Sometimes works" },
  { value: "not_ideal", label: "Not ideal for WFH" }
] as const;

const CHORES_OPTIONS = [
  { value: "shared_chores", label: "Shared chores" },
  { value: "maid_support", label: "Maid / cook support" },
  { value: "flexible", label: "Flexible setup" }
] as const;

const PERSONALITY_OPTIONS = [
  { value: "quiet", label: "Quiet" },
  { value: "balanced", label: "Balanced" },
  { value: "social", label: "Social" }
] as const;

const SUITABLE_FOR_OPTIONS = [
  { value: "students", label: "Students" },
  { value: "working_professionals", label: "Working professionals" },
  { value: "friends", label: "Friends moving together" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" }
];

type ListingApiPayload = {
  listingType: ListingFormDraft["listingType"];
  title: string;
  description: string;
  rent: number;
  deposit: number;
  locationText: string;
  exactAddress: string;
  googleMapsUrl: string;
  latitude?: number;
  longitude?: number;
  moveInDate: string;
  status: ListingFormDraft["targetStatus"];
  genderPreference: string;
  occupationPreference: string;
  smokingAllowed: boolean;
  drinkingAllowed: boolean;
  propertyDetails: {
    city?: string;
    urgency: ListingFormDraft["urgency"];
    propertyType: ListingFormDraft["propertyType"];
    layout?: string;
    furnishingStatus: ListingFormDraft["furnishingStatus"];
    floorNumber?: string;
    liftAvailable: ListingFormDraft["liftAvailable"];
    parkingAvailable: ListingFormDraft["parkingAvailable"];
    maintenanceInfo?: string;
    utilitySplit?: string;
    brokerageInfo?: string;
    minimumStay?: string;
    roomType: ListingFormDraft["roomType"];
    bathroomType: ListingFormDraft["bathroomType"];
    occupancyMode: ListingFormDraft["occupancyMode"];
    balcony: ListingFormDraft["balcony"];
    wardrobe: ListingFormDraft["wardrobe"];
    airConditioning: ListingFormDraft["airConditioning"];
    deskSetup: ListingFormDraft["deskSetup"];
    naturalLight: ListingFormDraft["naturalLight"];
    openSpots?: string;
    totalCapacity?: string;
    bedroomsAvailable?: string;
    suitableFor?: string[];
  };
  replacementDetails?: {
    replacementSpotType?: string;
    replacementHandoverDate?: string;
    depositTransferNotes?: string;
    landlordApprovalRequired?: "yes" | "no";
    flatmateApprovalRequired?: "yes" | "no";
  };
  householdProfile: {
    currentOccupants?: string;
    householdGenderMix?: string;
    householdAgeRange?: string;
    occupationMix?: string;
    workModeMix?: string;
    languagesSpoken?: string;
    ownerLivesThere: ListingFormDraft["ownerLivesThere"];
    petsInHome: ListingFormDraft["petsInHome"];
  };
  compatibilityProfile: {
    smokingPolicy: ListingFormDraft["smokingPolicy"];
    drinkingPolicy: ListingFormDraft["drinkingPolicy"];
    kitchenPreference: ListingFormDraft["kitchenPreference"];
    guestPolicy: ListingFormDraft["guestPolicy"];
    overnightGuestPolicy: ListingFormDraft["overnightGuestPolicy"];
    cleanlinessLevel: ListingFormDraft["cleanlinessLevel"];
    noiseTolerance: ListingFormDraft["noiseTolerance"];
    socialVibe: ListingFormDraft["socialVibe"];
    wakeSleepRoutine: ListingFormDraft["wakeSleepRoutine"];
    wfhFriendly: ListingFormDraft["wfhFriendly"];
    choresSetup: ListingFormDraft["choresSetup"];
  };
  idealFlatmateProfile: {
    preferredGender?: string;
    preferredAgeBand?: string;
    preferredOccupation?: string;
    preferredWorkStyle?: string;
    preferredPersonality: ListingFormDraft["preferredPersonality"];
    preferredFlatmateProfile?: string;
    bestSuitedFor?: string;
  };
  houseRules: {
    houseRules?: string;
    nonNegotiables?: string;
    restrictions?: string;
  };
  imageUrls: string[];
};

function createEmptyDraft(): ListingFormDraft {
  return {
    listingType: "flatmate_needed",
    targetStatus: "draft",
    title: "",
    summary: "",
    city: "",
    locationText: "",
    exactAddress: "",
    googleMapsUrl: "",
    latitude: undefined,
    longitude: undefined,
    urgency: "this_month",
    moveInDate: "",
    propertyType: "apartment",
    layout: "",
    furnishingStatus: "fully_furnished",
    floorNumber: "",
    liftAvailable: "yes",
    parkingAvailable: "no",
    rent: 0,
    deposit: 0,
    maintenanceInfo: "",
    utilitySplit: "",
    brokerageInfo: "",
    minimumStay: "",
    roomType: "private_room",
    bathroomType: "attached",
    occupancyMode: "single",
    balcony: "yes",
    wardrobe: "yes",
    airConditioning: "no",
    deskSetup: "no",
    naturalLight: "moderate",
    openSpots: "1",
    totalCapacity: "",
    bedroomsAvailable: "",
    suitableFor: [],
    replacementSpotType: "",
    replacementHandoverDate: "",
    depositTransferNotes: "",
    landlordApprovalRequired: "no",
    flatmateApprovalRequired: "yes",
    currentOccupants: "",
    householdGenderMix: "",
    householdAgeRange: "",
    occupationMix: "",
    workModeMix: "",
    languagesSpoken: "",
    ownerLivesThere: "no",
    petsInHome: "no",
    smokingPolicy: "not_allowed",
    drinkingPolicy: "occasional",
    kitchenPreference: "mixed_kitchen",
    guestPolicy: "moderate",
    overnightGuestPolicy: "moderate",
    cleanlinessLevel: "moderate",
    noiseTolerance: "balanced",
    socialVibe: "balanced",
    wakeSleepRoutine: "mixed",
    wfhFriendly: "sometimes",
    choresSetup: "flexible",
    preferredGender: "",
    preferredAgeBand: "",
    preferredOccupation: "",
    preferredWorkStyle: "",
    preferredPersonality: "balanced",
    preferredFlatmateProfile: "",
    bestSuitedFor: "",
    houseRules: "",
    nonNegotiables: "",
    restrictions: ""
  };
}

function readStoredDrafts() {
  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? "{}") as Record<string, ListingFormDraft>;
  } catch {
    return {};
  }
}

function writeStoredDraft(draftKey: string, draft: ListingFormDraft) {
  const current = readStoredDrafts();
  current[draftKey] = draft;
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(current));
}

function removeStoredDraft(draftKey: string) {
  const current = readStoredDrafts();
  delete current[draftKey];
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(current));
}

function listTypeLabel(value: ListingFormDraft["listingType"]) {
  return LISTING_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function buildPayload(draft: ListingFormDraft, imageUrls: string[]): ListingApiPayload {
  return {
    listingType: draft.listingType,
    title: draft.title.trim(),
    description: draft.summary.trim(),
    rent: draft.rent,
    deposit: draft.deposit,
    locationText: draft.locationText.trim(),
    exactAddress: draft.exactAddress.trim(),
    googleMapsUrl: draft.googleMapsUrl.trim(),
    latitude: draft.latitude,
    longitude: draft.longitude,
    moveInDate: draft.moveInDate,
    status: draft.targetStatus,
    genderPreference: draft.preferredGender.trim(),
    occupationPreference: draft.preferredOccupation.trim(),
    smokingAllowed: draft.smokingPolicy !== "not_allowed",
    drinkingAllowed: draft.drinkingPolicy !== "not_allowed",
    propertyDetails: {
      city: draft.city.trim() || undefined,
      urgency: draft.urgency,
      propertyType: draft.propertyType,
      layout: draft.layout.trim() || undefined,
      furnishingStatus: draft.furnishingStatus,
      floorNumber: draft.floorNumber.trim() || undefined,
      liftAvailable: draft.liftAvailable,
      parkingAvailable: draft.parkingAvailable,
      maintenanceInfo: draft.maintenanceInfo.trim() || undefined,
      utilitySplit: draft.utilitySplit.trim() || undefined,
      brokerageInfo: draft.brokerageInfo.trim() || undefined,
      minimumStay: draft.minimumStay.trim() || undefined,
      roomType: draft.roomType,
      bathroomType: draft.bathroomType,
      occupancyMode: draft.occupancyMode,
      balcony: draft.balcony,
      wardrobe: draft.wardrobe,
      airConditioning: draft.airConditioning,
      deskSetup: draft.deskSetup,
      naturalLight: draft.naturalLight,
      openSpots: draft.openSpots.trim() || undefined,
      totalCapacity: draft.totalCapacity.trim() || undefined,
      bedroomsAvailable: draft.bedroomsAvailable.trim() || undefined,
      suitableFor: draft.suitableFor.length ? draft.suitableFor : undefined
    },
    replacementDetails:
      draft.listingType === "replacement"
        ? {
            replacementSpotType: draft.replacementSpotType.trim() || undefined,
            replacementHandoverDate: draft.replacementHandoverDate || undefined,
            depositTransferNotes: draft.depositTransferNotes.trim() || undefined,
            landlordApprovalRequired: draft.landlordApprovalRequired,
            flatmateApprovalRequired: draft.flatmateApprovalRequired
          }
        : undefined,
    householdProfile: {
      currentOccupants: draft.currentOccupants.trim() || undefined,
      householdGenderMix: draft.householdGenderMix.trim() || undefined,
      householdAgeRange: draft.householdAgeRange.trim() || undefined,
      occupationMix: draft.occupationMix.trim() || undefined,
      workModeMix: draft.workModeMix.trim() || undefined,
      languagesSpoken: draft.languagesSpoken.trim() || undefined,
      ownerLivesThere: draft.ownerLivesThere,
      petsInHome: draft.petsInHome
    },
    compatibilityProfile: {
      smokingPolicy: draft.smokingPolicy,
      drinkingPolicy: draft.drinkingPolicy,
      kitchenPreference: draft.kitchenPreference,
      guestPolicy: draft.guestPolicy,
      overnightGuestPolicy: draft.overnightGuestPolicy,
      cleanlinessLevel: draft.cleanlinessLevel,
      noiseTolerance: draft.noiseTolerance,
      socialVibe: draft.socialVibe,
      wakeSleepRoutine: draft.wakeSleepRoutine,
      wfhFriendly: draft.wfhFriendly,
      choresSetup: draft.choresSetup
    },
    idealFlatmateProfile: {
      preferredGender: draft.preferredGender.trim() || undefined,
      preferredAgeBand: draft.preferredAgeBand.trim() || undefined,
      preferredOccupation: draft.preferredOccupation.trim() || undefined,
      preferredWorkStyle: draft.preferredWorkStyle.trim() || undefined,
      preferredPersonality: draft.preferredPersonality,
      preferredFlatmateProfile: draft.preferredFlatmateProfile.trim() || undefined,
      bestSuitedFor: draft.bestSuitedFor.trim() || undefined
    },
    houseRules: {
      houseRules: draft.houseRules.trim() || undefined,
      nonNegotiables: draft.nonNegotiables.trim() || undefined,
      restrictions: draft.restrictions.trim() || undefined
    },
    imageUrls
  };
}

function canPersistRemotely(draft: ListingFormDraft) {
  return (
    draft.title.trim().length >= 3 &&
    draft.summary.trim().length >= 10 &&
    draft.locationText.trim().length >= 2 &&
    draft.moveInDate.trim().length > 0
  );
}

function buildExistingDraft(data: ListingDetailPayload): ListingFormDraft {
  return {
    ...createEmptyDraft(),
    listingType: data.listing.listingType,
    targetStatus: data.listing.status,
    title: data.listing.title,
    summary: data.listing.description,
    city: data.listing.propertyDetails?.city ?? data.listing.locationText.split(",")[0]?.trim() ?? "",
    locationText: data.listing.locationText,
    exactAddress: data.listing.exactAddress ?? "",
    googleMapsUrl: data.listing.googleMapsUrl ?? "",
    latitude: data.listing.latitude,
    longitude: data.listing.longitude,
    moveInDate: data.listing.moveInDate.slice(0, 10),
    rent: data.listing.rent,
    deposit: data.listing.deposit,
    urgency: data.listing.propertyDetails?.urgency ?? "this_month",
    propertyType: data.listing.propertyDetails?.propertyType ?? "apartment",
    layout: data.listing.propertyDetails?.layout ?? "",
    furnishingStatus: data.listing.propertyDetails?.furnishingStatus ?? "fully_furnished",
    floorNumber: data.listing.propertyDetails?.floorNumber ?? "",
    liftAvailable: data.listing.propertyDetails?.liftAvailable ?? "yes",
    parkingAvailable: data.listing.propertyDetails?.parkingAvailable ?? "no",
    maintenanceInfo: data.listing.propertyDetails?.maintenanceInfo ?? "",
    utilitySplit: data.listing.propertyDetails?.utilitySplit ?? "",
    brokerageInfo: data.listing.propertyDetails?.brokerageInfo ?? "",
    minimumStay: data.listing.propertyDetails?.minimumStay ?? "",
    roomType: data.listing.propertyDetails?.roomType ?? "private_room",
    bathroomType: data.listing.propertyDetails?.bathroomType ?? "attached",
    occupancyMode: data.listing.propertyDetails?.occupancyMode ?? "single",
    balcony: data.listing.propertyDetails?.balcony ?? "yes",
    wardrobe: data.listing.propertyDetails?.wardrobe ?? "yes",
    airConditioning: data.listing.propertyDetails?.airConditioning ?? "no",
    deskSetup: data.listing.propertyDetails?.deskSetup ?? "no",
    naturalLight: data.listing.propertyDetails?.naturalLight ?? "moderate",
    openSpots: data.listing.propertyDetails?.openSpots ?? "",
    totalCapacity: data.listing.propertyDetails?.totalCapacity ?? "",
    bedroomsAvailable: data.listing.propertyDetails?.bedroomsAvailable ?? "",
    suitableFor: data.listing.propertyDetails?.suitableFor ?? [],
    replacementSpotType: data.listing.replacementDetails?.replacementSpotType ?? "",
    replacementHandoverDate: data.listing.replacementDetails?.replacementHandoverDate?.slice(0, 10) ?? "",
    depositTransferNotes: data.listing.replacementDetails?.depositTransferNotes ?? "",
    landlordApprovalRequired: data.listing.replacementDetails?.landlordApprovalRequired ?? "no",
    flatmateApprovalRequired: data.listing.replacementDetails?.flatmateApprovalRequired ?? "yes",
    currentOccupants: data.listing.householdProfile?.currentOccupants ?? "",
    householdGenderMix: data.listing.householdProfile?.householdGenderMix ?? "",
    householdAgeRange: data.listing.householdProfile?.householdAgeRange ?? "",
    occupationMix: data.listing.householdProfile?.occupationMix ?? "",
    workModeMix: data.listing.householdProfile?.workModeMix ?? "",
    languagesSpoken: data.listing.householdProfile?.languagesSpoken ?? "",
    ownerLivesThere: data.listing.householdProfile?.ownerLivesThere ?? "no",
    petsInHome: data.listing.householdProfile?.petsInHome ?? "no",
    smokingPolicy:
      data.listing.compatibilityProfile?.smokingPolicy ??
      (data.preference?.smokingAllowed ? "allowed" : "not_allowed"),
    drinkingPolicy:
      data.listing.compatibilityProfile?.drinkingPolicy ??
      (data.preference?.drinkingAllowed ? "comfortable" : "not_allowed"),
    kitchenPreference: data.listing.compatibilityProfile?.kitchenPreference ?? "mixed_kitchen",
    guestPolicy: data.listing.compatibilityProfile?.guestPolicy ?? "moderate",
    overnightGuestPolicy: data.listing.compatibilityProfile?.overnightGuestPolicy ?? "moderate",
    cleanlinessLevel: data.listing.compatibilityProfile?.cleanlinessLevel ?? "moderate",
    noiseTolerance: data.listing.compatibilityProfile?.noiseTolerance ?? "balanced",
    socialVibe: data.listing.compatibilityProfile?.socialVibe ?? "balanced",
    wakeSleepRoutine: data.listing.compatibilityProfile?.wakeSleepRoutine ?? "mixed",
    wfhFriendly: data.listing.compatibilityProfile?.wfhFriendly ?? "sometimes",
    choresSetup: data.listing.compatibilityProfile?.choresSetup ?? "flexible",
    preferredGender:
      data.listing.idealFlatmateProfile?.preferredGender ??
      data.preference?.genderPreference ??
      "",
    preferredAgeBand: data.listing.idealFlatmateProfile?.preferredAgeBand ?? "",
    preferredOccupation:
      data.listing.idealFlatmateProfile?.preferredOccupation ??
      data.preference?.occupationPreference ??
      "",
    preferredWorkStyle: data.listing.idealFlatmateProfile?.preferredWorkStyle ?? "",
    preferredPersonality: data.listing.idealFlatmateProfile?.preferredPersonality ?? "balanced",
    preferredFlatmateProfile: data.listing.idealFlatmateProfile?.preferredFlatmateProfile ?? "",
    bestSuitedFor: data.listing.idealFlatmateProfile?.bestSuitedFor ?? "",
    houseRules: data.listing.houseRules?.houseRules ?? "",
    nonNegotiables: data.listing.houseRules?.nonNegotiables ?? "",
    restrictions: data.listing.houseRules?.restrictions ?? ""
  };
}

function choiceLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function updateDraftValue<K extends keyof ListingFormDraft>(
  setDraft: React.Dispatch<React.SetStateAction<ListingFormDraft>>,
  key: K,
  value: ListingFormDraft[K]
) {
  setDraft((current) => ({ ...current, [key]: value }));
}

function ChoiceGrid({
  label,
  value,
  options,
  onChange,
  hint
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string; description?: string }[];
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="wizard-field-group">
      <div className="wizard-group-header">
        <strong>{label}</strong>
        {hint ? <span>{hint}</span> : null}
      </div>
      <div className="wizard-choice-grid">
        {options.map((option) => (
          <button
            key={option.value}
            className={`wizard-choice-card${value === option.value ? " wizard-choice-card-active" : ""}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <strong>{option.label}</strong>
            {option.description ? <span>{option.description}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleChipGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="wizard-field-group">
      <div className="wizard-group-header">
        <strong>{label}</strong>
      </div>
      <div className="wizard-chip-row">
        {options.map((option) => (
          <button
            key={option.value}
            className={`wizard-chip${value === option.value ? " wizard-chip-active" : ""}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectChipGroup({
  label,
  values,
  options,
  onChange
}: {
  label: string;
  values: string[];
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="wizard-field-group">
      <div className="wizard-group-header">
        <strong>{label}</strong>
      </div>
      <div className="wizard-chip-row">
        {options.map((option) => {
          const isActive = values.includes(option.value);
          return (
            <button
              key={option.value}
              className={`wizard-chip${isActive ? " wizard-chip-active" : ""}`}
              onClick={() =>
                onChange(
                  isActive ? values.filter((value) => value !== option.value) : [...values, option.value]
                )
              }
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="wizard-review-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ListingFormWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { pushToast } = useToast();
  const [step, setStep] = useState<ListingWizardStep>("basics");
  const [draft, setDraft] = useState<ListingFormDraft>(createEmptyDraft);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  const listingQuery = useQuery({
    queryKey: ["listing-editor", id],
    queryFn: () => listingsApi.get(id!, true),
    enabled: Boolean(id)
  });

  const draftKey = useMemo(() => (id ? `listing:${id}` : "listing:new"), [id]);

  useEffect(() => {
    if (draftHydrated) return;

    const storedDraft = readStoredDrafts()[draftKey];
    if (storedDraft) {
      setDraft({ ...createEmptyDraft(), ...storedDraft });
      setDraftHydrated(true);
      return;
    }

    if (listingQuery.data) {
      setDraft(buildExistingDraft(listingQuery.data));
      setExistingImageUrls(listingQuery.data.images.map((image) => image.imageUrl));
      setDraftHydrated(true);
      return;
    }

    if (!id) {
      setDraftHydrated(true);
    }
  }, [draftHydrated, draftKey, id, listingQuery.data]);

  useEffect(() => {
    if (!draftHydrated) return;
    writeStoredDraft(draftKey, draft);
  }, [draft, draftHydrated, draftKey]);

  const saveMutation = useMutation({
    mutationFn: async ({
      mode,
      forceDraftStatus
    }: {
      mode: "draft" | "save";
      forceDraftStatus?: boolean;
    }) => {
      const uploadedImageUrls =
        imageFiles.length > 0
          ? await Promise.all(imageFiles.map((file) => uploadsApi.uploadFile(file, "listing_image", "listing", id)))
          : [];

      const payload = buildPayload(
        {
          ...draft,
          targetStatus: forceDraftStatus ? "draft" : draft.targetStatus
        },
        [...existingImageUrls, ...uploadedImageUrls]
      );

      if (id) {
        return listingsApi.update(id, payload);
      }

      return listingsApi.create(payload);
    },
    onSuccess: async (data, variables) => {
      const nextListingId = data.listing._id;
      const nextDraftKey = `listing:${nextListingId}`;
      const nextDraft = { ...draft };
      writeStoredDraft(nextDraftKey, nextDraft);
      if (!id) {
        removeStoredDraft("listing:new");
      }
      setImageFiles([]);
      setExistingImageUrls(data.images.map((image) => image.imageUrl));
      await queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listing-editor", nextListingId] });

      if (variables.mode === "draft") {
        pushToast(id ? "Draft synced." : "Draft created. You can keep refining it now.", "success");
        if (!id) {
          navigate(`/listings/${nextListingId}/edit`, { replace: true });
        }
        return;
      }

      pushToast(id ? "Listing updated." : "Listing created.", "success");
      navigate("/my-listings");
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : "Unable to save listing", "error");
    }
  });

  const prospectiveImageCount = existingImageUrls.length + imageFiles.length;

  const stepIssues = useMemo<Record<ListingWizardStep, string[]>>(() => {
    const basicsIssues = [
      draft.title.trim().length < 3 ? "Add a listing title." : null,
      draft.summary.trim().length < 10 ? "Write a short summary that helps someone self-select." : null,
      draft.locationText.trim().length < 2 ? "Add at least a locality." : null,
      !draft.moveInDate ? "Choose a move-in date." : null
    ].filter(Boolean) as string[];

    const propertyIssues = [
      draft.rent <= 0 ? "Set a monthly rent." : null,
      draft.deposit < 0 ? "Deposit cannot be negative." : null,
      !draft.layout.trim() ? "Add the home layout or BHK." : null,
      draft.listingType === "replacement" && !draft.replacementSpotType.trim() ? "Describe the exact spot being replaced." : null,
      draft.listingType === "flatmate_needed" && !draft.openSpots.trim() ? "Add the number of open spots." : null,
      draft.listingType === "full_flat" && !draft.totalCapacity.trim() ? "Add total occupancy capacity." : null
    ].filter(Boolean) as string[];

    const householdIssues = [
      !draft.currentOccupants.trim() ? "Add current occupant count." : null,
      !draft.occupationMix.trim() ? "Describe who already lives here." : null,
      !draft.workModeMix.trim() ? "Add the household work style." : null
    ].filter(Boolean) as string[];

    const compatibilityIssues = [
      !draft.bestSuitedFor.trim() ? "Add a best-suited-for summary." : null,
      !draft.houseRules.trim() ? "Write at least a few house rules." : null,
      !draft.nonNegotiables.trim() ? "Add the non-negotiables that reduce mismatch." : null
    ].filter(Boolean) as string[];

    const reviewIssues = [
      draft.targetStatus === "active" && !currentUser?.eligibility.eligible
        ? "Publishing requires an interaction-ready profile."
        : null,
      draft.targetStatus === "active" && prospectiveImageCount < 3
        ? "Active listings need at least 3 images."
        : null
    ].filter(Boolean) as string[];

    return {
      basics: basicsIssues,
      property: propertyIssues,
      household: householdIssues,
      compatibility: compatibilityIssues,
      review: reviewIssues
    };
  }, [currentUser?.eligibility.eligible, draft, prospectiveImageCount]);

  const publishReadiness = useMemo(() => STEP_ORDER.flatMap((stepKey) => stepIssues[stepKey]), [stepIssues]);

  const currentStepIndex = STEP_ORDER.indexOf(step);

  if (id && listingQuery.isLoading && !draftHydrated) {
    return <LoadingBlock label="Loading listing editor..." />;
  }

  const handleSaveDraft = async () => {
    writeStoredDraft(draftKey, draft);

    if (!canPersistRemotely(draft)) {
      pushToast("Draft saved locally. Complete the basics to sync it to the marketplace.", "success");
      return;
    }

    await saveMutation.mutateAsync({ mode: "draft", forceDraftStatus: true });
  };

  const handlePublish = async () => {
    if (draft.targetStatus === "active" && publishReadiness.length) {
      pushToast("Fix the missing publish requirements before going live.", "error");
      return;
    }

    await saveMutation.mutateAsync({ mode: "save" });
  };

  const stepBadges = STEP_META.map((item, index) => {
    const issues = stepIssues[item.id];
    const isActive = step === item.id;
    const isComplete = issues.length === 0;
    const isLocked = index > currentStepIndex + 1 && STEP_ORDER[currentStepIndex] !== "review";

    return (
      <button
        key={item.id}
        className={`wizard-step-card${isActive ? " wizard-step-card-active" : ""}${isComplete ? " wizard-step-card-complete" : ""}`}
        disabled={isLocked}
        onClick={() => setStep(item.id)}
        type="button"
      >
        <span>{`Step ${index + 1}`}</span>
        <strong>{item.title}</strong>
        <small>{isComplete ? "Ready" : `${issues.length} item${issues.length === 1 ? "" : "s"} left`}</small>
      </button>
    );
  });

  const stepFooter = (
    <div className="wizard-footer">
      <div className="row-actions">
        {currentStepIndex > 0 ? (
          <Button tone="secondary" onClick={() => setStep(STEP_ORDER[currentStepIndex - 1])} type="button">
            Back
          </Button>
        ) : null}
        {currentStepIndex < STEP_ORDER.length - 1 ? (
          <Button onClick={() => setStep(STEP_ORDER[currentStepIndex + 1])} type="button">
            Continue
          </Button>
        ) : (
          <Button disabled={saveMutation.isPending} onClick={handlePublish} type="button">
            {saveMutation.isPending ? "Saving..." : id ? "Save changes" : "Create listing"}
          </Button>
        )}
      </div>

      <div className="row-actions">
        <Button disabled={saveMutation.isPending} onClick={() => void handleSaveDraft()} tone="secondary" type="button">
          {saveMutation.isPending ? "Saving..." : "Save draft"}
        </Button>
        <ButtonLink to="/my-listings" tone="tertiary">
          Cancel
        </ButtonLink>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={id ? "Edit listing" : "Create listing"}
        title={id ? "Refine your listing" : "Build a compatibility-first listing"}
        description="This flow starts with easy essentials, then layers in household fit and compatibility detail so the final listing feels serious without feeling exhausting."
      />

      <div className="wizard-shell">
        <Card className="wizard-sidebar">
          <div className="wizard-sidebar-copy">
            <span className="section-tag">Compatibility-first</span>
            <h3>{STEP_META[currentStepIndex].title}</h3>
            <p>{STEP_META[currentStepIndex].description}</p>
          </div>
          <div className="wizard-step-stack">{stepBadges}</div>
          <InlineNotice tone="info">
            `Save draft` always keeps your in-progress work. If the basics are complete, it also syncs a backend draft.
          </InlineNotice>
        </Card>

        <Card className="wizard-main-card">
          {step === "basics" ? (
            <div className="wizard-step-body">
              <ChoiceGrid
                label="What kind of listing are you creating?"
                value={draft.listingType}
                options={LISTING_TYPE_OPTIONS}
                onChange={(value) => updateDraftValue(setDraft, "listingType", value as ListingFormDraft["listingType"])}
              />

              <div className="wizard-section-grid">
                <Field label="Listing title" hint="Keep it sharp and specific, like the hook on a card.">
                  <Input
                    placeholder="Sunny private room near HSR startup hub"
                    value={draft.title}
                    onChange={(event) => updateDraftValue(setDraft, "title", event.target.value)}
                  />
                </Field>
                <Field label="City">
                  <Input
                    placeholder="Bengaluru"
                    value={draft.city}
                    onChange={(event) => updateDraftValue(setDraft, "city", event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Short summary" hint="This is the first compatibility signal. Keep it human and specific.">
                <Textarea
                  rows={5}
                  placeholder="Best for a working professional who wants a calm weekday routine, a mixed kitchen, and a tidy shared home."
                  value={draft.summary}
                  onChange={(event) => updateDraftValue(setDraft, "summary", event.target.value)}
                />
              </Field>

              <div className="wizard-section-grid">
                <Field label="Locality / area">
                  <Input
                    placeholder="Koramangala, Bengaluru"
                    value={draft.locationText}
                    onChange={(event) => updateDraftValue(setDraft, "locationText", event.target.value)}
                  />
                </Field>
                <Field label="Move-in date">
                  <Input
                    type="date"
                    value={draft.moveInDate}
                    onChange={(event) => updateDraftValue(setDraft, "moveInDate", event.target.value)}
                  />
                </Field>
              </div>

              <ToggleChipGroup
                label="How urgent is the move-in?"
                onChange={(value) => updateDraftValue(setDraft, "urgency", value as ListingFormDraft["urgency"])}
                options={URGENCY_OPTIONS}
                value={draft.urgency}
              />

              {stepIssues.basics.length ? (
                <InlineNotice tone="warning">{stepIssues.basics.join(" ")}</InlineNotice>
              ) : (
                <InlineNotice tone="success">The basics are clear enough for someone to understand what kind of opportunity this is.</InlineNotice>
              )}
            </div>
          ) : null}

          {step === "property" ? (
            <div className="wizard-step-body">
              <div className="wizard-section-grid">
                <Field label="Property type">
                  <Select
                    value={draft.propertyType}
                    onChange={(event) => updateDraftValue(setDraft, "propertyType", event.target.value as ListingFormDraft["propertyType"])}
                  >
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Layout / BHK">
                  <Input
                    placeholder="3BHK, 2BHK + study, studio"
                    value={draft.layout}
                    onChange={(event) => updateDraftValue(setDraft, "layout", event.target.value)}
                  />
                </Field>
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <Field label="Monthly rent">
                  <Input
                    inputMode="numeric"
                    value={draft.rent || ""}
                    onChange={(event) => updateDraftValue(setDraft, "rent", Number(event.target.value) || 0)}
                  />
                </Field>
                <Field label="Deposit">
                  <Input
                    inputMode="numeric"
                    value={draft.deposit || ""}
                    onChange={(event) => updateDraftValue(setDraft, "deposit", Number(event.target.value) || 0)}
                  />
                </Field>
                <Field label="Minimum stay">
                  <Input
                    placeholder="6 months"
                    value={draft.minimumStay}
                    onChange={(event) => updateDraftValue(setDraft, "minimumStay", event.target.value)}
                  />
                </Field>
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <Field label="Maintenance / society charges">
                  <Input
                    placeholder="Included in rent / split monthly"
                    value={draft.maintenanceInfo}
                    onChange={(event) => updateDraftValue(setDraft, "maintenanceInfo", event.target.value)}
                  />
                </Field>
                <Field label="Utility split">
                  <Input
                    placeholder="Electricity + Wi-Fi split equally"
                    value={draft.utilitySplit}
                    onChange={(event) => updateDraftValue(setDraft, "utilitySplit", event.target.value)}
                  />
                </Field>
                <Field label="Brokerage / lock-in info">
                  <Input
                    placeholder="No brokerage / 11-month lock-in"
                    value={draft.brokerageInfo}
                    onChange={(event) => updateDraftValue(setDraft, "brokerageInfo", event.target.value)}
                  />
                </Field>
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <Field label="Exact property address">
                  <Input
                    placeholder="Flat number, building, street, locality"
                    value={draft.exactAddress}
                    onChange={(event) => updateDraftValue(setDraft, "exactAddress", event.target.value)}
                  />
                </Field>
                <Field label="Google Maps link">
                  <Input
                    placeholder="https://maps.google.com/..."
                    value={draft.googleMapsUrl}
                    onChange={(event) => updateDraftValue(setDraft, "googleMapsUrl", event.target.value)}
                  />
                </Field>
                <Field label="Furnishing">
                  <Select
                    value={draft.furnishingStatus}
                    onChange={(event) =>
                      updateDraftValue(setDraft, "furnishingStatus", event.target.value as ListingFormDraft["furnishingStatus"])
                    }
                  >
                    {FURNISHING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Map pin" hint="Pinning the property auto-fills the location fields when address lookup succeeds.">
                <MapPicker
                  latitude={draft.latitude}
                  longitude={draft.longitude}
                  onChange={({ latitude, longitude, locationText, exactAddress, googleMapsUrl }) =>
                    setDraft((current) => ({
                      ...current,
                      latitude,
                      longitude,
                      locationText: locationText || current.locationText,
                      exactAddress: exactAddress || current.exactAddress,
                      googleMapsUrl: googleMapsUrl || current.googleMapsUrl
                    }))
                  }
                />
              </Field>

              <div className="wizard-section-grid wizard-section-grid-three">
                <Field label="Room / unit offered">
                  <Select
                    value={draft.roomType}
                    onChange={(event) => updateDraftValue(setDraft, "roomType", event.target.value as ListingFormDraft["roomType"])}
                  >
                    {ROOM_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Bathroom">
                  <Select
                    value={draft.bathroomType}
                    onChange={(event) =>
                      updateDraftValue(setDraft, "bathroomType", event.target.value as ListingFormDraft["bathroomType"])
                    }
                  >
                    {BATHROOM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Occupancy mode">
                  <Select
                    value={draft.occupancyMode}
                    onChange={(event) =>
                      updateDraftValue(setDraft, "occupancyMode", event.target.value as ListingFormDraft["occupancyMode"])
                    }
                  >
                    {OCCUPANCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <ToggleChipGroup
                  label="Lift available"
                  options={SIMPLE_YES_NO}
                  value={draft.liftAvailable}
                  onChange={(value) => updateDraftValue(setDraft, "liftAvailable", value as "yes" | "no")}
                />
                <ToggleChipGroup
                  label="Parking available"
                  options={SIMPLE_YES_NO}
                  value={draft.parkingAvailable}
                  onChange={(value) => updateDraftValue(setDraft, "parkingAvailable", value as "yes" | "no")}
                />
                <ToggleChipGroup
                  label="Natural light"
                  options={NATURAL_LIGHT_OPTIONS}
                  value={draft.naturalLight}
                  onChange={(value) => updateDraftValue(setDraft, "naturalLight", value as ListingFormDraft["naturalLight"])}
                />
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <ToggleChipGroup
                  label="Balcony"
                  options={SIMPLE_YES_NO}
                  value={draft.balcony}
                  onChange={(value) => updateDraftValue(setDraft, "balcony", value as "yes" | "no")}
                />
                <ToggleChipGroup
                  label="Wardrobe"
                  options={SIMPLE_YES_NO}
                  value={draft.wardrobe}
                  onChange={(value) => updateDraftValue(setDraft, "wardrobe", value as "yes" | "no")}
                />
                <ToggleChipGroup
                  label="Desk / WFH setup"
                  options={SIMPLE_YES_NO}
                  value={draft.deskSetup}
                  onChange={(value) => updateDraftValue(setDraft, "deskSetup", value as "yes" | "no")}
                />
              </div>

              {draft.listingType === "replacement" ? (
                <div className="wizard-subsection">
                  <h3>Replacement-specific details</h3>
                  <div className="wizard-section-grid">
                    <Field label="What exactly is being replaced?">
                      <Input
                        placeholder="Private room in a 3BHK / Bed in shared room"
                        value={draft.replacementSpotType}
                        onChange={(event) => updateDraftValue(setDraft, "replacementSpotType", event.target.value)}
                      />
                    </Field>
                    <Field label="Handover / takeover date">
                      <Input
                        type="date"
                        value={draft.replacementHandoverDate}
                        onChange={(event) => updateDraftValue(setDraft, "replacementHandoverDate", event.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="Deposit transfer details">
                    <Textarea
                      rows={3}
                      placeholder="Example: Deposit is transferred directly to the outgoing tenant after final confirmation."
                      value={draft.depositTransferNotes}
                      onChange={(event) => updateDraftValue(setDraft, "depositTransferNotes", event.target.value)}
                    />
                  </Field>
                  <div className="wizard-section-grid">
                    <ToggleChipGroup
                      label="Landlord approval required"
                      options={SIMPLE_YES_NO}
                      value={draft.landlordApprovalRequired}
                      onChange={(value) => updateDraftValue(setDraft, "landlordApprovalRequired", value as "yes" | "no")}
                    />
                    <ToggleChipGroup
                      label="Current flatmates approve final selection"
                      options={SIMPLE_YES_NO}
                      value={draft.flatmateApprovalRequired}
                      onChange={(value) => updateDraftValue(setDraft, "flatmateApprovalRequired", value as "yes" | "no")}
                    />
                  </div>
                </div>
              ) : null}

              {draft.listingType === "flatmate_needed" ? (
                <div className="wizard-subsection">
                  <h3>Flatmate-needed details</h3>
                  <div className="wizard-section-grid">
                    <Field label="How many spots are open?">
                      <Input
                        placeholder="1"
                        value={draft.openSpots}
                        onChange={(event) => updateDraftValue(setDraft, "openSpots", event.target.value)}
                      />
                    </Field>
                    <Field label="Ideal occupant profile">
                      <Input
                        placeholder="Working professional, student, creator..."
                        value={draft.preferredFlatmateProfile}
                        onChange={(event) => updateDraftValue(setDraft, "preferredFlatmateProfile", event.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              {draft.listingType === "full_flat" ? (
                <div className="wizard-subsection">
                  <h3>Full-flat details</h3>
                  <div className="wizard-section-grid wizard-section-grid-three">
                    <Field label="Total occupancy capacity">
                      <Input
                        placeholder="3 people"
                        value={draft.totalCapacity}
                        onChange={(event) => updateDraftValue(setDraft, "totalCapacity", event.target.value)}
                      />
                    </Field>
                    <Field label="Bedrooms available">
                      <Input
                        placeholder="2 bedrooms"
                        value={draft.bedroomsAvailable}
                        onChange={(event) => updateDraftValue(setDraft, "bedroomsAvailable", event.target.value)}
                      />
                    </Field>
                    <MultiSelectChipGroup
                      label="Suitable for"
                      options={SUITABLE_FOR_OPTIONS}
                      values={draft.suitableFor}
                      onChange={(value) => updateDraftValue(setDraft, "suitableFor", value)}
                    />
                  </div>
                </div>
              ) : null}

              {stepIssues.property.length ? (
                <InlineNotice tone="warning">{stepIssues.property.join(" ")}</InlineNotice>
              ) : (
                <InlineNotice tone="success">The physical setup and pricing are now specific enough for a serious screening conversation.</InlineNotice>
              )}
            </div>
          ) : null}

          {step === "household" ? (
            <div className="wizard-step-body">
              <div className="wizard-section-grid wizard-section-grid-three">
                <Field label="Current occupants">
                  <Input
                    placeholder="2"
                    value={draft.currentOccupants}
                    onChange={(event) => updateDraftValue(setDraft, "currentOccupants", event.target.value)}
                  />
                </Field>
                <Field label="Gender mix">
                  <Input
                    placeholder="Two women / mixed / all men"
                    value={draft.householdGenderMix}
                    onChange={(event) => updateDraftValue(setDraft, "householdGenderMix", event.target.value)}
                  />
                </Field>
                <Field label="Age range">
                  <Input
                    placeholder="24-29"
                    value={draft.householdAgeRange}
                    onChange={(event) => updateDraftValue(setDraft, "householdAgeRange", event.target.value)}
                  />
                </Field>
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <Field label="Occupation mix">
                  <Input
                    placeholder="Working professionals / mixed with students"
                    value={draft.occupationMix}
                    onChange={(event) => updateDraftValue(setDraft, "occupationMix", event.target.value)}
                  />
                </Field>
                <Field label="Work mode mix">
                  <Input
                    placeholder="Hybrid, mostly office / two WFH and one office"
                    value={draft.workModeMix}
                    onChange={(event) => updateDraftValue(setDraft, "workModeMix", event.target.value)}
                  />
                </Field>
                <Field label="Languages spoken">
                  <Input
                    placeholder="Hindi, English, Kannada"
                    value={draft.languagesSpoken}
                    onChange={(event) => updateDraftValue(setDraft, "languagesSpoken", event.target.value)}
                  />
                </Field>
              </div>

              <div className="wizard-section-grid">
                <ToggleChipGroup
                  label="Does the owner or landlord live here?"
                  options={SIMPLE_YES_NO}
                  value={draft.ownerLivesThere}
                  onChange={(value) => updateDraftValue(setDraft, "ownerLivesThere", value as "yes" | "no")}
                />
                <ToggleChipGroup
                  label="Are there pets in the home?"
                  options={SIMPLE_YES_NO}
                  value={draft.petsInHome}
                  onChange={(value) => updateDraftValue(setDraft, "petsInHome", value as "yes" | "no")}
                />
              </div>

              <InlineNotice tone="info">
                This section is what makes the listing feel personal. It tells applicants who they would actually be living with.
              </InlineNotice>

              {stepIssues.household.length ? (
                <InlineNotice tone="warning">{stepIssues.household.join(" ")}</InlineNotice>
              ) : (
                <InlineNotice tone="success">The household now feels like people, not just numbers in a property card.</InlineNotice>
              )}
            </div>
          ) : null}

          {step === "compatibility" ? (
            <div className="wizard-step-body">
              <div className="wizard-section-grid wizard-section-grid-three">
                <ToggleChipGroup
                  label="Smoking policy"
                  options={SMOKING_POLICY_OPTIONS}
                  value={draft.smokingPolicy}
                  onChange={(value) => updateDraftValue(setDraft, "smokingPolicy", value as ListingFormDraft["smokingPolicy"])}
                />
                <ToggleChipGroup
                  label="Drinking policy"
                  options={DRINKING_POLICY_OPTIONS}
                  value={draft.drinkingPolicy}
                  onChange={(value) => updateDraftValue(setDraft, "drinkingPolicy", value as ListingFormDraft["drinkingPolicy"])}
                />
                <ToggleChipGroup
                  label="Kitchen setup"
                  options={KITCHEN_OPTIONS}
                  value={draft.kitchenPreference}
                  onChange={(value) =>
                    updateDraftValue(setDraft, "kitchenPreference", value as ListingFormDraft["kitchenPreference"])
                  }
                />
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <ToggleChipGroup
                  label="Guests"
                  options={GUEST_POLICY_OPTIONS}
                  value={draft.guestPolicy}
                  onChange={(value) => updateDraftValue(setDraft, "guestPolicy", value as ListingFormDraft["guestPolicy"])}
                />
                <ToggleChipGroup
                  label="Overnight guests"
                  options={GUEST_POLICY_OPTIONS}
                  value={draft.overnightGuestPolicy}
                  onChange={(value) =>
                    updateDraftValue(setDraft, "overnightGuestPolicy", value as ListingFormDraft["overnightGuestPolicy"])
                  }
                />
                <ToggleChipGroup
                  label="Cleanliness expectation"
                  options={CLEANLINESS_OPTIONS}
                  value={draft.cleanlinessLevel}
                  onChange={(value) =>
                    updateDraftValue(setDraft, "cleanlinessLevel", value as ListingFormDraft["cleanlinessLevel"])
                  }
                />
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <ToggleChipGroup
                  label="Noise tolerance"
                  options={NOISE_OPTIONS}
                  value={draft.noiseTolerance}
                  onChange={(value) => updateDraftValue(setDraft, "noiseTolerance", value as ListingFormDraft["noiseTolerance"])}
                />
                <ToggleChipGroup
                  label="Social vibe"
                  options={SOCIAL_OPTIONS}
                  value={draft.socialVibe}
                  onChange={(value) => updateDraftValue(setDraft, "socialVibe", value as ListingFormDraft["socialVibe"])}
                />
                <ToggleChipGroup
                  label="Wake / sleep routine"
                  options={ROUTINE_OPTIONS}
                  value={draft.wakeSleepRoutine}
                  onChange={(value) =>
                    updateDraftValue(setDraft, "wakeSleepRoutine", value as ListingFormDraft["wakeSleepRoutine"])
                  }
                />
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <ToggleChipGroup
                  label="WFH friendliness"
                  options={WFH_OPTIONS}
                  value={draft.wfhFriendly}
                  onChange={(value) => updateDraftValue(setDraft, "wfhFriendly", value as ListingFormDraft["wfhFriendly"])}
                />
                <ToggleChipGroup
                  label="Chores setup"
                  options={CHORES_OPTIONS}
                  value={draft.choresSetup}
                  onChange={(value) => updateDraftValue(setDraft, "choresSetup", value as ListingFormDraft["choresSetup"])}
                />
                <ToggleChipGroup
                  label="Preferred personality"
                  options={PERSONALITY_OPTIONS}
                  value={draft.preferredPersonality}
                  onChange={(value) =>
                    updateDraftValue(setDraft, "preferredPersonality", value as ListingFormDraft["preferredPersonality"])
                  }
                />
              </div>

              <div className="wizard-section-grid wizard-section-grid-three">
                <Field label="Preferred gender">
                  <Input
                    placeholder="Any / women / men / mixed comfort"
                    value={draft.preferredGender}
                    onChange={(event) => updateDraftValue(setDraft, "preferredGender", event.target.value)}
                  />
                </Field>
                <Field label="Preferred age band">
                  <Input
                    placeholder="22-30"
                    value={draft.preferredAgeBand}
                    onChange={(event) => updateDraftValue(setDraft, "preferredAgeBand", event.target.value)}
                  />
                </Field>
                <Field label="Preferred occupation">
                  <Input
                    placeholder="Working professional / student / flexible"
                    value={draft.preferredOccupation}
                    onChange={(event) => updateDraftValue(setDraft, "preferredOccupation", event.target.value)}
                  />
                </Field>
              </div>

              <div className="wizard-section-grid">
                <Field label="Preferred work style">
                  <Input
                    placeholder="Mostly office / hybrid / flexible"
                    value={draft.preferredWorkStyle}
                    onChange={(event) => updateDraftValue(setDraft, "preferredWorkStyle", event.target.value)}
                  />
                </Field>
                <Field label="Best suited for">
                  <Input
                    placeholder="Quiet working professional who values a tidy weekday routine"
                    value={draft.bestSuitedFor}
                    onChange={(event) => updateDraftValue(setDraft, "bestSuitedFor", event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Ideal flatmate summary">
                <Textarea
                  rows={4}
                  placeholder="Describe the person who would fit best here and why."
                  value={draft.preferredFlatmateProfile}
                  onChange={(event) => updateDraftValue(setDraft, "preferredFlatmateProfile", event.target.value)}
                />
              </Field>

              <div className="wizard-section-grid">
                <Field label="House rules">
                  <Textarea
                    rows={4}
                    placeholder="Example: Shared cleaning every Sunday, no loud gatherings after 11pm, rent by the 3rd."
                    value={draft.houseRules}
                    onChange={(event) => updateDraftValue(setDraft, "houseRules", event.target.value)}
                  />
                </Field>
                <Field label="Non-negotiables">
                  <Textarea
                    rows={4}
                    placeholder="Example: No smoking inside the house, no missed payment cycles, vegetarian kitchen only."
                    value={draft.nonNegotiables}
                    onChange={(event) => updateDraftValue(setDraft, "nonNegotiables", event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Society or landlord restrictions">
                <Textarea
                  rows={3}
                  placeholder="Any move-in, visitor, pet, or society restrictions that matter before someone applies."
                  value={draft.restrictions}
                  onChange={(event) => updateDraftValue(setDraft, "restrictions", event.target.value)}
                />
              </Field>

              {stepIssues.compatibility.length ? (
                <InlineNotice tone="warning">{stepIssues.compatibility.join(" ")}</InlineNotice>
              ) : (
                <InlineNotice tone="success">The listing now describes compatibility, not just inventory. That’s the real matching edge.</InlineNotice>
              )}
            </div>
          ) : null}

          {step === "review" ? (
            <div className="wizard-step-body">
              {draft.targetStatus === "active" && !currentUser?.eligibility.eligible ? (
                <InlineNotice tone="warning">
                  Publishing requires an interaction-ready profile before the backend will accept an active listing.
                </InlineNotice>
              ) : null}
              {draft.targetStatus === "active" && prospectiveImageCount < 3 ? (
                <InlineNotice tone="warning">Publishing also requires at least 3 images.</InlineNotice>
              ) : null}

              <div className="wizard-section-grid">
                <Field label="Target status">
                  <Select
                    value={draft.targetStatus}
                    onChange={(event) =>
                      updateDraftValue(setDraft, "targetStatus", event.target.value as ListingFormDraft["targetStatus"])
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="filled">Filled</option>
                    <option value="archived">Archived</option>
                  </Select>
                </Field>
              </div>

              <Field label="Listing images" hint="Keep at least 3 for a live listing. You can remove existing images and add pending uploads here.">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))}
                />
                {existingImageUrls.length ? (
                  <div className="editor-image-grid">
                    {existingImageUrls.map((imageUrl, index) => (
                      <div key={imageUrl} className="editor-image-card">
                        <div className="editor-image-frame">
                          <img alt={`Existing listing image ${index + 1}`} src={imageUrl} />
                        </div>
                        <div className="mini-actions">
                          <span>Current image {index + 1}</span>
                          <Button
                            tone="danger"
                            type="button"
                            onClick={() => setExistingImageUrls((current) => current.filter((url) => url !== imageUrl))}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {imageFiles.length ? (
                  <div className="editor-image-grid">
                    {imageFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="editor-image-card editor-image-card-pending">
                        <div className="editor-image-meta">
                          <strong>{file.name}</strong>
                          <span>Will upload on save</span>
                        </div>
                        <div className="mini-actions">
                          <span>New image {index + 1}</span>
                          <Button
                            tone="secondary"
                            type="button"
                            onClick={() => setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Field>

              {draft.latitude != null && draft.longitude != null ? (
                <MapPreview label="Pinned property location" latitude={draft.latitude} longitude={draft.longitude} />
              ) : null}

              <div className="wizard-review-grid">
                <Card className="wizard-review-card">
                  <h3>Property summary</h3>
                  <ReviewItem label="Type" value={listTypeLabel(draft.listingType)} />
                  <ReviewItem label="Location" value={draft.locationText || "Not added yet"} />
                  <ReviewItem label="Rent" value={draft.rent ? `INR ${draft.rent}` : "Not added yet"} />
                  <ReviewItem label="Deposit" value={`INR ${draft.deposit || 0}`} />
                  <ReviewItem label="Move-in date" value={draft.moveInDate || "Not added yet"} />
                  <ReviewItem label="Room offered" value={choiceLabel(ROOM_TYPE_OPTIONS, draft.roomType)} />
                </Card>

                <Card className="wizard-review-card">
                  <h3>Household summary</h3>
                  <ReviewItem label="Current occupants" value={draft.currentOccupants || "Not added yet"} />
                  <ReviewItem label="Occupation mix" value={draft.occupationMix || "Not added yet"} />
                  <ReviewItem label="Work mode" value={draft.workModeMix || "Not added yet"} />
                  <ReviewItem label="Languages" value={draft.languagesSpoken || "Not added yet"} />
                </Card>

                <Card className="wizard-review-card">
                  <h3>Compatibility summary</h3>
                  <ReviewItem label="Smoking" value={choiceLabel(SMOKING_POLICY_OPTIONS, draft.smokingPolicy)} />
                  <ReviewItem label="Kitchen" value={choiceLabel(KITCHEN_OPTIONS, draft.kitchenPreference)} />
                  <ReviewItem label="Cleanliness" value={choiceLabel(CLEANLINESS_OPTIONS, draft.cleanlinessLevel)} />
                  <ReviewItem label="Best suited for" value={draft.bestSuitedFor || "Not added yet"} />
                </Card>

                <Card className="wizard-review-card">
                  <h3>Trust and publish summary</h3>
                  <ReviewItem label="Profile eligibility" value={currentUser?.eligibility.eligible ? "Ready" : "Needs setup"} />
                  <ReviewItem label="Image count" value={`${prospectiveImageCount} image${prospectiveImageCount === 1 ? "" : "s"}`} />
                  <ReviewItem label="Status on save" value={draft.targetStatus} />
                  <ReviewItem label="Exact address" value={draft.exactAddress || "Not added yet"} />
                </Card>
              </div>

              {publishReadiness.length ? (
                <InlineNotice tone="warning">
                  Missing before this can go live: {publishReadiness.join(" ")}
                </InlineNotice>
              ) : (
                <InlineNotice tone="success">
                  The listing looks publish-ready and compatibility-rich.
                </InlineNotice>
              )}
            </div>
          ) : null}

          {stepFooter}
        </Card>
      </div>
    </div>
  );
}

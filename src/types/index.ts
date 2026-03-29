export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  bio: string | null;
  theme_preference: string;
  points?: number;
  is_admin?: boolean;
  created_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  qr_id: string;
  name: string;
  species: "dog" | "cat" | "other";
  breed: string | null;
  color: string | null;
  age: number | null;
  description: string | null;
  photos: string[];
  contact_phone: string | null;
  contact_email: string | null;
  whatsapp: string | null;
  is_lost: boolean;
  reward_description: string | null;
  // New fields v3
  allergies: string | null;
  conditions: string | null;
  is_sterilized: boolean;
  is_dewormed: boolean;
  special_diet: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  personality_notes: string | null;
  usual_location: string | null;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface ScanEvent {
  id: string;
  pet_id: string;
  qr_id: string;
  latitude: number | null;
  longitude: number | null;
  device_info: string | null;
  notified_at: string | null;
  created_at: string;
}

export interface Vaccine {
  id: string;
  pet_id: string;
  name: string;
  date_given: string | null;
  next_due_date: string | null;
  notes: string | null;
  is_given: boolean;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  pet_id: string | null;
  media_url: string;
  caption: string | null;
  views_count: number;
  expires_at: string;
  created_at: string;
  author?: { id: string; full_name: string | null; avatar_url: string | null } | null;
  pet?: { id: string; name: string; species: string } | null;
}

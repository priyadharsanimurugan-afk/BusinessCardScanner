import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/services/profile";
import { Profile } from "@/types/profile";

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // ✅ ADD THIS

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null); // ✅ reset error

      const data = await getProfile();
      setProfile(data);

    } catch (err: any) {
      console.log("Profile fetch error", err);

      setError(
        err?.response?.data?.message || "Failed to load profile"
      ); // ✅ IMPORTANT

    } finally {
      setLoading(false);
    }
  };

  const editProfile = async (userName: string, phoneNumber: string) => {
    try {
      setLoading(true);
      setError(null); // ✅ reset error

      const updated = await updateProfile({ userName, phoneNumber });

      setProfile(prev => ({
        ...prev,
        ...updated,
      }));

    } catch (err: any) {
      console.log("Profile update error", err);

      setError(
        err?.response?.data?.message || "Failed to update profile"
      ); // ✅ ADD THIS

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    editProfile,
  };
};

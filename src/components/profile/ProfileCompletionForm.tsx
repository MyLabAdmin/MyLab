"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { upload } from "@imagekit/next";
import { useLocale,  useTranslations } from "next-intl";
import { COUNTRY_CODES, getCountryName } from "@/lib/countries";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthError } from "@/components/auth/ui/AuthError";
import { AuthField } from "@/components/auth/ui/AuthField";
import { AuthSubmitButton } from "@/components/auth/ui/AuthSubmitButton";

type Gender = "male" | "female";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const DEFAULT_AVATAR_URL = "/assets/avatars/person-avatar.png";

export function ProfileCompletionForm() {
  const router = useRouter();
  const t = useTranslations("profile");
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState<"diploma" | "bachelor">("bachelor");
  const [specialty, setSpecialty] = useState("");
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");

  const [postgraduateUniversity, setPostgraduateUniversity] = useState("");
  const [postgraduateDegree, setPostgraduateDegree] = useState<
    "higher_diploma" | "master" | "doctorate"
  >("master");
  const [postgraduateSpecialty, setPostgraduateSpecialty] = useState("");
  const [postgraduateFromYear, setPostgraduateFromYear] = useState("");
  const [postgraduateToYear, setPostgraduateToYear] = useState("");

  const [workOrganization, setWorkOrganization] = useState("");
  const [workJobTitle, setWorkJobTitle] = useState("");
  const [workFromYear, setWorkFromYear] = useState("");
  const [workToYear, setWorkToYear] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR_URL);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const locale = useLocale();

  function validateYears(from: string, to: string, incompleteMessage: string) {
    const hasAny = Boolean(from) || Boolean(to);

    if (!hasAny) {
      return true;
    }

    if (!from || !to) {
      setError(incompleteMessage);
      return false;
    }

    const fromNumber = Number(from);
    const toNumber = Number(to);

    if (
      !Number.isInteger(fromNumber) ||
      !Number.isInteger(toNumber) ||
      fromNumber < 1900 ||
      fromNumber > 2100 ||
      toNumber < 1900 ||
      toNumber > 2100
    ) {
      setError(t("validation.invalidYear"));
      return false;
    }

    if (fromNumber > toNumber) {
      setError(t("validation.yearOrder"));
      return false;
    }

    return true;
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(DEFAULT_AVATAR_URL);
      return;
    }

    if (
      !ALLOWED_AVATAR_TYPES.includes(
        file.type as (typeof ALLOWED_AVATAR_TYPES)[number],
      )
    ) {
      setAvatarFile(null);
      setAvatarPreview(DEFAULT_AVATAR_URL);
      setError(t("validation.invalidAvatar"));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarFile(null);
      setAvatarPreview(DEFAULT_AVATAR_URL);
      setError(t("validation.avatarTooLarge"));
      event.target.value = "";
      return;
    }

    setError(null);
    setAvatarFile(file);

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedCity = city.trim();
    const normalizedCountryCode = countryCode.trim().toUpperCase();
    const normalizedDateOfBirth = dateOfBirth.trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedCity ||
      !normalizedCountryCode ||
      !normalizedDateOfBirth
    ) {
      setError(t("validation.required"));
      return;
    }

    if (!/^[A-Z]{2}$/.test(normalizedCountryCode)) {
      setError(t("validation.invalidCountryCode"));
      return;
    }

    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    if (normalizedDateOfBirth > today) {
      setError(t("validation.futureDateOfBirth"));
      return;
    }

    const normalizedFromYear = fromYear.trim();
    const normalizedToYear = toYear.trim();

    const normalizedPostgraduateFromYear = postgraduateFromYear.trim();
    const normalizedPostgraduateToYear = postgraduateToYear.trim();

    const normalizedWorkFromYear = workFromYear.trim();
    const normalizedWorkToYear = workToYear.trim();

    const hasAnyEducationField =
      Boolean(university.trim()) ||
      Boolean(specialty.trim()) ||
      Boolean(normalizedFromYear) ||
      Boolean(normalizedToYear);

    const hasCompleteEducation =
      Boolean(university.trim()) &&
      Boolean(specialty.trim()) &&
      Boolean(normalizedFromYear) &&
      Boolean(normalizedToYear);

    if (hasAnyEducationField && !hasCompleteEducation) {
      setError(t("validation.incompleteEducation"));
      return;
    }

    if (
      hasCompleteEducation &&
      !validateYears(
        normalizedFromYear,
        normalizedToYear,
        t("validation.incompleteEducation"),
      )
    ) {
      return;
    }

    const hasAnyPostgraduate =
      Boolean(postgraduateUniversity.trim()) ||
      Boolean(postgraduateSpecialty.trim()) ||
      Boolean(normalizedPostgraduateFromYear) ||
      Boolean(normalizedPostgraduateToYear);

    const hasCompletePostgraduate =
      Boolean(postgraduateUniversity.trim()) &&
      Boolean(postgraduateSpecialty.trim()) &&
      Boolean(normalizedPostgraduateFromYear) &&
      Boolean(normalizedPostgraduateToYear);

    if (hasAnyPostgraduate && !hasCompletePostgraduate) {
      setError(t("validation.incompleteProfileSection"));
      return;
    }

    if (
      hasCompletePostgraduate &&
      !validateYears(
        normalizedPostgraduateFromYear,
        normalizedPostgraduateToYear,
        t("validation.incompleteProfileSection"),
      )
    ) {
      return;
    }

    const hasAnyWork =
      Boolean(workOrganization.trim()) ||
      Boolean(workJobTitle.trim()) ||
      Boolean(normalizedWorkFromYear) ||
      Boolean(normalizedWorkToYear);

    const hasCompleteWork =
      Boolean(workOrganization.trim()) &&
      Boolean(workJobTitle.trim()) &&
      Boolean(normalizedWorkFromYear) &&
      Boolean(normalizedWorkToYear);

    if (hasAnyWork && !hasCompleteWork) {
      setError(t("validation.incompleteProfileSection"));
      return;
    }

    if (
      hasCompleteWork &&
      !validateYears(
        normalizedWorkFromYear,
        normalizedWorkToYear,
        t("validation.incompleteProfileSection"),
      )
    ) {
      return;
    }

    setLoading(true);

    let uploadedAvatarUrl: string | null = null;

    if (avatarFile) {
      try {
        const authResponse = await fetch("/api/imagekit/auth");

        if (!authResponse.ok) {
          throw new Error("ImageKit authentication failed");
        }

        const authParams = await authResponse.json();

        const extension =
          avatarFile.type === "image/jpeg"
            ? "jpg"
            : avatarFile.type === "image/png"
              ? "png"
              : "webp";

        const uploadResponse = await upload({
          file: avatarFile,
          fileName: `avatar-${Date.now()}.${extension}`,
          token: authParams.token,
          signature: authParams.signature,
          expire: authParams.expire,
          publicKey: authParams.publicKey,
          folder: "/mylab/avatars",
          useUniqueFileName: true,
        });

        if (!uploadResponse.url) {
          throw new Error("ImageKit did not return an image URL");
        }

        uploadedAvatarUrl = uploadResponse.url;
      } catch {
        setError(t("validation.avatarUploadFailed"));
        setLoading(false);
        return;
      }
    }

    const undergraduate = hasCompleteEducation
      ? {
          university: university.trim(),
          degree,
          specialty: specialty.trim(),
          from_year: Number(normalizedFromYear),
          to_year: Number(normalizedToYear),
        }
      : null;

    const postgraduate = hasCompletePostgraduate
      ? {
          university: postgraduateUniversity.trim(),
          degree: postgraduateDegree,
          specialty: postgraduateSpecialty.trim(),
          from_year: Number(normalizedPostgraduateFromYear),
          to_year: Number(normalizedPostgraduateToYear),
        }
      : null;

    const work = hasCompleteWork
      ? {
          organization: workOrganization.trim(),
          job_title: workJobTitle.trim(),
          from_year: Number(normalizedWorkFromYear),
          to_year: Number(normalizedWorkToYear),
        }
      : null;

    const { error: profileError } = await supabase.rpc("complete_my_profile", {
      p_first_name: normalizedFirstName,
      p_last_name: normalizedLastName,
      p_city: normalizedCity,
      p_country_code: normalizedCountryCode,
      p_gender: gender,
      p_date_of_birth: normalizedDateOfBirth,
      p_phone: phone.trim() || null,
      p_bio: bio.trim() || null,
      p_undergraduate: undergraduate,
      p_postgraduate: postgraduate,
      p_work: work,
      p_avatar_url: uploadedAvatarUrl,

    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("basicInformation")}
        </h2>

        <AuthField
          label={t("firstName")}
          id="profile-first-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          disabled={loading}
        />

        <AuthField
          label={t("lastName")}
          id="profile-last-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          disabled={loading}
        />

        <AuthField
          label={t("city")}
          id="profile-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          disabled={loading}
        />

        <div className="space-y-2">
  <label
    htmlFor="profile-country"
    className="block text-sm font-medium text-neutral-800"
  >
    {t("country")}
  </label>

  <select
    id="profile-country"
    value={countryCode}
    onChange={(e) => setCountryCode(e.target.value)}
    required
    disabled={loading}
    className="block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm"
  >
    <option value="">
      {t("validation.selectCountry")}
    </option>

    {COUNTRY_CODES.map((code) => (
      <option key={code} value={code}>
        {getCountryName(code, locale)}
      </option>
    ))}
  </select>
</div>


        <div className="space-y-2">
          <label
            htmlFor="profile-gender"
            className="block text-sm font-medium text-neutral-800"
          >
            {t("gender")}
          </label>

          <select
            id="profile-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            disabled={loading}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
          </select>
        </div>

        <AuthField
          label={t("dateOfBirth")}
          id="profile-date-of-birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
          disabled={loading}
        />

        <AuthField
          label={t("phone")}
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />

        <div className="space-y-2">
          <label
            htmlFor="profile-bio"
            className="block text-sm font-medium text-neutral-800"
          >
            {t("bio")}
          </label>

          <textarea
            id="profile-bio"
            maxLength={150}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            className="block min-h-24 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("undergraduateEducation")}
        </h2>

        <AuthField
          label={t("university")}
          id="profile-university"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          disabled={loading}
        />

        <div className="space-y-2">
          <label
            htmlFor="profile-degree"
            className="block text-sm font-medium text-neutral-800"
          >
            {t("degree")}
          </label>

          <select
            id="profile-degree"
            value={degree}
            onChange={(e) =>
              setDegree(e.target.value as "diploma" | "bachelor")
            }
            disabled={loading}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="bachelor">{t("bachelor")}</option>
            <option value="diploma">{t("diploma")}</option>
          </select>
        </div>

        <AuthField
          label={t("specialty")}
          id="profile-specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-4">
          <AuthField
            label={t("fromYear")}
            id="profile-from-year"
            type="number"
            min={1900}
            max={2100}
            value={fromYear}
            onChange={(e) => setFromYear(e.target.value)}
            disabled={loading}
          />

          <AuthField
            label={t("toYear")}
            id="profile-to-year"
            type="number"
            min={1900}
            max={2100}
            value={toYear}
            onChange={(e) => setToYear(e.target.value)}
            disabled={loading}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("postgraduateEducation")}
        </h2>

        <AuthField
          label={t("university")}
          id="profile-postgraduate-university"
          value={postgraduateUniversity}
          onChange={(e) => setPostgraduateUniversity(e.target.value)}
          disabled={loading}
        />

        <div className="space-y-2">
          <label
            htmlFor="profile-postgraduate-degree"
            className="block text-sm font-medium text-neutral-800"
          >
            {t("degree")}
          </label>

          <select
            id="profile-postgraduate-degree"
            value={postgraduateDegree}
            onChange={(e) =>
              setPostgraduateDegree(
                e.target.value as "higher_diploma" | "master" | "doctorate",
              )
            }
            disabled={loading}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="higher_diploma">{t("higherDiploma")}</option>
            <option value="master">{t("master")}</option>
            <option value="doctorate">{t("doctorate")}</option>
          </select>
        </div>

        <AuthField
          label={t("specialty")}
          id="profile-postgraduate-specialty"
          value={postgraduateSpecialty}
          onChange={(e) => setPostgraduateSpecialty(e.target.value)}
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-4">
          <AuthField
            label={t("fromYear")}
            id="profile-postgraduate-from-year"
            type="number"
            min={1900}
            max={2100}
            value={postgraduateFromYear}
            onChange={(e) => setPostgraduateFromYear(e.target.value)}
            disabled={loading}
          />

          <AuthField
            label={t("toYear")}
            id="profile-postgraduate-to-year"
            type="number"
            min={1900}
            max={2100}
            value={postgraduateToYear}
            onChange={(e) => setPostgraduateToYear(e.target.value)}
            disabled={loading}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("workExperience")}
        </h2>

        <AuthField
          label={t("organization")}
          id="profile-work-organization"
          value={workOrganization}
          onChange={(e) => setWorkOrganization(e.target.value)}
          disabled={loading}
        />

        <AuthField
          label={t("jobTitle")}
          id="profile-work-job-title"
          value={workJobTitle}
          onChange={(e) => setWorkJobTitle(e.target.value)}
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-4">
          <AuthField
            label={t("fromYear")}
            id="profile-work-from-year"
            type="number"
            min={1900}
            max={2100}
            value={workFromYear}
            onChange={(e) => setWorkFromYear(e.target.value)}
            disabled={loading}
          />

          <AuthField
            label={t("toYear")}
            id="profile-work-to-year"
            type="number"
            min={1900}
            max={2100}
            value={workToYear}
            onChange={(e) => setWorkToYear(e.target.value)}
            disabled={loading}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("avatar")}
        </h2>

        <div className="flex flex-col items-center gap-4">
          <img
            src={avatarPreview}
            alt={t("avatar")}
            className="h-32 w-32 rounded-full object-cover ring-4 ring-neutral-100"
          />

          <label
            htmlFor="profile-avatar-upload"
            className="cursor-pointer rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-500"
          >
            {t("uploadAvatar")}

            <input
              id="profile-avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={loading}
              onChange={handleAvatarChange}
            />
          </label>

          <p className="text-center text-xs text-neutral-500">
            {t("avatarUploadHint")}
          </p>

          {avatarFile && (
            <p className="text-center text-xs text-neutral-600">
              {avatarFile.name}
            </p>
          )}
        </div>
      </section>

      <AuthError message={error} />

      <AuthSubmitButton loading={loading} loadingLabel={t("saving")}>
        {t("continue")}
      </AuthSubmitButton>
    </form>
  );
}

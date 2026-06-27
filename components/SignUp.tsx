"use client";

import { forwardRef, useState, FormEvent } from "react";

// TODO: FORMSPREE_ENDPOINT — to upgrade from mailto to a real form backend:
// 1. Create a free form at https://formspree.io
// 2. Replace FORMSPREE_ENDPOINT with your endpoint, e.g. "https://formspree.io/f/xxxxxx"
// 3. Change the form's action to FORMSPREE_ENDPOINT and method to POST
// 4. Remove the mailto fallback below
const FORMSPREE_ENDPOINT = ""; // leave empty to use mailto fallback

const SignUp = forwardRef<HTMLElement>(function SignUp(_, ref) {
  const [submitted, setSubmitted] = useState(false);
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!validate()) {
      e.preventDefault();
      return;
    }
    if (FORMSPREE_ENDPOINT) {
      // Let the native POST go through to Formspree
      return;
    }
    // Mailto fallback — open mail client with pre-filled subject and body
    e.preventDefault();
    const subject = encodeURIComponent("MedLingua pilot interest");
    const body = encodeURIComponent(
      `Hi MedLingua team,\n\nI'd like to join the pilot.\n\nOrg/clinic: ${org || "(not provided)"}\nEmail: ${email}`
    );
    window.location.href = `mailto:aravparikh712@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <section
      ref={ref}
      id="join"
      aria-labelledby="signup-heading"
      style={{
        backgroundColor: "var(--teal-tint)",
        padding: "5rem 1.25rem",
      }}
    >
      <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "center" }}>

        <p
          style={{
            fontFamily: "var(--font-heading, sans-serif)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--teal)",
            marginBottom: "0.75rem",
          }}
        >
          Pilot program
        </p>

        <h2
          id="signup-heading"
          style={{
            fontSize: "clamp(1.625rem, 3.5vw, 2.25rem)",
            marginBottom: "0.75rem",
          }}
        >
          Join the pilot.
        </h2>

        <p
          style={{
            color: "var(--grey)",
            fontSize: "1.0625rem",
            marginBottom: "2.25rem",
          }}
        >
          We&apos;re piloting with rural and high-LEP clinics first.
        </p>

        {submitted ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              backgroundColor: "var(--white)",
              borderRadius: "16px",
              padding: "2.5rem",
              boxShadow: "0 4px 24px rgba(15,61,56,0.08)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--teal)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
              aria-hidden="true"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>You&apos;re on the list!</h3>
            <p style={{ color: "var(--grey)", fontSize: "0.9375rem" }}>
              We&apos;ll be in touch as the pilot opens to new clinics. Thank you for your interest.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            action={FORMSPREE_ENDPOINT || undefined}
            method={FORMSPREE_ENDPOINT ? "POST" : undefined}
            noValidate
            style={{
              backgroundColor: "var(--white)",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 4px 24px rgba(15,61,56,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              textAlign: "left",
            }}
          >
            {/* Org field (optional) */}
            <div>
              <label
                htmlFor="org"
                style={{
                  display: "block",
                  fontFamily: "var(--font-heading, sans-serif)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "var(--ink)",
                  marginBottom: "0.375rem",
                }}
              >
                Clinic or organization{" "}
                <span style={{ color: "var(--grey)", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="org"
                name="org"
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. Riverside Community Clinic"
                style={{
                  width: "100%",
                  height: "48px",
                  backgroundColor: "var(--white)",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: "8px",
                  padding: "0 1rem",
                  fontSize: "1rem",
                  color: "var(--ink)",
                  outline: "none",
                  transition: "border-color 200ms ease-out, box-shadow 200ms ease-out",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--teal)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,157,143,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#D1D5DB";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Email field (required) */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontFamily: "var(--font-heading, sans-serif)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "var(--ink)",
                  marginBottom: "0.375rem",
                }}
              >
                Email address <span style={{ color: "#B91C1C" }} aria-label="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="you@yourclinic.org"
                aria-describedby={emailError ? "email-error" : undefined}
                aria-invalid={!!emailError}
                style={{
                  width: "100%",
                  height: "48px",
                  backgroundColor: "var(--white)",
                  border: `1.5px solid ${emailError ? "#B91C1C" : "#D1D5DB"}`,
                  borderRadius: "8px",
                  padding: "0 1rem",
                  fontSize: "1rem",
                  color: "var(--ink)",
                  outline: "none",
                  transition: "border-color 200ms ease-out, box-shadow 200ms ease-out",
                }}
                onFocus={(e) => {
                  if (!emailError) {
                    e.currentTarget.style.borderColor = "var(--teal)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,157,143,0.15)";
                  }
                }}
                onBlur={(e) => {
                  if (!emailError) {
                    e.currentTarget.style.borderColor = "#D1D5DB";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
              {emailError && (
                <p
                  id="email-error"
                  role="alert"
                  style={{
                    color: "#B91C1C",
                    fontSize: "0.875rem",
                    marginTop: "0.375rem",
                  }}
                >
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: "var(--teal)",
                color: "var(--white)",
                fontFamily: "var(--font-heading, sans-serif)",
                fontWeight: 600,
                fontSize: "1rem",
                padding: "0.875rem 2rem",
                borderRadius: "8px",
                minHeight: "52px",
                border: "none",
                cursor: "pointer",
                transition: "background-color 200ms ease-out, box-shadow 200ms ease-out",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--teal-dark)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(42,157,143,0.28)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--teal)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              Join the Pilot
            </button>

            <p style={{ color: "var(--grey)", fontSize: "0.8125rem", textAlign: "center" }}>
              No spam. We&apos;ll only contact you about pilot access.
            </p>
          </form>
        )}
      </div>
    </section>
  );
});

export default SignUp;

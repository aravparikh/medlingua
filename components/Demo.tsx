"use client";

import { forwardRef } from "react";

// TODO: VIDEO_SRC — replace the empty string below with your video URL or path
// e.g. "/medlingua-demo.mp4" or "https://cdn.example.com/medlingua-demo.mp4"
const VIDEO_SRC = "";

const Demo = forwardRef<HTMLElement>(function Demo(_, ref) {
  return (
    <section
      ref={ref}
      id="demo"
      aria-labelledby="demo-heading"
      style={{
        padding: "5rem 1.25rem",
        backgroundColor: "var(--paper)",
      }}
    >
      <div style={{ maxWidth: "52rem", margin: "0 auto", textAlign: "center" }}>

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
          Live demo
        </p>

        <h2
          id="demo-heading"
          style={{
            fontSize: "clamp(1.625rem, 3.5vw, 2.25rem)",
            marginBottom: "2.5rem",
          }}
        >
          See it run in 45 seconds.
        </h2>

        {/* Phone-bezel frame */}
        <div
          style={{
            position: "relative",
            maxWidth: "340px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--deep-teal)",
              borderRadius: "40px",
              padding: "14px 10px",
              boxShadow: "0 24px 64px rgba(15,61,56,0.22), 0 2px 8px rgba(15,61,56,0.12)",
            }}
          >
            {/* Notch */}
            <div
              style={{
                width: "80px",
                height: "8px",
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: "4px",
                margin: "0 auto 10px",
              }}
              aria-hidden="true"
            />

            {/* Video or placeholder */}
            <div
              style={{
                backgroundColor: "var(--ink)",
                borderRadius: "28px",
                overflow: "hidden",
                aspectRatio: "9/16",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {VIDEO_SRC ? (
                <video
                  src={VIDEO_SRC}
                  controls
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  aria-label="MedLingua live demo video"
                >
                  Your browser doesn&apos;t support HTML video.
                </video>
              ) : (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                  }}
                  role="img"
                  aria-label="Demo video coming soon"
                >
                  {/* Play icon */}
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      backgroundColor: "var(--teal)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1rem",
                    }}
                    aria-hidden="true"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p
                    style={{
                      color: "var(--paper)",
                      fontFamily: "var(--font-heading, sans-serif)",
                      fontWeight: 600,
                      fontSize: "1rem",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Demo video
                  </p>
                  <p style={{ color: "rgba(251,251,249,0.5)", fontSize: "0.875rem" }}>
                    Coming soon
                  </p>
                </div>
              )}
            </div>

            {/* Home bar */}
            <div
              style={{
                width: "100px",
                height: "5px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "3px",
                margin: "10px auto 0",
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <p
          style={{
            marginTop: "1.75rem",
            color: "var(--grey)",
            fontSize: "0.9375rem",
            fontStyle: "italic",
          }}
        >
          45 seconds — MedLingua running live.
        </p>
      </div>
    </section>
  );
});

export default Demo;

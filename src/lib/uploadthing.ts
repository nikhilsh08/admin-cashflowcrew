import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string;

const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, {
    ...init,
    credentials: "include",
  });
};

export const UploadButton = generateUploadButton({
  url: `${SERVER_URL}/api/uploadthing`, // Point directly to your Next.js backend
  fetch: customFetch
});

export const UploadDropzone = generateUploadDropzone({
  url: `${SERVER_URL}/api/uploadthing`,
  // fetch: customFetch
});

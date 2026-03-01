import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// interface FormatDateOptions {
//     year: 'numeric';
//     month: 'short';
//     day: 'numeric';
//   }

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).replace(',', '');
}


export const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString()}`;
};
export function convertToIST2(timestampMs: number): string {
  // Create a Date object from the timestamp (in milliseconds)
  const date = new Date(timestampMs);

  // Format the date in IST (Asia/Kolkata timezone)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  // Use Intl API to format
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

export function convertUTCToIST(isoString: string): { timestamp: number; ist: string } {
  // Parse the input ISO datetime
  const date = new Date(isoString);

  // Format options for IST in 12-hour format (AM/PM)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true, // 12-hour format
  };

  // Format the date into IST
  const istString = new Intl.DateTimeFormat('en-IN', options).format(date);

  // Get Unix timestamp (ms since epoch)
  const timestamp = date.getTime();

  return { timestamp, ist: istString };
}
export function convertUTCToIST2(isoString: string): string {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

export function convertToIST(timestampMs: number): string {
  // Create a Date object from the timestamp (in milliseconds)
  const date = new Date(timestampMs);

  // Format the date in IST (Asia/Kolkata timezone)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true, // ✅ Enable AM/PM format
  };

  // Use Intl API to format
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}
import type { Masterclass, User } from "@/hooks/__types";
import { formatDate } from "@/lib/utils";

export const generateCompletionEmailBootcamp = (user: User, masterclass: Masterclass[]) => {
  // console.log("Generating email for user:", user);
  const subject = encodeURIComponent(
    `Registration Confirmed - ${masterclass?.[0]?.title || "Masterclass"}`
  );

  const body = encodeURIComponent(`Dear ${user?.firstName} ${user?.lastName},
    
    Congratulations! Your registration for "${
      masterclass?.[0]?.title || "Masterclass"
    }" has been successfully confirmed.
    
    MASTERCLASS DETAILS:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    📚 Course: ${masterclass?.[0]?.title || "N/A"}
    👨‍🏫 Instructor: ${masterclass?.[0]?.instructor || "N/A"}
    📅 Date: ${
      masterclass?.[0]?.date ? formatDate(masterclass[0].date) : "TBD"
    } - 26 Oct 2025
    ⏰ Time: ${masterclass?.[0]?.start_time || "TBD"} - ${
    masterclass?.[0]?.end_time || "TBD"
  } (Breaks included)
    📍 Location: ${masterclass?.[0]?.location || "Online"}
    
    NEXT STEPS:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    1. MEETING ACCESS: 
       Get your unique registration link, and add to your calendar, using the links:
        • Personal Finance Bootcamp (Day One) -> https://live.zoho.in/erjt-lgj-sxw
        • Personal Finance Bootcamp (Day Two) -> https://live.zoho.in/baqv-blg-jct 
    
    2. PREPARATION:
       • Ensure stable internet connection
       • Keep a notepad ready for key insights
       • Prepare any questions you'd like to ask
    
    IMPORTANT REMINDERS:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    • Please join 10 minutes before the scheduled time
    • We recommend using a laptop/desktop for the best experience
    
    CONTACT INFORMATION:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    For any queries or technical support:
    📧 Email: ${masterclass?.[0]?.email || "support@cashflowcrew.in"}
    
    We're excited to have you join us for this transformative learning experience!
    
    Best regards,
    The CashFlow Crew Team
    
    ---
    This email was sent regarding your successful registration for our masterclass. If you have any concerns, please contact us immediately.
    
    CashFlow Crew | Building Financial Success Together
    Website: https://cashflowcrew.in`);

  return `https://mail.google.com/mail/u/4/?view=cm&to=${user?.email}&su=${subject}&body=${body}`;
};

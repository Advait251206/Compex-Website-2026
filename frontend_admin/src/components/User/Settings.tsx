import { UserProfile } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

export default function Settings() {
  return (
    <div className="settings-page-wrapper">
       <UserProfile 
          appearance={{
            baseTheme: dark,
            elements: {
                card: "glass-card-clerk",
                navbar: "hidden", // Simplify view
                navbarMobileMenuButton: "hidden",
                headerTitle: "text-white orbitron-font",
                headerSubtitle: "text-gray-400",
                profileSectionTitleText: "text-white orbitron-font",
                userPreviewMainIdentifier: "text-white",
                userPreviewSecondaryIdentifier: "text-gray-400",
                accordionTriggerButton: "text-white hover:bg-white/5",
                formFieldLabel: "text-gray-300",
                formFieldInput: "bg-white/5 border-white/10 text-white",
                formButtonReset: "text-white hover:bg-white/10",
                scrollBox: "clerk-scroll-override" 
            },
            variables: {
                colorPrimary: '#6366f1',
                colorBackground: 'transparent',
                colorText: 'white',
                colorInputBackground: 'rgba(255,255,255,0.05)',
                colorInputText: 'white',
            }
          }}
       />
    </div>
  );
}

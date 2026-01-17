// client/constants/InjectionSites.ts
export interface InjectionSite {
  id: string;
  name: string;
  anatomicalName: string;
  emoji: string;
  description: string;
  recommendedFor: string[];
  tips: string[];
}

export const INJECTION_SITES: InjectionSite[] = [
  {
    id: "finger",
    name: "Fingertip",
    anatomicalName: "Lateral finger pad",
    emoji: "👆",
    description: "Quick blood glucose testing",
    recommendedFor: ["glucose-testing", "lancet"],
    tips: [
      "Use sides of fingertips",
      "Rotate between fingers",
      "Warm hands first for better blood flow",
    ],
  },
  {
    id: "upper-arm",
    name: "Upper Arm",
    anatomicalName: "Deltoid muscle",
    emoji: "💪",
    description: "Vaccines and some medications",
    recommendedFor: ["vaccines", "b12", "testosterone"],
    tips: [
      "Relax arm completely",
      "Use outer upper arm area",
      "Good for intramuscular injections",
    ],
  },
  {
    id: "thigh",
    name: "Thigh",
    anatomicalName: "Vastus lateralis muscle",
    emoji: "🦵",
    description: "Large muscle area for various injections",
    recommendedFor: ["vaccines", "insulin", "hormones", "peptides"],
    tips: [
      "Use outer thigh area",
      "Sit down for stability",
      "Rotate between left and right",
    ],
  },
  {
    id: "abdomen",
    name: "Abdomen",
    anatomicalName: "Subcutaneous abdominal tissue",
    emoji: "🤰",
    description: "Insulin and subcutaneous medications",
    recommendedFor: ["insulin", "fertility-meds", "peptides"],
    tips: [
      "Stay 2 inches from navel",
      "Pinch skin gently",
      "Rotate around abdomen area",
    ],
  },
];

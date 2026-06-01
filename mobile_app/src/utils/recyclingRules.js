// Recycling rules mirroring the backend recycling_rules.py.
// Used to display guidance in the result card without an extra API call.

export const RECYCLING_RULES = {
  battery: {
    material: "Battery / hazardous electronic waste",
    bin_category: "Hazardous waste collection point",
    advice: "Do not throw batteries in regular trash. Take them to a battery collection box.",
  },
  biological: {
    material: "Organic biodegradable waste",
    bin_category: "Organic / compost bin",
    advice: "Dispose of it in organic waste or compost when possible.",
  },
  cardboard: {
    material: "Cardboard / paper fiber",
    bin_category: "Paper and cardboard recycling bin",
    advice: "Flatten cardboard before recycling.",
  },
  clothes: {
    material: "Textile material",
    bin_category: "Textile donation or textile recycling point",
    advice: "Donate usable clothes or take damaged textiles to a textile collection point.",
  },
  glass: {
    material: "Glass",
    bin_category: "Glass recycling bin",
    advice: "Recycle glass bottles and jars separately when possible.",
  },
  metal: {
    material: "Metal / aluminum / steel",
    bin_category: "Metal recycling bin",
    advice: "Rinse cans before recycling if possible.",
  },
  paper: {
    material: "Paper",
    bin_category: "Paper recycling bin",
    advice: "Keep paper clean and dry before recycling.",
  },
  plastic: {
    material: "Plastic packaging or synthetic polymer",
    bin_category: "Plastic recycling bin",
    advice: "Empty and clean plastic containers before recycling.",
  },
  shoes: {
    material: "Textile, rubber, leather or synthetic material",
    bin_category: "Textile/shoe donation or special collection point",
    advice: "Donate usable shoes or take them to a dedicated collection point.",
  },
  trash: {
    material: "Mixed or non-recyclable waste",
    bin_category: "General waste bin",
    advice: "If the item cannot be cleaned or separated, dispose of it as general waste.",
  },
};

export const CONFIDENCE_THRESHOLD = 0.70;

export const MOTOR_MODES = {
  pmsm: {
    short: "PMSM",
    name: "Permanent magnet synchronous motor",
    rotor: "Permanent magnets",
    penalty: "Magnet supply",
    explanation: "Magnets set the rotor field before the motor draws any current. The rotor can follow the stator field without electrical slip, which keeps rotor losses low.",
    slip: 0,
    baseLoss: { copper: 2.2, iron: 1.1, rotor: 0.25 },
    lossSlope: { copper: 3.5, iron: 2.0, rotor: 0.25 },
    color: "#f1a222"
  },
  eesm: {
    short: "Wound field",
    name: "Electrically excited synchronous motor",
    rotor: "Copper field coil",
    penalty: "Excitation loss",
    explanation: "A rotor coil creates the magnetic field. The drive can weaken or strengthen that field as conditions change, but it must deliver current across a rotating gap.",
    slip: 4,
    baseLoss: { copper: 2.5, iron: 1.2, rotor: 1.05 },
    lossSlope: { copper: 3.6, iron: 2.0, rotor: 2.4 },
    color: "#d56a88"
  },
  induction: {
    short: "Induction",
    name: "Induction motor",
    rotor: "Conductive cage",
    penalty: "Rotor heat",
    explanation: "The stator field induces current in a conductive rotor cage. A small speed difference is required to induce that current, so part of the input becomes heat in the rotor.",
    slip: 11,
    baseLoss: { copper: 2.6, iron: 1.3, rotor: 1.5 },
    lossSlope: { copper: 3.8, iron: 2.2, rotor: 3.4 },
    color: "#60a59b"
  },
  synrm: {
    short: "SynRM",
    name: "Synchronous reluctance motor",
    rotor: "Flux barriers",
    penalty: "Lower power factor",
    explanation: "The rotor contains shaped paths that magnetic flux prefers. It turns to align its easiest magnetic axis with the stator field, without magnets or rotor conductors.",
    slip: 6,
    baseLoss: { copper: 2.8, iron: 1.4, rotor: 0.2 },
    lossSlope: { copper: 4.4, iron: 2.1, rotor: 0.15 },
    color: "#7f91d2"
  },
  srm: {
    short: "SRM",
    name: "Switched reluctance motor",
    rotor: "Salient steel poles",
    penalty: "Noise and ripple",
    explanation: "The controller energises stator poles in sequence. The steel rotor is pulled toward the next low-reluctance position. The simple rotor is rugged, while torque ripple and sound need careful control.",
    slip: 16,
    baseLoss: { copper: 3.1, iron: 1.7, rotor: 0.15 },
    lossSlope: { copper: 4.8, iron: 2.7, rotor: 0.1 },
    color: "#e5874d"
  }
};

export const FIELD_OPTIONS = [
  {
    id: "eesm",
    short: "Wound field",
    name: "Electrically excited synchronous motor",
    status: "Mass production",
    maturity: 0.94,
    density: 0.72,
    magnetRoute: false,
    size: 37,
    principle: "Copper windings create the rotor field. Current replaces the permanent magnet.",
    gain: "Controllable rotor field, no rare-earth magnet, efficient coasting.",
    cost: "Rotor copper loss, excitation hardware and more thermal work.",
    evidence: "Renault has used wound-rotor motors since the Zoe. BMW uses current-excited motors across several current EVs.",
    companies: ["Renault", "BMW", "ZF", "MAHLE", "Valeo", "Volektra"],
    sourceLabel: "Renault and BMW official material",
    source: "https://www.renaultgroup.com/en/magazine/energy-and-motorization/all-about-electric-motors-with-no-rare-earths/"
  },
  {
    id: "induction",
    short: "Induction",
    name: "Induction motor",
    status: "Mass production",
    maturity: 0.98,
    density: 0.57,
    magnetRoute: false,
    size: 34,
    principle: "A rotating stator field induces current in a conductive rotor cage.",
    gain: "Mature manufacturing, no magnets or rotor contacts, strong high-speed operation.",
    cost: "Rotor heat and slip losses, especially away from its best operating region.",
    evidence: "Induction traction motors have decades of use. Tesla still pairs one with a rear permanent-magnet motor in all-wheel-drive Model 3 vehicles.",
    companies: ["Tesla", "Audi", "Mercedes-Benz"],
    sourceLabel: "Tesla Model 3 owner’s manual",
    source: "https://www.tesla.com/ownersmanual/model3/en_gb/GUID-E414862C-CFA1-4A0B-9548-BE21C32CAA58.html"
  },
  {
    id: "synrm",
    short: "SynRM",
    name: "Synchronous reluctance motor",
    status: "Industrial production",
    maturity: 0.82,
    density: 0.48,
    magnetRoute: false,
    size: 31,
    principle: "Flux barriers make one rotor axis easier to magnetise than the other.",
    gain: "A simple magnet-free rotor, low rotor loss and established industrial use.",
    cost: "Power-factor and torque-density limits, with harder traction packaging.",
    evidence: "ABB sells IE5 and IE6 SynRM motors from 5.5 to 400 kW. Automotive suppliers are still working on higher-density traction versions.",
    companies: ["ABB", "Chara", "Viridian"],
    sourceLabel: "ABB synchronous reluctance portfolio",
    source: "https://www.abb.com/global/en/areas/motion/motors-generators/low-voltage-motors/iec-low-voltage-motors/synchronous-reluctance-motors"
  },
  {
    id: "srm",
    short: "SRM",
    name: "Switched reluctance motor",
    status: "Development and niches",
    maturity: 0.55,
    density: 0.39,
    magnetRoute: false,
    size: 29,
    principle: "Sequentially energised stator poles pull a plain steel rotor into alignment.",
    gain: "Rugged rotor, no magnets, no rotor copper and tolerance of high temperature.",
    cost: "Torque ripple, acoustic noise and a demanding controller.",
    evidence: "The architecture is established in specialised uses. AEM publishes a high-power automotive development specification using aluminium windings.",
    companies: ["AEM", "Turntide"],
    sourceLabel: "AEM SSRD development page",
    source: "https://advancedelectricmachines.com/ssrd/"
  },
  {
    id: "ferrite",
    short: "Ferrite PM",
    name: "Ferrite permanent-magnet motor",
    status: "Niche production",
    maturity: 0.67,
    density: 0.46,
    magnetRoute: true,
    size: 32,
    principle: "Lower-strength iron-oxide magnets retain a permanent rotor field without rare earths.",
    gain: "Stable, abundant magnet material and the control simplicity of a permanent-magnet motor.",
    cost: "More magnet volume, more steel or a geometry that recovers lost flux.",
    evidence: "Ferrite motors are familiar at lower power. Conifer is scaling axial-flux variants below 30 kW for mobility and industrial use.",
    companies: ["Conifer", "Proterial", "Matel"],
    sourceLabel: "Conifer product and capacity data",
    source: "https://conifer.io/"
  },
  {
    id: "iron-nitride",
    short: "Fe16N2",
    name: "Iron nitride permanent magnet",
    status: "Scale-up",
    maturity: 0.34,
    density: 0.82,
    magnetRoute: true,
    size: 38,
    principle: "An iron and nitrogen magnet aims to retain strong permanent-magnet performance without rare earths.",
    gain: "Potential drop-in magnet route with abundant feedstocks and no rotor excitation.",
    cost: "Manufacturing scale, consistency, temperature behaviour and automotive qualification remain open.",
    evidence: "Niron is advancing a first full-scale plant and has announced a larger high-volume site. Motor-scale production evidence is still limited.",
    companies: ["Niron", "Matter Motor Works"],
    sourceLabel: "Niron manufacturing update",
    source: "https://www.nironmagnetics.com/news/niron-magnetics-and-city-of-sartell-advance-next-phase-of-rare-earth-free-permanent-magnet-manufacturing-project"
  },
  {
    id: "ferrite-axial",
    short: "Ferrite axial",
    name: "Ferrite axial-flux motor",
    status: "Pilot and niche",
    maturity: 0.51,
    density: 0.63,
    magnetRoute: true,
    size: 35,
    principle: "A disc-shaped flux path gives weaker ferrite magnets more working area.",
    gain: "Short axial package, modular discs and a rare-earth-free permanent field.",
    cost: "Thermal paths, air-gap tolerances and volume manufacturing are demanding.",
    evidence: "Several companies publish prototypes and small production programmes. The geometry itself does not guarantee a rare-earth-free motor.",
    companies: ["Conifer", "Gati", "EKMO"],
    sourceLabel: "Conifer technology overview",
    source: "https://conifer.io/"
  }
];

export const DECISION_MOTORS = [
  {
    id: "pmsm",
    name: "Rare-earth PMSM",
    scores: { supply: 2, density: 10, efficiency: 9.5, maturity: 10, noise: 9 },
    fit: { city: 1.05, performance: 1.12, truck: .95, industrial: .8 }
  },
  {
    id: "eesm",
    name: "Wound field",
    scores: { supply: 9, density: 8, efficiency: 8.4, maturity: 9, noise: 8.5 },
    fit: { city: 1.02, performance: 1.02, truck: 1.1, industrial: .95 }
  },
  {
    id: "induction",
    name: "Induction",
    scores: { supply: 9.5, density: 6.7, efficiency: 7.6, maturity: 10, noise: 8 },
    fit: { city: .92, performance: 1.08, truck: 1.04, industrial: 1.1 }
  },
  {
    id: "synrm",
    name: "Synchronous reluctance",
    scores: { supply: 10, density: 5.8, efficiency: 8, maturity: 7.5, noise: 7 },
    fit: { city: .93, performance: .82, truck: .94, industrial: 1.2 }
  },
  {
    id: "srm",
    name: "Switched reluctance",
    scores: { supply: 10, density: 6.5, efficiency: 7.4, maturity: 5.8, noise: 3.5 },
    fit: { city: .86, performance: .88, truck: 1.08, industrial: 1.02 }
  },
  {
    id: "ferrite",
    name: "Ferrite permanent magnet",
    scores: { supply: 8.7, density: 5.6, efficiency: 8.2, maturity: 6.6, noise: 8.8 },
    fit: { city: 1.08, performance: .8, truck: .82, industrial: 1.02 }
  },
  {
    id: "iron-nitride",
    name: "Iron nitride magnet",
    scores: { supply: 9, density: 9, efficiency: 9, maturity: 3.2, noise: 9 },
    fit: { city: 1.03, performance: 1.07, truck: .98, industrial: .9 }
  }
];

export const APPLICATION_PRESETS = {
  city: {
    label: "city car",
    weights: { supply: 8, density: 7, efficiency: 8, maturity: 9, noise: 7 },
    reading: "Frequent starts reward broad low-speed efficiency and quiet control. Package size still matters, while sustained high-speed power matters less."
  },
  performance: {
    label: "performance EV",
    weights: { supply: 5, density: 10, efficiency: 7, maturity: 8, noise: 6 },
    reading: "Peak torque, cooling and a small package carry more weight. Supply resilience remains relevant, but it no longer controls the result."
  },
  truck: {
    label: "heavy truck",
    weights: { supply: 8, density: 6, efficiency: 10, maturity: 9, noise: 5 },
    reading: "Sustained torque and heat rejection matter more than a brief peak. Continuous efficiency changes the cooling system as well as energy use."
  },
  industrial: {
    label: "industrial drive",
    weights: { supply: 9, density: 3, efficiency: 10, maturity: 10, noise: 5 },
    reading: "A fixed operating envelope gives efficient reluctance and induction machines room to work. Compactness is often less decisive than service life."
  }
};

export const DRIVE_CYCLES = {
  city: {
    label: "City",
    speed: [0, 18, 42, 21, 0, 54, 33, 12, 47, 0, 26],
    grade: [0, 1, 0, -1, 0, 1, 2, 0, -1, 0, 0],
    interpretation: "Frequent low-speed starts favour a motor and inverter that stay efficient away from their peak point."
  },
  highway: {
    label: "Highway",
    speed: [62, 74, 86, 94, 101, 96, 108, 99, 92, 84, 78],
    grade: [0, 0, 1, 1, 0, -1, 0, 2, 0, -1, 0],
    interpretation: "Steady high speed raises iron and windage losses. Field weakening and a broad efficient speed range matter here."
  },
  grade: {
    label: "Long grade",
    speed: [38, 42, 46, 49, 52, 54, 55, 56, 57, 58, 58],
    grade: [2, 3, 4, 5, 6, 7, 7, 8, 8, 7, 6],
    interpretation: "Continuous climbing exposes rotor and copper heat. A short peak rating says little about this part of the trip."
  }
};

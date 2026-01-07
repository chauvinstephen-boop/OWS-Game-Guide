// -----------------------------
// Data model – core steps
// -----------------------------

/**
 * actor:
 *  - "both"          → both players coordinate
 *  - "initiative"    → initiative player acts
 *  - "non-initiative"→ non-initiative player acts
 *  - "alt"           → alternate: initiative then non-initiative
 *
 * requires: (New property)
 *  - list of asset types needed for this step to be relevant.
 *  - If empty or undefined, step is always relevant.
 *  - Asset types: "naval", "air", "ground", "sam", "sof", "cyber"
 */

const BASE_SEQUENCE = [
  {
    id: "phase1",
    number: 1,
    name: "Planning & Readiness Decisions",
    modes: ["full"],
    description:
      "Players plan intentions, set priorities, and adjust readiness for the coming turn.",
    steps: [
      {
        id: "1-1",
        code: "1.1",
        title: "Commander’s intent and planning",
        actor: "both",
        modes: ["full"],
        requires: [],
        description:
          "Each side frames their intent, priorities, and desired end state for this turn.",
        actions: {
          full: [
            "Both players briefly state their overall intent for the turn (focus areas, end state).",
            "Both players note any critical decisions or risk points they want to explore this turn."
          ]
        },
        rulesRef: [
          "Planning can be informal or formal; level of detail is scenario dependent.",
          "You may write down orders to support later assessment."
        ]
      },
      {
        id: "1-2",
        code: "1.2",
        title: "Decision cards & readiness",
        actor: "both",
        modes: ["full"],
        requires: [],
        description:
          "Players play any Decision Cards that alter readiness, mobilization, or special conditions.",
        actions: {
          full: [
            "Initiative player chooses whether to play any Planning-phase Decision Cards and applies effects.",
            "Non-initiative player then chooses and applies their Planning-phase Decision Cards."
          ]
        },
        rulesRef: [
          "Some Decision Cards adjust readiness timers or activate formations.",
          "Cards may specify in which phase they are playable."
        ]
      }
    ]
  },
  {
    id: "phase2",
    number: 2,
    name: "Strategic Movement",
    modes: ["full"],
    description:
      "Move forces by rail, airlift, sealift, and road at theater scale and mark RSO&I.",
    steps: [
      {
        id: "2-1",
        code: "2.1",
        title: "Strategic embarkation and movement",
        actor: "alt",
        modes: ["full"],
        requires: ["naval", "ground"],
        description:
          "Players move formations via rail, airlift, sealift, and road, then mark RSO&I.",
        actions: {
          full: [
            "Initiative player: embark designated units onto ships, transports, and rail, then move them using strategic movement allowances.",
            "Non-initiative player: do the same for their forces.",
            "Both players mark transported ground units and carriers with RSO&I as required."
          ]
        },
        rulesRef: [
          "RSO&I units fight at reduced effectiveness until their marker is removed in Regeneration.",
          "Movement capacity (rail, sealift, airlift) is governed by scenario rules."
        ]
      },
      {
        id: "2-2",
        code: "2.2",
        title: "Security zones & partisans (optional)",
        actor: "both",
        modes: ["full"],
        requires: ["ground", "sof"],
        description:
          "If using advanced rules, create Security Zones and Partisan/Diversant efforts.",
        actions: {
          full: [
            "Both players secretly determine any Security Zones or Partisan zones they will activate.",
            "Reveal and place Security Zone and Partisan markers according to scenario rules."
          ]
        },
        rulesRef: [
          "Security Zones consume combat power but protect rear areas.",
          "Partisan zones impose movement and supply penalties and may conduct attacks later."
        ]
      }
    ]
  },
  {
    id: "phase3",
    number: 3,
    name: "Tactical Movement",
    modes: ["full", "a2a", "a2a-ground"],
    description:
      "Move naval forces, assign air missions, and employ SOF at operational/tactical scale.",
    steps: [
      {
        id: "3A-1",
        code: "3.A",
        title: "Naval movement (if used)",
        actor: "alt",
        modes: ["full"],
        requires: ["naval"],
        description:
          "Players move surface ships and submarines; initiative side chooses who moves first.",
        actions: {
          full: [
            "Initiative player decides: Blue or Red moves naval units first this phase.",
            "Chosen side moves all desired surface ships and submarines within movement limits.",
            "Opposing side then moves their naval forces."
          ]
        },
        rulesRef: [
          "Submarines can choose Silent Running or cavitating movement, changing detection chances.",
          "Moving through enemy-occupied hexes can trigger later combat."
        ]
      },
      {
        id: "3B-1",
        code: "3.B.1",
        title: "Determine & place air missions (CAP/OCA/DCA/Strike)",
        actor: "alt",
        modes: ["full", "a2a", "a2a-ground"],
        requires: ["air"],
        description:
          "Assign squadrons to air missions and place them on the map within combat radius and fuel constraints.",
        actions: {
          full: [
            "Initiative player assigns missions for all available squadrons (CAP/OCA/DCA/Strike/SEAD/CAS/ASW/AEW/Tanker) and places them on the map within combat radius and fuel-source limits.",
            "Non-initiative player then assigns and places their air missions.",
            "Both ensure each air mission can trace to a valid fuel source (airfield, carrier, tanker, FARP)."
          ],
          a2a: [
            "Initiative player assigns fighters to CAP/OCA/DCA and places them on the map within their combat radius.",
            "Non-initiative player assigns their fighters similarly.",
            "Ignore non-A2A missions in this mode unless needed as targets or escorts."
          ],
          "a2a-ground": [
            "Initiative player assigns fighters to CAP/OCA/DCA and any strike missions needed for ground stations (airfields, SAM sites).",
            "Non-initiative player assigns their fighters and any air defense-related missions.",
            "Ensure AEW and Patriot/SAM coverage is set for the air battle around key ground stations."
          ]
        },
        rulesRef: [
          "Missions must trace to a fuel source; extended operations require tanker/FARP support.",
          "Only fighters with attack range 1 can engage into adjacent hexes, usually with sensor support."
        ]
      },
      {
        id: "3B-2",
        code: "3.B.2",
        title: "Build strike packages (if using strikes)",
        actor: "both",
        modes: ["full", "a2a-ground"],
        requires: ["air"],
        description:
          "Combine strike aircraft, SEAD, escorts, and tankers into packages; load munitions where applicable.",
        actions: {
          full: [
            "Both players form strike packages, grouping Strike/SEAD aircraft, escorts, AEW, and tankers as needed.",
            "Load stand-off munitions onto fighters or bombers as allowed by scenario and co-location with munitions.",
            "Place packages in holding hexes; targets and launch baskets can be finalized later in the Strike Phase."
          ],
          "a2a-ground": [
            "Both players create any strike packages needed to attack or defend ground stations (airfields, SAMs, radars).",
            "Load stand-off munitions (e.g., JASSM-ER) where allowed and co-located.",
            "Keep packages in holding areas within combat radius and fuel constraints."
          ]
        },
        rulesRef: [
          "Fighters in attack missions use a demoted die in A2A and can only defend if engaged.",
          "Bombers can carry multiple strike salvos; fighters typically carry up to two."
        ]
      },
      {
        id: "3C-1",
        code: "3.C",
        title: "SOF employment (if used)",
        actor: "both",
        modes: ["full"],
        requires: ["sof"],
        description:
          "Place SOF counters into target hexes for reconnaissance, target acquisition, direct action, or support.",
        actions: {
          full: [
            "Both players place SOF missions in chosen hexes, noting intended roles (SR, target acquisition, direct action, support).",
            "Immediately roll for insertion vs local detection where required; failed insertions go to Regeneration."
          ]
        },
        rulesRef: [
          "SOF SR can promote detection and later strikes against the same target.",
          "Compromise checks can remove SOF missions even after successful insertion."
        ]
      }
    ]
  },
  {
    id: "phase4",
    number: 4,
    name: "IO / Cyber / Space",
    modes: ["full"],
    description:
      "Apply information, cyber, and space effects that shape C2, ISR, and strikes.",
    steps: [
      {
        id: "4-1",
        code: "4.1",
        title: "Place IO tokens & cyber attacks",
        actor: "both",
        modes: ["full"],
        requires: ["cyber"],
        description:
          "Players secretly assign IO tokens and Cyber Cards, then reveal and adjudicate.",
        actions: {
          full: [
            "Both players secretly choose where to place IO tokens (Disrupt C2, Assure C2, SIGINT/EMSO, Active/Passive Countermeasures) and any Cyber Cards.",
            "Reveal tokens and cards, then apply their effects to units and functions per card/token text."
          ]
        },
        rulesRef: [
          "Disrupt C2 can prevent HQs, missiles, or space functions from operating if not blocked.",
          "Assure C2 and Active/Passive CM provide defensive layers that must be defeated first."
        ]
      },
      {
        id: "4-2",
        code: "4.2",
        title: "Adjudicate cyber & update space dashboard",
        actor: "both",
        modes: ["full"],
        requires: ["cyber"],
        description:
          "Resolve cyber outcomes and adjust C2, PNT, and ISR tracks and pawns.",
        actions: {
          full: [
            "Resolve each Cyber Card’s effect and note any required recovery rolls in later turns.",
            "Adjust the C2 track (long-range strike allocations), PNT status, and ISR track and pawn count.",
            "Ensure both players understand how many long-range strikes they will have in Combat Phase."
          ]
        },
        rulesRef: [
          "C2 track value equals the number of long-range strike actions available.",
          "Disrupted PNT demotes long-range strikes beyond 1 hex; ISR track controls detection die and number of ISR pawns."
        ]
      }
    ]
  },
  {
    id: "phase5",
    number: 5,
    name: "Theater ISR & Local Detections",
    modes: ["full", "a2a", "a2a-ground"],
    description:
      "Detect enemy forces using theater ISR and local sensors; finalize strike plans.",
    steps: [
      {
        id: "5-1",
        code: "5.1",
        title: "Place & resolve theater ISR",
        actor: "both",
        modes: ["full"],
        requires: ["cyber", "air", "naval", "ground"],
        description:
          "Players place ISR pawns and roll detection attempts against target hexes.",
        actions: {
          full: [
            "Both players place their ISR pawns on nominated hexes.",
            "One player at a time, roll the appropriate ISR die vs target signatures and mark detected units (TACSIT 1 or flipped).",
            "Mark fixed installations as detected without rolling."
          ]
        },
        rulesRef: [
          "ISR die type and number of pawns come from the space dashboard.",
          "Fixed ports and airfields are always targetable."
        ]
      },
      {
        id: "5-2",
        code: "5.2",
        title: "Resolve local detections (air focus)",
        actor: "both",
        modes: ["full", "a2a", "a2a-ground"],
        requires: ["air", "sam", "naval"],
        description:
          "Use AEW, fighter radars, SAMs, and other local sensors to detect air units and key platforms.",
        actions: {
          full: [
            "Both players, by hex, resolve AEW detections of 5th-gen aircraft and any contested ISR situations.",
            "Resolve local detections from fighters, SAM radars, ships, and ASW assets vs eligible targets.",
            "Mark stealth aircraft as detected only on successful local detection rolls."
          ],
          a2a: [
            "Both players resolve AEW and fighter-based local detections of enemy fighters (especially 5th-gen).",
            "Flip detected stealth fighters to their known side; leave undetected ones on their EMCON/Unknown side."
          ],
          "a2a-ground": [
            "Both players resolve AEW and fighter local detections of enemy fighters and any HVAA (AEW, tankers).",
            "Resolve Patriot/SAM local detection attempts against unknown aircraft entering their umbrella."
          ]
        },
        rulesRef: [
          "Local detection is required for low-signature units; stealth aircraft are capped at d12 detection.",
          "Cooperative sensing promotes detection dice but cannot exceed d12 for stealth or ASW."
        ]
      },
      {
        id: "5-3",
        code: "5.3",
        title: "Finalize strike plans (if using strikes)",
        actor: "both",
        modes: ["full", "a2a-ground"],
        requires: ["air", "sam", "naval"],
        description:
          "Players confirm which detected targets they will prioritize in the Strike Phase.",
        actions: {
          full: [
            "Both players review detected targets and decide which hexes they will nominate for long-range and local strikes.",
            "Ensure planned long-range strikes do not exceed your C2 strike allocation.",
            "Note any SEAD priorities and expected sequencing in the upcoming Combat Phase."
          ],
          "a2a-ground": [
            "Both players choose which detected airfields, SAM sites, or other ground stations are priority strike targets.",
            "Confirm which strike packages will be used against which targets in the upcoming Strike Warfare step."
          ]
        },
        rulesRef: [
          "Missiles cannot be fired at undetected mobile targets.",
          "This is the planning step; strikes are not yet rolled."
        ]
      }
    ]
  },
  {
    id: "phase6",
    number: 6,
    name: "Combat",
    modes: ["full", "a2a", "a2a-ground"],
    description:
      "Resolve air combat, strike warfare (if used), and ground combat (full mode).",
    steps: [
      {
        id: "6A-1",
        code: "6.A.1",
        title: "Air combat – stand-off A2A",
        actor: "alt",
        modes: ["full", "a2a", "a2a-ground"],
        requires: ["air"],
        description:
          "Resolve all long-range (range 1) air-to-air missile engagements by hex.",
        actions: {
          full: [
            "Initiative player chooses the first hex to adjudicate stand-off A2A combat.",
            "In that hex, both players declare long-range A2A shots (range 1 fighters) and roll per matchups.",
            "Repeat for each hex where stand-off A2A is possible."
          ],
          a2a: [
            "Starting with a hex chosen by the initiative player, both players declare long-range A2A engagements.",
            "Roll and remove destroyed missions to the Regeneration Box as appropriate.",
            "Continue across all hexes with possible stand-off A2A."
          ],
          "a2a-ground": [
            "Adjudicate stand-off A2A first in hexes where fighters are protecting or attacking ground stations.",
            "Then resolve remaining hexes with stand-off A2A engagements."
          ]
        },
        rulesRef: [
          "Fighters with attack range 1 may engage adjacent hexes if supported by sufficient sensing.",
          "Stealth fighters may lose EMCON/low observability when firing into adjacent hexes depending on support."
        ]
      },
      {
        id: "6A-2",
        code: "6.A.2",
        title: "Air combat – SEAD & long-range air defense",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["air", "sam"],
        description:
          "Resolve stand-off SEAD strikes and long-range ship/ground-based air defense vs aircraft.",
        actions: {
          full: [
            "Initiative player selects a hex with SEAD vs SAM or long-range air defense interactions.",
            "Both players resolve SEAD vs emitting SAMs and long-range SAM shots vs aircraft within range.",
            "Repeat for each hex where SEAD or long-range SAM engagements are in play."
          ],
          "a2a-ground": [
            "Initiative player selects key hexes around ground stations with SEAD and SAM interactions.",
            "Resolve SEAD vs Patriot/S-400/HQ-9 and any long-range SAM engagements vs detected aircraft.",
            "Update which SAMs are suppressed or out of missiles for the rest of the turn."
          ]
        },
        rulesRef: [
          "SEAD at true stand-off may strike without entering SAM engagement range.",
          "Grey SAM shields must be defeated before enduring red shield defenses."
        ]
      },
      {
        id: "6A-3",
        code: "6.A.3",
        title: "Air combat – in-hex A2A & air defense engagements",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["air", "sam"],
        description:
          "Resolve in-hex fighter vs fighter combat and then remaining in-hex air defense vs aircraft.",
        actions: {
          full: [
            "For each hex, starting with initiative player’s choice, both players pair fighters (CAP/OCA/DCA) and resolve in-hex A2A.",
            "After fighter combat, resolve any remaining in-hex air defense shots (Patriot, ship SAMs) vs surviving aircraft.",
            "Remove destroyed air missions to the Regeneration Box."
          ],
          a2a: [
            "Hex by hex, initiative player chooses order: pair surviving fighters for in-hex A2A and roll simultaneous attacks.",
            "If using Best Die optional rule, resolve from highest A2A die to lowest.",
            "Record survivors and mark contested or uncontested airspace as needed."
          ],
          "a2a-ground": [
            "Prioritize hexes where fighters are protecting or attacking ground stations.",
            "Resolve in-hex A2A and then Patriot/SAM in-hex engagements vs aircraft attempting to overfly or strike those stations."
          ]
        },
        rulesRef: [
          "Excess CAP can engage HVAA (AEW, tankers) or attack missions within range.",
          "Attack-mission fighters defend with a demoted die and cannot initiate A2A."
        ]
      },
      {
        id: "6B-1",
        code: "6.B.1",
        title: "Strike warfare – long-range strikes",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["air", "sam", "naval"],
        description:
          "By initiative and using C2 allocations, conduct long-range missile and air strikes by hex.",
        actions: {
          full: [
            "Using the strike allocations from the C2 track, initiative player declares a target hex and all long-range strikes into it (Many-to-One).",
            "Defender declares air defense shot allocation (grey shields, CAP vs missiles) before any dice are rolled.",
            "Resolve missile and bomber strikes, then alternate strike actions per chosen sequence method until all long-range strike chits are used."
          ],
          "a2a-ground": [
            "Initiative player uses long-range strikes primarily to attack or defend ground stations (airfields, SAMs, radars).",
            "Defender allocates Patriots and fighter CAP to intercept missile or cruise salvos where permitted.",
            "Alternate strike actions until both sides have exhausted their long-range strike allocations."
          ]
        },
        rulesRef: [
          "One long-range strike action covers all long-range salvos into a single target hex.",
          "Missiles cannot target undetected mobile units; infrastructure and ASPs may be targeted if known."
        ]
      },
      {
        id: "6B-2",
        code: "6.B.2",
        title: "Strike warfare – local strikes",
        actor: "both",
        modes: ["full", "a2a-ground"],
        requires: ["air", "ground", "naval"],
        description:
          "Adjudicate remaining local strikes (within a hex or local kill chain) after long-range actions.",
        actions: {
          full: [
            "By initiative, by hex, resolve any residual local strikes that did not consume C2 allocations.",
            "Include artillery fires, short-range air strikes, and naval gunfire within the same hex or local kill chain.",
            "Apply Fires Effects Table for strikes vs ground units and mark step losses and suppression."
          ],
          "a2a-ground": [
            "Resolve local air strikes vs ground stations that are within the attacker’s hex or local radius.",
            "Use the Fires Effects Table to determine step losses or suppression on airfields and SAM batteries."
          ]
        },
        rulesRef: [
          "Local strikes are resolved after long-range ones to reflect kill chain timing.",
          "Ground Fires Effects Table determines hits vs suppression by terrain and unit type."
        ]
      },
      {
        id: "6C-1",
        code: "6.C.1",
        title: "Ground – organize & initiative (full game only)",
        actor: "both",
        modes: ["full"],
        requires: ["ground"],
        description:
          "Set reserves, Main Effort, and determine the sequence for ground formation activations.",
        actions: {
          full: [
            "Both players assign reserves and Main Effort designations for divisions/corps per HQ rules.",
            "Determine the ground initiative method (by side, by formation I-go-U-go, or random chit draw).",
            "Lay out formation chits or order list so both players can follow activation sequence."
          ]
        },
        rulesRef: [
          "Reserve units move at half rate and normally only fight when activated in exploitation or if attacked.",
          "Main Effort contributes to supporting-arms modifiers on the Ground Combat Adjudication Table (GCAT)."
        ]
      },
      {
        id: "6C-2",
        code: "6.C.2",
        title: "Ground – movement, fires, and combat (full game only)",
        actor: "alt",
        modes: ["full"],
        requires: ["ground"],
        description:
          "Activate formations in sequence to conduct prep fires, movement, ground combat, and exploitation.",
        actions: {
          full: [
            "Per initiative method, activate one formation: conduct prep fires, then move units and declare combats.",
            "Allocate supporting artillery and CAS, resolve defensive fires, and then resolve ground combat using GCAT.",
            "If results allow exploitation, commit reserves and conduct exploitation movement and combat.",
            "Repeat for each formation until all ground actions are complete."
          ]
        },
        rulesRef: [
          "Hexside limits (steps per hexside) and supporting arms determine odds and modifiers.",
          "Suppression, delay, and fortified status significantly affect GCAT outcomes."
        ]
      }
    ]
  },
  {
    id: "phase7",
    number: 7,
    name: "Regeneration & Logistics",
    modes: ["full", "a2a", "a2a-ground"],
    description:
      "Reset IO, check supply, repair, regenerate missions, and resupply critical munitions.",
    steps: [
      {
        id: "7-1",
        code: "7.1",
        title: "Supply check & IO reset",
        actor: "both",
        modes: ["full"],
        requires: [],
        description:
          "Trace supply to combat units and reset offensive IO/Cyber for next turn.",
        actions: {
          full: [
            "Both players trace supply from combat units back to supply sources, marking extended or out-of-supply states.",
            "Remove offensive IO/Cyber markers; leave applicable defensive markers in place.",
            "Apply supply effects to ground units for the next turn’s GCAT modifiers."
          ]
        },
        rulesRef: [
          "Out-of-supply units move less and receive penalties on the GCAT.",
          "Some cyber effects require recovery rolls rather than automatic reset."
        ]
      },
      {
        id: "7-2",
        code: "7.2",
        title: "Reset aviation & status markers",
        actor: "both",
        modes: ["full", "a2a", "a2a-ground"],
        requires: ["air", "naval", "sam"],
        description:
          "Return air missions to bases/carriers or leave some in place, and clear status markers.",
        actions: {
          full: [
            "Both players return air missions to their airfields or carriers (unless scenario allows leaving CAP/Interdiction in place).",
            "Remove RSO&I, suppression, TACSIT, amphibious/airborne assault markers as required.",
            "Advance any readiness or RSO&I timers and adjust carrier air mission capacity based on damage."
          ],
          a2a: [
            "Both players reset surviving air missions to their airbases or allowed CAP hexes for next turn.",
            "Remove suppression and TACSIT markers relevant to this turn’s air battles."
          ],
          "a2a-ground": [
            "Both players reset surviving air missions and ensure airfields and SAMs are updated with any damage or repairs from strikes.",
            "Remove status markers that expire at the end of the turn."
          ]
        },
        rulesRef: [
          "Carrier damage reduces the number of aviation missions it can generate.",
          "Scenario rules may allow leaving some air missions in place to speed play."
        ]
      },
      {
        id: "7-3",
        code: "7.3",
        title: "Repair, regenerate, and resupply",
        actor: "both",
        modes: ["full", "a2a", "a2a-ground"],
        requires: [],
        description:
          "Roll for infrastructure repair, regenerate air/SOF missions, and resupply missiles.",
        actions: {
          full: [
            "Both players roll for port, airfield, and rail repair (with engineer modifiers where present).",
            "Roll to regenerate SOF and air missions from the Regeneration Box according to scenario probabilities.",
            "Resupply missile and SAM salvos that are auto-resupplied or have access to ASP counters per scenario rules.",
            "Advance the turn marker and update any weather or reinforcement tracks."
          ],
          a2a: [
            "Both players roll to regenerate destroyed air missions out of the Regeneration Box using scenario probabilities.",
            "Reset missile counts and SAM salvos if the scenario treats them as auto-resupplied for A2A tutorials."
          ],
          "a2a-ground": [
            "Both players roll to regenerate destroyed air missions.",
            "Update Patriot/SAM missile availability and any critical stand-off munitions per scenario rules."
          ]
        },
        rulesRef: [
          "Markers with resupply symbols refresh each turn; others require ASP or explicit scenario rules.",
          "Regenerated missions may have a delay before they re-enter play depending on scenario."
        ]
      }
    ]
  },
  {
    id: "phase8",
    number: 8,
    name: "Assessment",
    modes: ["full", "a2a", "a2a-ground"],
    description:
      "Reflect on the turn’s outcomes, decisions, and learning points.",
    steps: [
      {
        id: "8-1",
        code: "8.1",
        title: "Assessment and discussion",
        actor: "both",
        modes: ["full", "a2a", "a2a-ground"],
        requires: [],
        description:
          "Pause to discuss key insights, risks, and alternative courses of action.",
        actions: {
          full: [
            "Both players briefly recap what worked, what failed, and any key decision points.",
            "Note any rule questions or house-rule issues to refine before the next session."
          ],
          a2a: [
            "Both players discuss detection, sequencing of stand-off vs in-hex A2A, and how initiative shaped the air fight.",
            "Capture any tactics or rule clarifications for future A2A sessions."
          ],
          "a2a-ground": [
            "Discuss tradeoffs between using fighters for pure A2A vs protecting/attacking ground stations.",
            "Note how Patriot/SAM + AEW influenced air risk and strike outcomes."
          ]
        },
        rulesRef: [
          "Assessment is optional but strongly recommended for educational play.",
          "Use insights to adjust doctrine, planning approaches, or future scenario variants."
        ]
      }
    ]
  }
];

// -----------------------------
// Mode filtering
// -----------------------------

function buildSequenceForMode(inventory) {
  // Combine all assets from blue and red to see what is "in play"
  const allAssets = new Set([...inventory.blue, ...inventory.red]);

  const phases = [];
  BASE_SEQUENCE.forEach((phase) => {
    // Check if phase is relevant? (Currently phase doesn't have "requires" tag, only steps do)
    // We will include phase if it has at least one valid step.

    const validSteps = (phase.steps || []).filter((s) => {
       // If no requirements, keep it
       if (!s.requires || s.requires.length === 0) return true;
       // If it requires X, checking if ANY of the required assets exist in the game
       // OR logic: If a step requires "naval", we need at least one player to have "naval".
       // Actually, usually it implies "if this asset exists in the game".
       // Let's assume OR logic for the list of requirements?
       // No, usually "requires: ['naval']" means it's a naval step.
       // "requires: ['naval', 'air']" might mean it involves both?
       // Let's stick to: if the step requires ANY of the types present in 'allAssets', include it.
       // Wait, if a step requires "naval", and no one has naval, skip it.
       // If a step requires "naval" AND "air", and we have only "air", do we keep it?
       // Probably yes if it's "Naval OR Air".
       // Let's assume the tags in 'requires' are "one of these types makes this step relevant".

       return s.requires.some(r => allAssets.has(r));
    });

    if (validSteps.length > 0) {
      phases.push({
        ...phase,
        steps: validSteps
      });
    }
  });
  return phases;
}

// -----------------------------
// State
// -----------------------------

let inventory = {
  blue: [],
  red: []
};
let blueName = "Blue";
let redName = "Red";
let initiativeSide = "blue"; // "blue" or "red"

let SEQUENCE = []; // current mode sequence
let FLAT_STEPS = []; // flattened steps for navigation

let currentPhaseIndex = 0;
let currentStepIndex = 0;
let diceHistory = [];

// -----------------------------
// Helpers
// -----------------------------

function rebuildFlatSteps() {
  const arr = [];
  SEQUENCE.forEach((phase, pIndex) => {
    phase.steps.forEach((step, sIndex) => {
      arr.push({
        phaseIndex: pIndex,
        stepIndex: sIndex,
        phase,
        step
      });
    });
  });
  FLAT_STEPS = arr;
}

function storageKeyForStep(stepId) {
  // Use a generic key or based on inventory hash? simplified for now
  return `ows_step_reminders_dynamic_${stepId}`;
}

function loadReminders(stepId) {
  try {
    const raw = window.localStorage.getItem(storageKeyForStep(stepId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReminders(stepId, reminders) {
  try {
    window.localStorage.setItem(
      storageKeyForStep(stepId),
      JSON.stringify(reminders.slice(0, 3))
    );
  } catch {
    // ignore
  }
}

function currentFlatIndex() {
  let counter = 0;
  for (let p = 0; p < SEQUENCE.length; p++) {
    for (let s = 0; s < SEQUENCE[p].steps.length; s++) {
      if (p === currentPhaseIndex && s === currentStepIndex) {
        return counter;
      }
      counter++;
    }
  }
  return 0;
}

function goToFlatIndex(flatIndex) {
  if (flatIndex < 0 || flatIndex >= FLAT_STEPS.length) return;
  const entry = FLAT_STEPS[flatIndex];
  currentPhaseIndex = entry.phaseIndex;
  currentStepIndex = entry.stepIndex;
  renderStep();
}

function goToPhase(phaseIndex) {
  if (phaseIndex < 0 || phaseIndex >= SEQUENCE.length) return;
  currentPhaseIndex = phaseIndex;
  currentStepIndex = 0;
  renderStep();
}

function goNext() {
  const idx = currentFlatIndex();
  // Prompt for assessment before moving?
  // User asked: "The app should also ask, after each step, if anything was affected or destroyed"
  // So we intercept the "Next" action.
  showAssessmentModal(() => {
     if (idx >= FLAT_STEPS.length - 1) return;
     goToFlatIndex(idx + 1);
  });
}

function goPrev() {
  const idx = currentFlatIndex();
  if (idx <= 0) return;
  goToFlatIndex(idx - 1);
}

function whoActsSentence(step) {
  const initiativeName = initiativeSide === "blue" ? blueName : redName;
  const nonInitName = initiativeSide === "blue" ? redName : blueName;

  switch (step.actor) {
    case "initiative":
      return `${initiativeName} (initiative) acts in this step.`;
    case "non-initiative":
      return `${nonInitName} (non-initiative) acts in this step.`;
    case "alt":
      return `${initiativeName} acts first, then ${nonInitName}.`;
    case "both":
    default:
      return `${blueName} and ${redName} act in this step, as described below.`;
  }
}

// -----------------------------
// Rendering
// -----------------------------

function renderPhaseList() {
  const list = document.getElementById("phase-list");
  list.innerHTML = "";

  SEQUENCE.forEach((phase, index) => {
    const li = document.createElement("li");
    li.className = "phase-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "phase-button";
    btn.dataset.phaseIndex = index.toString();

    if (index === currentPhaseIndex) {
      btn.classList.add("active");
    }

    const label = document.createElement("span");
    label.className = "phase-label";
    label.textContent = `Phase ${phase.number}`;

    const name = document.createElement("span");
    name.className = "phase-name";
    name.textContent = phase.name;

    btn.appendChild(label);
    btn.appendChild(name);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderJumpSelect() {
  const select = document.getElementById("step-jump-select");
  const flatIdx = currentFlatIndex();
  select.innerHTML = "";

  FLAT_STEPS.forEach((entry, idx) => {
    const opt = document.createElement("option");
    const p = entry.phase;
    const s = entry.step;
    opt.value = String(idx);
    opt.textContent = `P${p.number} ${p.name} – ${s.code} ${s.title}`;
    if (idx === flatIdx) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderReminders() {
  const phase = SEQUENCE[currentPhaseIndex];
  const step = phase.steps[currentStepIndex];
  const reminderList = document.getElementById("reminder-list");
  const input = document.getElementById("reminder-input");
  const formButton = document.querySelector("#reminder-form button[type='submit']");

  const reminders = loadReminders(step.id);
  reminderList.innerHTML = "";

  reminders.forEach((rem, index) => {
    const li = document.createElement("li");
    li.className = "reminder-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!rem.completed;

    checkbox.addEventListener("change", () => {
      const updated = loadReminders(step.id);
      if (updated[index]) {
        updated[index].completed = checkbox.checked;
        saveReminders(step.id, updated);
        renderReminders();
      }
    });

    const span = document.createElement("span");
    span.className = "reminder-text";
    if (rem.completed) span.classList.add("completed");
    span.textContent = rem.text || "";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "reminder-delete";
    del.textContent = "✕";
    del.title = "Delete reminder";
    del.addEventListener("click", () => {
      const updated = loadReminders(step.id);
      updated.splice(index, 1);
      saveReminders(step.id, updated);
      renderReminders();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(del);
    reminderList.appendChild(li);
  });

  if (reminders.length >= 3) {
    input.disabled = true;
    input.placeholder = "Maximum of 3 reminders reached.";
    formButton.disabled = true;
  } else {
    input.disabled = false;
    input.placeholder = "Add a reminder for this step…";
    formButton.disabled = false;
  }
}

function renderStep() {
  const phase = SEQUENCE[currentPhaseIndex];
  const step = phase.steps[currentStepIndex];

  document.getElementById("breadcrumbs").textContent =
    `Phase ${phase.number}: ${phase.name} • Step ${step.code}`;
  document.getElementById("step-title").textContent = step.title;
  document.getElementById("step-description").textContent = step.description;

  document.getElementById("who-acts-line").textContent = whoActsSentence(step);

  // Action instructions
  const actionList = document.getElementById("action-list");
  actionList.innerHTML = "";
  // Always use "full" actions for now, as we filter steps by inventory
  // or we could use specific mode text if we kept modes.
  // For simplicity, let's use "full" text but dynamically adapted?
  // The original code had separate text for "a2a".
  // Let's use "full" actions as default, since we are selecting specific assets.
  const modeActions = (step.actions && step.actions["full"]) || [];
  modeActions.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line
      .replace(/\bInitiative player\b/g, initiativeSide === "blue" ? blueName : redName)
      .replace(/\bNon-initiative player\b/g, initiativeSide === "blue" ? redName : blueName);
    actionList.appendChild(li);
  });

  // Rules reference
  const rulesList = document.getElementById("rules-ref-list");
  rulesList.innerHTML = "";
  (step.rulesRef || []).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    rulesList.appendChild(li);
  });

  renderReminders();
  renderPhaseList();
  renderJumpSelect();
}

function renderModeHeader() {
  const chip = document.getElementById("mode-chip");
  // Summarize inventory
  const blueCount = inventory.blue.length;
  const redCount = inventory.red.length;
  chip.textContent = `Blue Assets: ${blueCount}, Red Assets: ${redCount}`;

  const initLabel = document.getElementById("initiative-label");
  const nonInitLabel = document.getElementById("non-initiative-label");

  if (initiativeSide === "blue") {
    initLabel.textContent = blueName;
    nonInitLabel.textContent = redName;
  } else {
    initLabel.textContent = redName;
    nonInitLabel.textContent = blueName;
  }
}

// -----------------------------
// Dice roller
// -----------------------------

function rollDie(sides) {
  const value = Math.floor(Math.random() * sides) + 1;
  const label = `d${sides}`;
  diceHistory.unshift({ die: label, value });
  diceHistory = diceHistory.slice(0, 5);
  renderDice();
}

function renderDice() {
  const lastRollEl = document.getElementById("last-roll");
  if (diceHistory.length === 0) {
    lastRollEl.textContent = "—";
  } else {
    const last = diceHistory[0];
    lastRollEl.textContent = `${last.die} → ${last.value}`;
  }

  const list = document.getElementById("dice-history-list");
  list.innerHTML = "";
  diceHistory.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = `${r.die}: ${r.value}`;
    list.appendChild(li);
  });
}

// -----------------------------
// Assessment Modal
// -----------------------------

function showAssessmentModal(onConfirm) {
  // Simple check: confirm with user
  // In a real app, this would be a modal. For now, we'll use a confirm dialog
  // or a custom overlay if we want to be fancy.
  // Let's build a custom overlay dynamically.
  
  const existingOverlay = document.getElementById("assessment-overlay");
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement("div");
  overlay.id = "assessment-overlay";
  overlay.className = "setup-overlay";
  
  const card = document.createElement("div");
  card.className = "setup-card";
  
  card.innerHTML = `
    <h2>Step Complete</h2>
    <p>Did any assets get destroyed or removed from play in this step?</p>
    <div class="setup-row">
        <h3>Blue Inventory</h3>
        <div class="inventory-grid" id="assess-blue-inventory"></div>
    </div>
    <div class="setup-row">
        <h3>Red Inventory</h3>
        <div class="inventory-grid" id="assess-red-inventory"></div>
    </div>
    <div class="setup-row" style="flex-direction: row; justify-content: flex-end; gap: 1rem;">
       <button id="assess-confirm-btn" class="primary-btn">Continue</button>
    </div>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Populate checkboxes based on current inventory
  const blueDiv = card.querySelector("#assess-blue-inventory");
  const redDiv = card.querySelector("#assess-red-inventory");
  
  // Helper to build checkboxes
  const makeCheckbox = (val, label, teamList) => {
      const l = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = val;
      cb.checked = teamList.includes(val);
      l.appendChild(cb);
      l.append(" " + label); // simple text append
      return l;
  };

  // Asset types map
  const assets = [
     {v: "naval", l: "Naval Units"},
     {v: "air", l: "Air Units"},
     {v: "ground", l: "Ground Forces"},
     {v: "sam", l: "Air Defenses"},
     {v: "sof", l: "Special Forces"},
     {v: "cyber", l: "Cyber/Space"}
  ];

  assets.forEach(a => blueDiv.appendChild(makeCheckbox(a.v, a.l, inventory.blue)));
  assets.forEach(a => redDiv.appendChild(makeCheckbox(a.v, a.l, inventory.red)));

  document.getElementById("assess-confirm-btn").addEventListener("click", () => {
      // Update inventory
      const getChecked = (container) => Array.from(container.querySelectorAll("input:checked")).map(cb => cb.value);
      
      inventory.blue = getChecked(blueDiv);
      inventory.red = getChecked(redDiv);
      
      // Re-evaluate sequence if needed?
      // If we remove assets, some future steps might disappear.
      // We should probably preserve current step index if possible, or simple re-render.
      // Ideally, we shouldn't change the PAST steps, but the future ones.
      // Since we rebuild the whole sequence array, we need to map the current index to the new array.
      // For simplicity: just continue to next step. The `goNext` callback handles index increment.
      // But if we rebuild sequence, indices shift.
      // Let's rebuild sequence *after* moving to next step? No, that might skip.
      
      // Correct approach:
      // 1. Identify "current step ID" (e.g. "1-2").
      // 2. Rebuild sequence.
      // 3. Find where we are or where the next step is.
      // Actually, simplest is to Rebuild Sequence NOW, then try to find the "Next" step ID from the OLD sequence in the NEW sequence.
      
      // However, for this iteration, let's just update inventory and call onConfirm()
      // which moves to next flat index. 
      // NOTE: If we change sequence, flat index is meaningless relative to old sequence.
      // We'll defer sequence rebuild to the start of the next turn? 
      // Or just rebuild it now and find the correct index.
      
      // Let's try rebuilding immediately:
      const oldFlat = FLAT_STEPS;
      const oldIdx = currentFlatIndex();
      
      // We are about to go to oldIdx + 1.
      // Let's see what step ID that was.
      let targetStepId = null;
      if (oldIdx + 1 < oldFlat.length) {
          targetStepId = oldFlat[oldIdx + 1].step.id;
      }
      
      SEQUENCE = buildSequenceForMode(inventory);
      rebuildFlatSteps();
      
      if (targetStepId) {
          // Find this step in new steps
          const newIdx = FLAT_STEPS.findIndex(x => x.step.id === targetStepId);
          if (newIdx !== -1) {
             // We found the next step in the new sequence
             // set current indices to match it
             const entry = FLAT_STEPS[newIdx];
             currentPhaseIndex = entry.phaseIndex;
             currentStepIndex = entry.stepIndex;
             renderStep();
          } else {
             // The next step was removed due to inventory change!
             // We should find the next available step after that one...
             // fallback: just go to the same numerical index if possible, or last one.
             // or search for the first step with id > targetStepId? (lexicographically roughly works)
             // simplified: stay at current if next is gone? No, we finished current.
             // Go to the *first* step of the *next* phase?
             // Let's just find the first step in FLAT_STEPS that is "after" the current one in the original full list?
             
             // Robust way: search BASE_SEQUENCE for targetStepId, then look forward until we find one that is in FLAT_STEPS.
             // ... implementing that is complex.
             // Simple fallback: If next step removed, go to next available step in new list.
             // We can assume the new list is a subset.
             // Just find the first step in FLAT_STEPS whose index in BASE_SEQUENCE is > the index of the just-finished step.
             
             // Let's keep it simple: Just execute onConfirm (which does index+1), but since we rebuild, we can't use onConfirm directly.
             // We manually handle navigation here.
             
             // Find where we were (oldFlat[oldIdx].step.id)
             const finishedStepId = oldFlat[oldIdx].step.id;
             
             // Find the first step in FLAT_STEPS that comes AFTER finishedStepId in the canonical order.
             // We know the canonical order is BASE_SEQUENCE.
             // Let's flatten BASE_SEQUENCE into IDs.
             const canonicalIds = [];
             BASE_SEQUENCE.forEach(p => p.steps.forEach(s => canonicalIds.push(s.id)));
             
             const finishedCanonicalIdx = canonicalIds.indexOf(finishedStepId);
             let nextFound = false;
             
             for (let i = finishedCanonicalIdx + 1; i < canonicalIds.length; i++) {
                 const candId = canonicalIds[i];
                 const match = FLAT_STEPS.find(x => x.step.id === candId);
                 if (match) {
                     currentPhaseIndex = match.phaseIndex;
                     currentStepIndex = match.stepIndex;
                     renderStep();
                     nextFound = true;
                     break;
                 }
             }
             
             if (!nextFound) {
                 // End of game?
                 alert("No further steps available with current inventory.");
             }
          }
      } else {
          // End of game
          alert("Turn complete!");
      }
      
      renderModeHeader();
      overlay.remove();
  });
}

// -----------------------------
// Event wiring
// -----------------------------

function setupEventListeners() {
  // Phase nav
  document.getElementById("phase-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button.phase-button");
    if (!btn) return;
    const index = parseInt(btn.dataset.phaseIndex, 10);
    if (!isNaN(index)) goToPhase(index);
  });

  // Prev/Next
  document.getElementById("prev-step-btn").addEventListener("click", goPrev);
  document.getElementById("next-step-btn").addEventListener("click", goNext);

  // Jump select
  document
    .getElementById("step-jump-select")
    .addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      if (!isNaN(idx)) goToFlatIndex(idx);
    });

  // Reminders
  document.getElementById("reminder-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("reminder-input");
    const text = (input.value || "").trim();
    if (!text) return;
    const phase = SEQUENCE[currentPhaseIndex];
    const step = phase.steps[currentStepIndex];
    const reminders = loadReminders(step.id);
    if (reminders.length >= 3) return;
    reminders.push({ text, completed: false });
    saveReminders(step.id, reminders);
    input.value = "";
    renderReminders();
  });

  // Dice buttons
  document.querySelectorAll(".dice-buttons button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sides = parseInt(btn.dataset.die, 10);
      if (!isNaN(sides)) rollDie(sides);
    });
  });

  // Setup form
  document.getElementById("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    // const modeSelect = document.getElementById("mode-select"); // removed
    const bInput = document.getElementById("blue-name-input");
    const rInput = document.getElementById("red-name-input");
    const initiativeRadio = document.querySelector(
      "input[name='initiative']:checked"
    );

    // mode = modeSelect.value;
    blueName = (bInput.value || "Blue").trim() || "Blue";
    redName = (rInput.value || "Red").trim() || "Red";
    initiativeSide = initiativeRadio ? initiativeRadio.value : "blue";
    
    // Collect inventory
    const getChecked = (name) => Array.from(document.querySelectorAll(`input[name='${name}']:checked`)).map(cb => cb.value);
    inventory.blue = getChecked('blue_assets');
    inventory.red = getChecked('red_assets');

    SEQUENCE = buildSequenceForMode(inventory);
    rebuildFlatSteps();
    currentPhaseIndex = 0;
    currentStepIndex = 0;

    document.getElementById("setup-overlay").style.display = "none";
    const appRoot = document.getElementById("app-root");
    appRoot.hidden = false;

    renderModeHeader();
    renderStep();
    renderDice();
  });
}

// -----------------------------
// Init
// -----------------------------

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});
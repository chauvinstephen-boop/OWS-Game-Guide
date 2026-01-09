// Data model – core steps based on OWS Series Rules v2.3

export const BASE_SEQUENCE = [
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
      },
      {
        id: "1-3",
        code: "1.3",
        title: "Assign reserve & main effort designations",
        actor: "both",
        modes: ["full"],
        requires: ["ground"],
        description:
          "Designate Main Effort and Reserve status for ground formations using HQ capabilities.",
        actions: {
          full: [
            "Both players assign reserves and Main Effort designations for divisions/corps per HQ rules.",
            "Main Effort provides combat bonuses; Reserve units move slower but can exploit."
          ]
        },
        rulesRef: [
          "HQ units generate these effects within their command radius.",
          "Main Effort applies to ground combat adjudication."
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
        requires: ["naval", "ground", "air"],
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
        code: "3.A.1",
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
        id: "3A-2",
        code: "3.A.2",
        title: "Initiate amphibious assaults",
        actor: "alt",
        modes: ["full"],
        requires: ["naval"],
        description:
          "Place Amphibious Assault markers for units conducting ship-to-shore movement.",
        actions: {
          full: [
            "Players place Amphibious Assault markers in beach landing hexes along with the transporting ships and ground units.",
            "These units are now committed to landing and fighting in the Ground Combat Phase.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Only amphibious-capable units or those with landing craft can assault.",
          "Units are vulnerable to attack during the Combat Phase before landing."
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
        id: "3B-3",
        code: "3.B.3",
        title: "Initiate airborne & air assaults",
        actor: "both",
        modes: ["full"],
        requires: ["air"],
        description:
          "Place Airborne or Air Assault markers for units conducting vertical envelopment.",
        actions: {
          full: [
            "Players place Airborne/Air Assault markers on target Landing Zones (LZ) along with transport aircraft and ground units.",
            "Ensure sufficient lift capacity is assigned (e.g. 1 transport per step, or 2 for mech).",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Transports and units are vulnerable to air defense and CAP during the Combat Phase.",
          "If transports survive, ground units land and fight in the Ground Combat Phase."
        ]
      },
      {
        id: "3C-1",
        code: "3.C.1",
        title: "Move SOF units & roll for insertion",
        actor: "both",
        modes: ["full"],
        requires: ["sof"],
        description:
          "Place SOF counters into target hexes and check for successful insertion.",
        actions: {
          full: [
            "Both players place SOF missions in chosen hexes.",
            "Immediately roll for insertion vs local detection where required (usually d8).",
            "Failed insertions go to the Regeneration Box."
          ]
        },
        rulesRef: [
          "Insertion roll may be modified by terrain or enemy density.",
          "If successful, SOF remains in hex for mission execution."
        ]
      },
      {
        id: "3C-2",
        code: "3.C.2",
        title: "Adjudicate SOF missions",
        actor: "both",
        modes: ["full"],
        requires: ["sof"],
        description:
          "Resolve Strategic Recon, Target Acquisition, Direct Action, or Support missions.",
        actions: {
          full: [
            "Resolve Direct Action attacks (roll for compromise first, then attack).",
            "Mark Strategic Recon success (allows local ISR detection in Phase 5).",
            "Note Target Acquisition (promotes missile strikes in Phase 6).",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Compromised SOF are removed to Regeneration Box.",
          "Successful Direct Action inflicts step losses on targets."
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
        title: "Adjudicate cyber attacks & IO tokens",
        actor: "both",
        modes: ["full"],
        requires: ["cyber"],
        description:
          "Resolve cyber outcomes and apply IO token effects.",
        actions: {
          full: [
            "Resolve each Cyber Card's effect and note any required recovery rolls in later turns.",
            "Apply effects from IO tokens (Disrupt C2, Assure C2, SIGINT/EMSO, Active/Passive Countermeasures) per token text.",
            "Note which units and functions are affected by cyber attacks and IO effects."
          ]
        },
        rulesRef: [
          "Disrupt C2 can prevent HQs, missiles, or space functions from operating if not blocked.",
          "Assure C2 and Active/Passive CM provide defensive layers that must be defeated first."
        ]
      },
      {
        id: "4-3",
        code: "4.3",
        title: "Adjudicate the space capability dashboard",
        actor: "both",
        modes: ["full"],
        requires: ["cyber"],
        description:
          "After IO and Cyber Cards have been played, adjudicate any impacts on space capabilities.",
        actions: {
          full: [
            "Adjudicate all Disrupt C2 or Cyber Cards that impact space-related capabilities using the Space Capability Dashboard.",
            "Update C2 Satellite Constellation (determines number of long-range strike actions available in Combat Phase).",
            "Update PNT (Position, Navigation, Timing) status - disrupted PNT demotes long-range strikes beyond 1 hex.",
            "Update ISR track and pawn count (controls detection die type and number of ISR pawns available).",
            "Apply all space capability effects for the remainder of the game turn."
          ]
        },
        rulesRef: [
          "C2 track value equals the number of long-range strike actions available.",
          "Disrupted PNT demotes long-range strikes beyond 1 hex; ISR track controls detection die and number of ISR pawns.",
          "All space capability effects are applied for the remainder of the turn after this adjudication."
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
      "Resolve air combat, strike warfare (if used), and ground combat (full mode). STRICT ORDER OF PRECEDENCE: Each step must be fully resolved before moving to the next.",
    steps: [
      {
        id: "6A-1",
        code: "6.A.1",
        title: "Air combat – long-range interceptors",
        actor: "alt",
        modes: ["full", "a2a", "a2a-ground"],
        requires: ["air"],
        description:
          "Resolve all long-range (range 1+) air-to-air missile engagements by fighters firing from adjacent hexes.",
        actions: {
          full: [
            "Initiative player chooses the first hex to adjudicate long-range interceptor combat.",
            "In that hex, both players declare long-range A2A shots (fighters firing Air-to-Air missiles from adjacent hexes, Range 1+).",
            "Resolve all long-range interceptor engagements simultaneously within each hex.",
            "Repeat for each hex where long-range interceptor combat is possible.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          a2a: [
            "Starting with a hex chosen by the initiative player, both players declare long-range interceptor engagements.",
            "Roll and remove destroyed missions to the Regeneration Box as appropriate.",
            "Continue across all hexes with possible long-range interceptor combat.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          "a2a-ground": [
            "Adjudicate long-range interceptors first in hexes where fighters are protecting or attacking ground stations.",
            "Then resolve remaining hexes with long-range interceptor engagements.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Fighters with attack range 1+ may engage adjacent hexes if supported by sufficient sensing.",
          "Stealth fighters may lose EMCON/low observability when firing into adjacent hexes depending on support.",
          "This step resolves simultaneously within each hex before proceeding to the next sub-step."
        ]
      },
      {
        id: "6A-2",
        code: "6.A.2",
        title: "Air combat – long-range SEAD",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["air", "sam"],
        description:
          "Resolve Electronic Warfare aircraft (e.g., Growlers) attacking Air Defense units from standoff range.",
        actions: {
          full: [
            "Initiative player selects a hex with long-range SEAD vs Air Defense interactions.",
            "Resolve long-range SEAD attacks (Electronic Warfare aircraft attacking Air Defense units from standoff range).",
            "SEAD attacks occur before SAM return fire if at true stand-off range.",
            "Resolve all long-range SEAD engagements simultaneously within each hex.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          "a2a-ground": [
            "Resolve long-range SEAD strikes against ground-based Air Defense units (SAMs, radars) from standoff range.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "SEAD at true stand-off may strike without entering SAM engagement range.",
          "This step resolves simultaneously within each hex before proceeding to the next sub-step."
        ]
      },
      {
        id: "6A-3",
        code: "6.A.3",
        title: "Air combat – long-range air defense",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["sam", "air"],
        description:
          "Resolve long-range SAMs (e.g., S-400, Patriot) engaging aircraft from range.",
        actions: {
          full: [
            "Resolve long-range SAM shots (e.g., S-400, Patriot) vs aircraft within range.",
            "Resolve all long-range air defense engagements simultaneously within each hex.",
            "Update which SAMs are suppressed or out of missiles for the rest of the turn.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          "a2a-ground": [
            "Resolve long-range SAM engagements against aircraft within range.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Grey SAM shields must be defeated before enduring red shield defenses.",
          "This step resolves simultaneously within each hex before proceeding to the next sub-step."
        ]
      },
      {
        id: "6A-4",
        code: "6.A.4",
        title: "Air combat – in-hex fighter engagement (dogfight)",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["air"],
        description:
          "Resolve in-hex fighter vs fighter combat with strict priority: Escorts first, then High Value/Strike Assets.",
        actions: {
          full: [
            "For each hex, starting with initiative player's choice, resolve in-hex fighter engagements in strict priority order:",
            "PRIORITY 1 - Escorts: Defending CAP must engage Escort fighters first on a 1-to-1 basis. Match all escorts before proceeding.",
            "PRIORITY 2 - High Value/Strike Assets: Only 'excess' defending fighters (those remaining after matching all escorts) may engage Bombers, Strike aircraft, Tankers, or AWACS.",
            "Remove destroyed air missions to the Regeneration Box.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          "a2a-ground": [
            "Resolve in-hex fighter engagements with strict priority: Escorts first (1-to-1), then excess fighters may engage High Value/Strike Assets.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Strike/Attack aircraft (CAS, Interdiction) cannot initiate Air-to-Air combat; they only defend if attacked.",
          "Attack-mission fighters defend with a demoted die and cannot initiate A2A.",
          "All escort fighters must be matched before any excess fighters can engage strike assets."
        ]
      },
      {
        id: "6A-5",
        code: "6.A.5",
        title: "Air combat – transition air to tactical map",
        actor: "both",
        modes: ["full"],
        requires: ["air", "ground"],
        description:
          "If using tactical maps, transition surviving air units to tactical hexes.",
        actions: {
          full: [
            "Move surviving air units from operational hexes to specific tactical hexes or zones if applicable."
          ]
        },
        rulesRef: [
          "Only applies if using nested tactical maps."
        ]
      },
      {
        id: "6A-6",
        code: "6.A.6",
        title: "Air combat – in-hex SEAD",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["air", "sam"],
        description:
          "Surviving SEAD aircraft attack remaining Air Defense units in the hex.",
        actions: {
          full: [
            "Resolve any surviving SEAD strikes from aircraft in the same hex as the target Air Defense units (SAM/AAA).",
            "Only SEAD aircraft that survived the previous Air Combat sub-steps may engage at this point.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          "a2a-ground": [
            "Surviving SEAD aircraft attack remaining Air Defense units in the hex.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Only SEAD aircraft that survived long-range and in-hex fighter engagements may participate.",
          "This occurs after all fighter engagements are resolved."
        ]
      },
      {
        id: "6A-7",
        code: "6.A.7",
        title: "Air combat – point defense",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["sam", "air"],
        description:
          "Surviving Short-Range Air Defense (SHORAD) engages any remaining aircraft in the hex.",
        actions: {
          full: [
            "Resolve point defense shots: Surviving Short-Range Air Defense (SHORAD) engages any remaining aircraft in the hex.",
            "This includes Patriot, ship SAMs, AAA, and other point defense systems that survived previous steps.",
            "Remove destroyed air missions.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          "a2a-ground": [
            "Surviving SHORAD engages any remaining aircraft in the hex.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Only Air Defense units that survived long-range SEAD and in-hex SEAD may participate.",
          "Surviving aircraft can now proceed to Strike Warfare or remain on station."
        ]
      },
      {
        id: "6B-1",
        code: "6.B.1",
        title: "Strike warfare – long-range missiles",
        actor: "alt",
        modes: ["full", "a2a-ground"],
        requires: ["air", "sam", "naval"],
        description:
          "Cruise and Ballistic missiles fired from outside the hex (Naval or Ground launchers). Unengaged Defensive CAP may intercept Cruise Missiles.",
        actions: {
          full: [
            "Using the strike allocations from the C2 track, initiative player declares a target hex and all long-range missile strikes into it (Many-to-One).",
            "INTERCEPT: Unengaged Defensive CAP may intercept incoming Cruise Missiles (but NOT Ballistic/Hypersonic) at this moment.",
            "Defender declares air defense shot allocation (grey shields, CAP intercepts vs Cruise Missiles) before any dice are rolled.",
            "Resolve missile intercepts and strikes, then alternate strike actions per chosen sequence method until all long-range strike chits are used.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          "a2a-ground": [
            "Initiative player uses long-range missiles primarily to attack or defend ground stations (airfields, SAMs, radars).",
            "Unengaged Defensive CAP may intercept incoming Cruise Missiles (not Ballistic/Hypersonic).",
            "Defender allocates Patriots and fighter CAP to intercept missile salvos where permitted.",
            "Alternate strike actions until both sides have exhausted their long-range strike allocations.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "One long-range strike action covers all long-range salvos into a single target hex.",
          "Missiles cannot target undetected mobile units; infrastructure and ASPs may be targeted if known.",
          "Only Cruise Missiles can be intercepted by CAP; Ballistic and Hypersonic missiles cannot be intercepted at this step."
        ]
      },
      {
        id: "6B-2",
        code: "6.B.2",
        title: "Strike warfare – surviving strike aircraft & local strikes",
        actor: "both",
        modes: ["full", "a2a-ground"],
        requires: ["air", "ground", "naval"],
        description:
          "Surviving Strike Aircraft release payloads, then resolve local strikes (within a hex or local kill chain).",
        actions: {
          full: [
            "SURVIVING STRIKE AIRCRAFT: Bombers and Strike fighters that survived the Air Combat step now release their payloads.",
            "Resolve strikes from surviving strike aircraft against their designated targets.",
            "LOCAL STRIKES: By initiative, by hex, resolve any residual local strikes that did not consume C2 allocations.",
            "Include units firing into their own hex or adjacent naval engagements, artillery fires, short-range air strikes, and naval gunfire within the same hex or local kill chain.",
            "Apply Fires Effects Table for strikes vs ground units and mark step losses and suppression.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ],
          "a2a-ground": [
            "Surviving Strike Aircraft: Bombers and Strike fighters that survived Air Combat now release payloads against ground stations.",
            "Local Strikes: Resolve local air strikes vs ground stations that are within the attacker's hex or local radius.",
            "Use the Fires Effects Table to determine step losses or suppression on airfields and SAM batteries.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Only strike aircraft that survived all Air Combat sub-steps may release payloads.",
          "Local strikes are resolved after long-range missiles and surviving strike aircraft to reflect kill chain timing.",
          "Ground Fires Effects Table determines hits vs suppression by terrain and unit type."
        ]
      },
      {
        id: "6C-1",
        code: "6.C.1",
        title: "Ground – decision cards & initiative determination (full game only)",
        actor: "both",
        modes: ["full"],
        requires: ["ground"],
        description:
          "Both sides play Decision Cards pertaining to Ground Force initiative, then determine the sequence for ground formation activations.",
        actions: {
          full: [
            "Both sides play Decision Cards pertaining to Ground Force initiative (e.g., Planned Offensive).",
            "Determine the ground initiative method (by side, by formation I-go-U-go, or random chit draw).",
            "Lay out formation chits or order list so both players can follow activation sequence."
          ]
        },
        rulesRef: [
          "Decision Cards may enable a side to seize initiative and dictate activation sequence.",
          "If both sides play the same card, an opposed die roll determines whose card goes first.",
          "Reserve units move at half rate and normally only fight when activated in exploitation or if attacked."
        ]
      },
      {
        id: "6C-2",
        code: "6.C.2",
        title: "Ground – organize (full game only)",
        actor: "both",
        modes: ["full"],
        requires: ["ground"],
        description:
          "Each side places units in reserve status, confirms task organization, and assigns HQ effects (Main Effort & IO).",
        actions: {
          full: [
            "Reserve Designation & Task Organization: Each side places units in reserve status as desired and confirms task organization.",
            "HQ Effects: Assign Main Effort designations and apply IO effects within HQ command radius.",
            "Missions: Assign Air & Ground missions to supporting units (CAS, artillery, etc.)."
          ]
        },
        rulesRef: [
          "Main Effort provides combat bonuses; Reserve units move slower but can exploit.",
          "HQ units generate effects within their command radius.",
          "Supporting fires (artillery, CAS) must be allocated to specific combat actions."
        ]
      },
      {
        id: "6C-3",
        code: "6.C.3",
        title: "Ground – by action unit: movement, fires, and combat (full game only)",
        actor: "alt",
        modes: ["full"],
        requires: ["ground"],
        description:
          "Activate formations in sequence: Artillery & Air (Prep Fires), Defensive Fires, then Maneuver Units resolve primary battle.",
        actions: {
          full: [
            "Per initiative method, activate one formation (actioning unit) in strict sequence:",
            "3.A - Conduct Prep Fires: Attackers fire artillery and conduct CAS/Air Interdiction to shape the battlefield. Mark artillery as expended.",
            "3.B - Consume Fuel Points (Advanced): Players consume fuel associated with unit moves (if using advanced rules).",
            "3.C - Move & Declare Combat: Actioning unit's forces can move up to full movement allowance. Units in reserve status may move ½ movement points. Place 'Combat' marker on declared ground combat actions.",
            "3.D - Allocate Supporting Fires: Artillery units and available Close Air Support are assigned to support declared ground combat. Mark artillery with an IDF Support marker.",
            "3.E - Conduct Defensive Fires: Defending units in the zone of action may conduct defensive artillery missions against fires or maneuver units. Defender allocates supporting fires to declared ground combat actions.",
            "3.F - Resolve Ground Combat: Resolve declared combat actions in attacker's choice of sequence using the Ground Combat Adjudication Table (GCAT).",
            "3.G - Exploitation Move (if applicable): Attacker may commit units marked Reserve as an Exploitation Force and conduct movement up to ½ movement points.",
            "3.H - Exploitation Combat (if applicable): The Exploitation Force may attack into a hex and may be supported by available unexpended supporting fires. Resolve combat normally.",
            "Repeat for each formation until all ground actions are complete.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Hexside limits (steps per hexside) and supporting arms determine odds and modifiers.",
          "Suppression, delay, and fortified status significantly affect GCAT outcomes.",
          "Each sub-step must be fully resolved before proceeding to the next: Prep Fires → Defensive Fires → Maneuver Units.",
          "Artillery units that conduct Prep Fire are marked expended and cannot fire again this turn."
        ]
      },
      {
        id: "6C-4",
        code: "6.C.4",
        title: "Security Force Battles & Partisan Attacks (Advanced)",
        actor: "both",
        modes: ["full"],
        requires: ["ground", "sof"],
        description:
          "Resolve combat in rear areas involving Security Zones and Partisans.",
        actions: {
          full: [
            "Resolve attacks by Partisans against supply lines or rear area units.",
            "Resolve Security Zone defense against Partisans or SOF.",
            "REMINDER: Update the Unit Scratch Pad for any assets destroyed or removed in this step."
          ]
        },
        rulesRef: [
          "Partisan attacks use specific tables or modifiers.",
          "This step is optional and only applies if using advanced rules for Security Zones and Partisans."
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
            "7.A Check Supply: Trace supply from combat units back to supply sources, marking extended or out-of-supply states.",
            "7.B Reset IO/Cyber: Remove offensive IO/Cyber markers; leave applicable defensive markers in place.",
            "7.C Reset Marker Track: Verify theater ISR capability on Space Dashboard."
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
            "7.D Reset Aviation: Return air missions to their airfields or carriers (unless scenario allows leaving CAP/Interdiction in place).",
            "7.E Advance Timers: Reduce active timers (e.g. readiness, arrival) by one increment.",
            "7.F Remove Status Markers: Remove RSO&I, suppression, TACSIT, amphibious/airborne assault markers as required."
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
            "7.G Repair Infrastructure: Roll for port, airfield, and rail repair (with engineer modifiers where present).",
            "7.H Regenerate SOF & Air: Roll to regenerate SOF and air missions from the Regeneration Box.",
            "7.I Resupply Missiles: Resupply missile and SAM salvos that are auto-resupplied or have access to ASP counters.",
            "7.J Advance Turn Marker & Weather: Note reinforcements and roll for weather changes."
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

// Unit Database

export const UNIT_DATABASE = {
  blue: {
    naval: [
      { id: "nimitz", name: "Nimitz Class (CVN)", category: "naval" },
      { id: "america", name: "America-Class (LHA)", category: "naval" },
      { id: "san_antonio", name: "San Antonio (LPD)", category: "naval" },
      { id: "arleigh_burke", name: "Arleigh Burke (DDG)", category: "naval" },
      { id: "virginia", name: "Virginia Class (SSN)", category: "naval" },
      { id: "los_angeles", name: "Los Angeles Class (SSN)", category: "naval" },
      { id: "seawolf", name: "Seawolf Class (SSN)", category: "naval" }
    ],
    air: [
      { id: "f35c", name: "F-35C Lightning II (Navy)", category: "air" },
      { id: "f18", name: "F/A-18 Super Hornet", category: "air" },
      { id: "e2d", name: "E-2D Advanced Hawkeye", category: "air" },
      { id: "mq25", name: "MQ-25 Stingray", category: "air" },
      { id: "p8", name: "P-8 Poseidon", category: "air" },
      { id: "f35a", name: "F-35A Lightning II (AF)", category: "air" },
      { id: "f22", name: "F-22 Raptor", category: "air" },
      { id: "f15ex", name: "F-15EX Eagle II", category: "air" },
      { id: "f16c", name: "F-16C Fighting Falcon", category: "air" },
      { id: "e3", name: "E-3 Sentry (AWACS)", category: "air" },
      { id: "c17", name: "C-17 Globemaster III", category: "air" },
      { id: "kc46", name: "KC-46 Pegasus", category: "air" },
      { id: "kc135", name: "KC-135 Stratotanker", category: "air" },
      { id: "b1", name: "B-1 Lancer", category: "air" },
      { id: "b52", name: "B-52 Stratofortress", category: "air" },
      { id: "ucav", name: "UCAV", category: "air" },
      { id: "f35b", name: "F-35B Lightning II (Marines)", category: "air" },
      { id: "mv22", name: "MV-22 Osprey", category: "air" },
      { id: "kc130", name: "KC-130 Hercules", category: "air" }
    ],
    ground: [
      { id: "m142", name: "M142 HIMARS", category: "ground" },
      { id: "lcc_nsm", name: "LCC/LCP NSM (Marines)", category: "ground" }
    ],
    sam: [
      { id: "pac2", name: "Patriot PAC-2", category: "sam" },
      { id: "pac3", name: "Patriot PAC-3", category: "sam" },
      { id: "thaad", name: "THAAD", category: "sam" }
    ],
    sof: [
      { id: "blue_sof", name: "Special Operations Forces", category: "sof" }
    ],
    cyber: [
      { id: "blue_cyber", name: "Cyber / Space Capabilities", category: "cyber" }
    ]
  },
  red: {
    naval: [
      { id: "shandong", name: "Shandong (CV)", category: "naval" },
      { id: "renhai", name: "Renhai Class (Cruiser)", category: "naval" },
      { id: "luyang3", name: "Luyang-III (DDG)", category: "naval" },
      { id: "jiangkai", name: "Jiangkai (Frigate)", category: "naval" },
      { id: "shang", name: "Shang Class (SSN)", category: "naval" },
      { id: "song", name: "Song Class (SSK)", category: "naval" },
      { id: "type75", name: "Type 75 Assault Ship", category: "naval" }
    ],
    air: [
      { id: "j20", name: "J-20 Mighty Dragon", category: "air" },
      { id: "j16", name: "J-16", category: "air" },
      { id: "j11", name: "J-11", category: "air" },
      { id: "j10", name: "J-10", category: "air" },
      { id: "j7", name: "J-7", category: "air" },
      { id: "h6", name: "H-6 Bomber", category: "air" },
      { id: "y8q", name: "Y-8Q (ASW)", category: "air" },
      { id: "kj500", name: "KJ-500 (AEW)", category: "air" }
    ],
    ground: [
      { id: "df21c", name: "DF-21C (MRBM)", category: "ground" },
      { id: "df26", name: "DF-26 (IRBM)", category: "ground" }
    ],
    sam: [
      { id: "hq9", name: "HQ-9 (Long Range SAM)", category: "sam" },
      { id: "hq15", name: "HQ-15 (Short Range SAM)", category: "sam" }
    ],
    sof: [
      { id: "red_sof", name: "Special Operations Forces", category: "sof" }
    ],
    cyber: [
      { id: "red_cyber", name: "Cyber / Space Capabilities", category: "cyber" }
    ]
  }
};

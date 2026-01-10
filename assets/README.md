# Assets Folder

This folder should contain PNG images for each unit/asset in the game.

## Required Images

Each unit defined in `js/data/units.js` requires a corresponding PNG image file named after the unit's `id` field.

### Blue Team Assets

**Naval:**
- `nimitz.png` - Nimitz Class (CVN)
- `america.png` - America-Class (LHA)
- `san_antonio.png` - San Antonio (LPD)
- `arleigh_burke.png` - Arleigh Burke (DDG)
- `virginia.png` - Virginia Class (SSN)
- `los_angeles.png` - Los Angeles Class (SSN)
- `seawolf.png` - Seawolf Class (SSN)

**Air:**
- `f35c.png` - F-35C Lightning II (Navy)
- `f18.png` - F/A-18 Super Hornet
- `e2d.png` - E-2D Advanced Hawkeye
- `mq25.png` - MQ-25 Stingray
- `p8.png` - P-8 Poseidon
- `f35a.png` - F-35A Lightning II (AF)
- `f22.png` - F-22 Raptor
- `f15ex.png` - F-15EX Eagle II
- `f16c.png` - F-16C Fighting Falcon
- `e3.png` - E-3 Sentry (AWACS)
- `ec37b.png` - EC-37B Compass Call
- `c17.png` - C-17 Globemaster III
- `kc46.png` - KC-46 Pegasus
- `kc135.png` - KC-135 Stratotanker
- `b1.png` - B-1 Lancer
- `b52.png` - B-52 Stratofortress
- `ucav.png` - UCAV
- `f35b.png` - F-35B Lightning II (Marines)
- `mv22.png` - MV-22 Osprey
- `kc130.png` - KC-130 Hercules

**Ground:**
- `m142.png` - M142 HIMARS
- `lcc_nsm.png` - LCC/LCP NSM (Marines)
- `airfield.png` - Airfield (Main Base)
- `farp.png` - FARP (Forward Arming Refueling Point)

**SAM:**
- `pac2.png` - Patriot PAC-2
- `pac3.png` - Patriot PAC-3
- `thaad.png` - THAAD

**SOF:**
- `blue_sof.png` - Special Operations Forces

**Cyber:**
- `blue_cyber.png` - Cyber / Space Capabilities

### Red Team Assets

**Naval:**
- `shandong.png` - Shandong (CV)
- `renhai.png` - Renhai Class (Cruiser)
- `luyang3.png` - Luyang-III (DDG)
- `jiangkai.png` - Jiangkai (Frigate)
- `shang.png` - Shang Class (SSN)
- `song.png` - Song Class (SSK)
- `type75.png` - Type 75 Assault Ship

**Air:**
- `j20.png` - J-20 Mighty Dragon
- `su35.png` - Su-35 Flanker-E
- `j16.png` - J-16
- `j11.png` - J-11
- `j10.png` - J-10
- `j7.png` - J-7
- `h6.png` - H-6 Bomber
- `y8q.png` - Y-8Q (ASW)
- `kj500.png` - KJ-500 (AEW)

**Ground:**
- `df21c.png` - DF-21C (MRBM)
- `df26.png` - DF-26 (IRBM)
- `airfield.png` - Airfield (Main Base)
- `farp.png` - FARP

**SAM:**
- `hq9.png` - HQ-9 (Long Range SAM)
- `hq15.png` - HQ-15 (Short Range SAM)

**SOF:**
- `red_sof.png` - Special Operations Forces

**Cyber:**
- `red_cyber.png` - Cyber / Space Capabilities

## Image Specifications

- **Format:** PNG
- **Recommended size:** 40x40 to 100x100 pixels
- **Background:** Transparent preferred
- **Aspect ratio:** Square (1:1) recommended

## Note

The application will function without these images - missing images are automatically hidden. However, 404 errors will appear in the browser console until all images are added.

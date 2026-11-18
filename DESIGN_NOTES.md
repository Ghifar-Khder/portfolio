# Engineering notes — revision A.1

## Traceability

Source: the supplied “MR Systems Engineering — Task 1: Construction and evaluation of an MRI receive coil” handout. This project implements only its KiCad construction portion.

| Source requirement | Implementation |
|---|---|
| Round coil, 7.5 cm diameter | Two labelled diameter conventions; select one before fabrication |
| 35 micrometre conductor thickness | Front copper stackup thickness 0.035 mm |
| 5 mm conductor width | Three true circular copper arcs, width 5.000 mm |
| Three evenly distributed capacitors | C1, C2, C3 at 210, 330 and 90 degrees in PCB coordinates; 120-degree spacing |
| 1210 SMD capacitors | 3.2 × 2.5 mm bodies; nominal KiCad 1210 lands |
| SMA feed | Candidate Amphenol RF 132134 vertical THT footprint; supplied part unknown |
| Gerbers for supervised LPKF U4 use | X2 and plain RS-274X review exports; separate outline/drills |
| 5 pF initial values | C1–C3 set to 5 pF initially; added C4 also has provisional 5 pF |
| Loaded tuning to 123.26 MHz | Bench target, not a CAD result |
| S11 below −20 dB at target frequency | Measured target, not an ERC/DRC criterion |

## Diameter ambiguity

“Coil diameter” does not identify the outside edge, centreline or inside edge of the conductor. Two common interpretations are supplied. An inside-diameter interpretation is not included; it would require a third layout if the supervisor specifies it.

**outer_75mm** describes its actual interpretation, not an assertion about the intended assignment. **centerline_75mm** has a 75 mm conductor centreline and 80 mm outside diameter. Nominal diameters refer to the circular portions; capacitor gaps and the feed network interrupt the ideal annulus.

## Circuit and connectivity

C1, C2 and C3 interrupt the loop. C3 is the tuning branch at the feed. The SMA centre reaches LOOP_FEED through series matching capacitor C4; its shield connects to GND on the opposite side of C3.

This is a proposed matching topology, not a circuit diagram extracted from the source. There are three distributed capacitors plus one additional matching capacitor.

| Component pad group | Net |
|---|---|
| C1.1 / C3.2 / all four J1.2 shield pads | GND |
| C1.2 / C2.1 | LOOP_MID |
| C2.2 / C3.1 / C4.2 | LOOP_FEED |
| C4.1 / J1.1 | RF_IN |

Each 5 mm arc is one PCB net. The conductors supply distributed RF inductance even though the schematic represents them as wires. No discrete inductors are fitted.

No RF/EM simulation is included. Final tuning depends on actual inductance, capacitance, component losses, laminate, soldering, feed/cable arrangement and the prescribed load. Initial 5 pF distributed parts may put resonance outside the adjustment range of a small tuning capacitor. C1/C2 may therefore also need replacing. Final values must be measured and recorded; no final component manufacturer/part number is fabricated.

## Physical geometry

Coil centre: (100,100) mm. Angles increase clockwise because PCB Y points down. Three exact circular arcs avoid a polygonal approximation.

Each full-width arc ends at a tangential displacement of 5 mm from the capacitor gap centre. A 1 mm trace joins it to the component land. These short necks are intentional: a 5 mm trace through a 1210 footprint could bridge its gap.

1210 pad centres: ±1.475 mm; land size: 1.15 × 2.7 mm with rounded corners; centre spacing: 2.95 mm; nominal inner pad-edge gap: 1.80 mm. Confirm these lands against the actual capacitor body/termination drawing.

The board has a circular carrier and 20 mm feed tab. The carrier extends 5 mm radially beyond outer loop copper. Carrier size and feed tab are implementation choices. No mounting holes were specified or invented.

Front mask openings expose the loop arcs and necks. There is no copper pour/ground plane under the loop. B.Cu contains connector annuli only. Do not leave an unmodelled continuous back copper sheet on double-clad lab stock.

## Candidate SMA

J1 derives from KiCad's **SMA_Amphenol_132134_Vertical**:

| Feature | Nominal layout |
|---|---|
| Centre contact | Pin 1 at (0,0) |
| Shield contacts | Four pin-2 pads at (±2.54,±2.54) mm |
| Centre drill / pad diameter | 1.50 / 2.05 mm |
| Shield drill / pad diameter | 1.70 / 2.25 mm |
| Body fab outline | 7 × 7 mm |
| Courtyard | 8.34 × 8.34 mm |

This is **not a universal SMA footprint**. If the supplied SMA is edge-mount, right-angle or has different pin spacing, replace J1 and revise the feed. Mechanical footprint selection does not establish magnetic properties or MRI suitability. The supplied STEP review contains the PCB and capacitors only: J1 has no included 3D body model, so this export must not be used to assess connector height or enclosure clearance.

The footprint uses through-hole semantics. LPKF prototype holes may not be plated. The supervisor must choose the soldering/grounding arrangement; do not assume plated interlayer continuity. Every required route is on front copper.

## Stackup and fabrication

Provisional nominal 1.6 mm FR4 stackup: 0.035 mm front copper, 1.53 mm dielectric, 0.035 mm back copper. Only connector annuli are patterned on the back. Soldermask coating metadata is outside nominal laminate/copper thickness.

FR4, dielectric constant 4.5, loss tangent 0.02 and 1.6 mm thickness are assumptions, not source requirements or measured material properties. Enter actual stock data before modelling.

CAD minimum copper clearance is 0.25 mm; minimum copper-to-edge clearance is 0.5 mm. These are design choices, not a certified LPKF process capability.

Gerber X2 exports include F.Cu, B.Cu, F.Mask, B.Mask, F.SilkS and Edge.Cuts. The compatibility RS-274X set includes F.Cu and separate Edge.Cuts, without X2/net metadata or aperture macros. Excellon drilling is metric. Coordinates are not mirrored and all exports share the same board reference.

LPKF scale, layer interpretation, copper-removal strategy, drilling, substrate and laser/tool settings require the supervisor. Edge.Cuts is mechanical geometry, not another copper layer. No machine programs or laser parameters are included.

## Validation coverage and limits

The cloud workflow uses native KiCad to load the files, export a netlist, compare it with actual board pads, and run ERC and DRC with schematic parity. Independent assertions read the board back and check arc count, width, circle/radius, capacitor positions and spacing, pad dimensions, front-only routes, absence of zones, and drill sizes.

No DRC exclusions or deliberately ignored electrical errors are used. A checked ZIP is emitted only if every command and assertion succeeds. Full reports retain warnings.

These checks cannot prove resonance, Q, efficiency, matching range, component RF loss, magnetic properties, heating, transmit detuning, scanner compatibility, fit of an unspecified connector, or safe MRI operation.

## Scope

This is the KiCad task only. It does not perform fabrication, VNA measurements, phantom loading, scanner measurements or the evaluation protocol. The board is not cleared for scanner connection or human use.

# Sources and attribution

1210 land and candidate SMA geometry derive from the KiCad community library:

- https://github.com/KiCad/kicad-footprints/blob/master/Capacitor_SMD.pretty/C_1210_3225Metric.kicad_mod — source blob 60e9dd5ca4352ca93f673d3b415b520eb44ad07f.
- https://github.com/KiCad/kicad-footprints/blob/master/Connector_Coaxial.pretty/SMA_Amphenol_132134_Vertical.kicad_mod — source blob e4c8aadcd774d8e6bdfe1ada9ba126eee320ebdc.
- https://www.amphenolrf.com/en-us/part/132134/662/ — candidate connector manufacturer.
- https://www.kicad.org/download/docker/ — official containers.
- https://docs.kicad.org/9.0/en/cli/cli.html — native CLI.
- https://dev-docs.kicad.org/en/file-formats/ — native formats.

Project footprints retain the cited land dimensions, add project-local model paths and use modern syntax. Board instances have project-specific text/placement. Component STEP models, when available, come from the official pinned KiCad image.

## KiCad library license

KiCad libraries are licensed under CC-BY-SA 4.0:
https://creativecommons.org/licenses/by-sa/4.0/legalcode

KiCad exception:

“To the extent that the creation of electronic designs that use 'Licensed Material' can be considered to be 'Adapted Material', then the copyright holder waives article 3 of the license with respect to these designs and any generated files which use data provided as part of the 'Licensed Material'.”

Redistributed library collections remain subject to the license. Included derived footprints and copied component models remain under CC-BY-SA 4.0 with this exception. Attribution: KiCad library contributors.

Original license:
https://github.com/KiCad/kicad-footprints/blob/master/LICENSE.md

The course handout is not redistributed. Its construction requirements are paraphrased to document design inputs; no ownership of that handout is claimed.

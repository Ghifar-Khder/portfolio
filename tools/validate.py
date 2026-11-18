#!/usr/bin/env python3
"""Native checks in the online KiCad container. CAD checks do not validate RF."""
from pathlib import Path
import os, sys, json, math, subprocess, shutil, hashlib, zipfile, datetime, xml.etree.ElementTree as ET
import pcbnew
ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
Path(os.environ.get("HOME","/tmp/kicad-home")).mkdir(parents=True,exist_ok=True)
Path(os.environ.get("KICAD_CONFIG_HOME","/tmp/kicad-config")).mkdir(parents=True,exist_ok=True)
REPORTS=ROOT/"validation"
REPORTS.mkdir(exist_ok=True)
commands=[]; errors=[]; checks=[]; models=[]
def run(args):
    cp=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    commands.append({"argv":args,"returncode":cp.returncode,"output":cp.stdout})
    print("$ "+" ".join(args),flush=True)
    print(cp.stdout,flush=True)
    if cp.returncode: errors.append("Command failed: "+" ".join(args))
    return cp
def check(name,condition,details=None):
    checks.append({"check":name,"passed":bool(condition),"details":details})
    if not condition: errors.append(name)
    print(("PASS " if condition else "FAIL ")+name,flush=True)
def mm(v): return pcbnew.ToMM(v)
def xy(v): return [mm(v.x),mm(v.y)]
def circ(a,b,c):
    ax,ay=a; bx,by=b; cx,cy=c
    d=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
    ux=((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/d
    uy=((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/d
    return [ux,uy,math.hypot(ax-ux,ay-uy)]
version=run(["kicad-cli","version"]).stdout.strip()
for d in sorted((ROOT/"projects").iterdir()):
    if not d.is_dir(): continue
    out=d/"exports"; gerber=out/"gerber_review"; legacy=out/"lpkf_rs274x_review"; preview=out/"preview"; checkdir=REPORTS/d.name
    for p in [out,gerber,legacy,preview,checkdir,d/"3dmodels"]: p.mkdir(parents=True,exist_ok=True)
    (out/"assembly_review.step").unlink(missing_ok=True)
    manifest=json.loads((d/"design_manifest.json").read_text())
    boardfile=d/"rx_coil_3t.kicad_pcb"; sch=d/"rx_coil_3t.kicad_sch"
    for family,stem in [("Capacitor_SMD","C_1210_3225Metric")]:
        candidates=[Path("/usr/share/kicad/3dmodels")/(family+".3dshapes")/(stem+".step"),Path("/usr/share/kicad/packages3d")/(family+".3dshapes")/(stem+".step")]
        found=next((p for p in candidates if p.is_file()),None)
        if found:
            shutil.copyfile(found,d/"3dmodels"/(stem+".step"))
            models.append(str((d/"3dmodels"/(stem+".step")).relative_to(ROOT)))
        else: print("Optional 3D model not found: "+stem,flush=True)
    b=pcbnew.LoadBoard(str(boardfile))
    check(d.name+": native PCB parser",b is not None)
    if b is None: continue
    fps={f.GetReference():f for f in b.GetFootprints()}
    check(d.name+": five physical components",set(fps)=={"C1","C2","C3","C4","J1"},sorted(fps))
    pinmap={}
    for ref,fp in fps.items():
        pinmap[ref]={}
        for p in fp.Pads():
            net=str(p.GetNetname()); num=str(p.GetNumber())
            if num in pinmap[ref]: check(d.name+f": repeated {ref}.{num} shield pads share net",pinmap[ref][num]==net)
            pinmap[ref][num]=net
    check(d.name+": PCB pin net mapping",pinmap==manifest["expected_pin_nets"],pinmap)
    check(d.name+": no copper zones or ground plane",len(list(b.Zones()))==0)
    tracks=list(b.GetTracks())
    check(d.name+": routed conductors on front copper only",all(t.GetLayer()==pcbnew.F_Cu for t in tracks))
    arcs=[t for t in tracks if t.GetClass()=="PCB_ARC"]
    check(d.name+": exactly three circular conductor arcs",len(arcs)==3)
    actual=[]
    for t in arcs:
        vals=circ(xy(t.GetStart()),xy(t.GetMid()),xy(t.GetEnd()))
        actual.append({"net":str(t.GetNetname()),"centre_x_mm":vals[0],"centre_y_mm":vals[1],"radius_mm":vals[2],"width_mm":mm(t.GetWidth())})
        check(d.name+": arc centre and radius",abs(vals[0]-100)<.002 and abs(vals[1]-100)<.002 and abs(vals[2]-manifest["geometry"]["centerline_diameter_mm"]/2)<.002,vals)
        check(d.name+": 5.000 mm conductor width",abs(mm(t.GetWidth())-5)<.00001)
    r=manifest["geometry"]["centerline_diameter_mm"]/2; angles=[]
    for ref in ["C1","C2","C3"]:
        p=xy(fps[ref].GetPosition()); a=math.degrees(math.atan2(p[1]-100,p[0]-100))%360; angles.append(a)
        target=manifest["geometry"]["capacitor_angles_deg"][ref]
        check(d.name+f": {ref} radius and angle",abs(math.hypot(p[0]-100,p[1]-100)-r)<.002 and abs(((a-target+180)%360)-180)<.002,{"position":p,"angle":a})
        for pad in fps[ref].Pads(): check(d.name+f": {ref}.{pad.GetNumber()} land dimensions",abs(mm(pad.GetSize().x)-1.15)<.00001 and abs(mm(pad.GetSize().y)-2.7)<.00001)
    angles.sort(); spacing=[(angles[(i+1)%3]-angles[i])%360 for i in range(3)]
    check(d.name+": 120-degree spacing",all(abs(x-120)<.002 for x in spacing),spacing)
    holes=sorted(round(mm(p.GetDrillSize().x),3) for p in fps["J1"].Pads())
    check(d.name+": connector hole schedule",holes==[1.5,1.7,1.7,1.7,1.7],holes)
    pcbnew.SaveBoard(str(boardfile),b)
    run(["kicad-cli","fp","upgrade","--force",str(d/"CoilParts.pretty")])
    nf=checkdir/"schematic.net.xml"
    cp=run(["kicad-cli","sch","export","netlist","--format","kicadxml","--output",str(nf),str(sch)])
    if cp.returncode==0:
        schmap={}
        for net in ET.parse(nf).getroot().findall("./nets/net"):
            for node in net.findall("node"): schmap.setdefault(node.attrib["ref"],{})[node.attrib["pin"]]=net.attrib["name"]
        check(d.name+": schematic-to-PCB explicit netlist comparison",schmap==pinmap,schmap)
    run(["kicad-cli","sch","erc","--format","json","--severity-all","--exit-code-violations","--output",str(checkdir/"erc.json"),str(sch)])
    run(["kicad-cli","pcb","drc","--schematic-parity","--format","json","--severity-all","--exit-code-violations","--output",str(checkdir/"drc.json"),str(boardfile)])
    run(["kicad-cli","sch","export","svg","--output",str(preview)+"/",str(sch)])
    run(["kicad-cli","pcb","export","svg","--layers","F.Cu,F.SilkS,Edge.Cuts","--page-size-mode","2","--exclude-drawing-sheet","--mode-single","--black-and-white","--output",str(preview/"pcb_top.svg"),str(boardfile)])
    run(["kicad-cli","pcb","export","svg","--layers","F.Cu,Edge.Cuts","--page-size-mode","2","--exclude-drawing-sheet","--mode-single","--black-and-white","--output",str(preview/"front_copper.svg"),str(boardfile)])
    run(["kicad-cli","pcb","export","gerbers","--layers","F.Cu,B.Cu,F.Mask,B.Mask,F.SilkS,Edge.Cuts","--output",str(gerber)+"/",str(boardfile)])
    run(["kicad-cli","pcb","export","gerbers","--layers","F.Cu,Edge.Cuts","--no-x2","--no-netlist","--disable-aperture-macros","--output",str(legacy)+"/",str(boardfile)])
    run(["kicad-cli","pcb","export","drill","--format","excellon","--excellon-units","mm","--generate-map","--map-format","gerberx2","--output",str(gerber)+"/",str(boardfile)])
    for p in gerber.glob("*.drl"): shutil.copyfile(p,legacy/p.name)
    run(["kicad-cli","pcb","export","pos","--format","csv","--units","mm","--side","front","--output",str(out/"placement_front.csv"),str(boardfile)])
    step_result=run(["kicad-cli","pcb","export","step","--force","--subst-models","--output",str(out/"pcb_and_capacitors_review.step"),str(boardfile)])
    check(d.name+": no missing 3D references", "File not found:" not in step_result.stdout and "Could not add 3D model" not in step_result.stdout)
    (checkdir/"geometry.json").write_text(json.dumps({"arc_geometry":actual,"capacitor_spacing_deg":spacing,"pcb_pin_nets":pinmap},indent=2)+"\n")
    (out/"READ_BEFORE_FABRICATION.txt").write_text(
      "REVIEW EXPORTS - NOT A FABRICATION RELEASE\n"
      "Select the diameter convention; confirm SMA, substrate and matching topology.\n"
      "Front copper is 35 um. No back-plane under loop; B.Cu has connector annuli only.\n"
      "Laser structuring: front copper, separate outline, appropriate drilling information.\n"
      "RS-274X set omits X2/net metadata and disables aperture macros.\n"
      "LPKF supervisor must set scale, layer interpretation, drilling and laser parameters.\n"
      "5 pF is initial only; no resonance, S11 or scanner safety validation is claimed.\n")
summary={"status":"PASS" if not errors else "FAIL","kicad_version":version,"source_commit":os.environ.get("BUILD_COMMIT","unknown"),
         "generated_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),"checks":checks,"errors":errors,
         "rf_performance_validated":False,"fabrication_release":False,"models_included":models,
         "limitations":["Diameter convention and lab SMA unconfirmed","Nominal 1.6 mm FR4 is provisional","RF performance and MR safety are not validated by ERC/DRC"]}
(REPORTS/"summary.json").write_text(json.dumps(summary,indent=2)+"\n")
(REPORTS/"commands.json").write_text(json.dumps(commands,indent=2)+"\n")
(REPORTS/"STATUS.md").write_text("# KiCad validation: "+summary["status"]+"\n\nKiCad: "+version+"\n\nSource commit: "+summary["source_commit"]+"\n\n"
    +f"{sum(c['passed'] for c in checks)}/{len(checks)} geometry/netlist assertions passed.\n\n"
    +"Native ERC/DRC command outcomes are in commands.json; diagnostics are in each variant folder.\n\n"
    +"RF performance, MRI safety and fabrication release remain unvalidated.\n\n"
    +("\n".join("- "+e for e in errors) if errors else "No failed commands or assertions.")+"\n")
dist=ROOT/"dist"; dist.mkdir(exist_ok=True); zp=dist/"3T_Receive_Coil_KiCad.zip"
if zp.exists(): zp.unlink()
if not errors:
    included=[]
    for base in ["projects","validation","tools",".github"]: included.extend(p for p in (ROOT/base).rglob("*") if p.is_file() and not p.name.endswith((".lck",".bak",".kicad_prl")))
    included.extend(ROOT/p for p in ["README.md","DESIGN_NOTES.md","THIRD_PARTY_NOTICES.md"] if (ROOT/p).exists())
    hashes={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in included}
    (dist/"SHA256SUMS.json").write_text(json.dumps(hashes,indent=2)+"\n")
    with zipfile.ZipFile(zp,"w",zipfile.ZIP_DEFLATED) as z:
        for p in included: z.write(p,str(p.relative_to(ROOT)))
        z.write(dist/"SHA256SUMS.json","SHA256SUMS.json")
    print("Created "+str(zp),flush=True)
sys.exit(1 if errors else 0)

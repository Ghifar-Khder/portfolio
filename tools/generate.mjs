import fs from 'node:fs';
import path from 'node:path';
const generate = function generateCoilProjects() {
  const files = {};
  const q = s => JSON.stringify(String(s));
  const f = n => String(Math.round(n * 1e6) / 1e6);
  const netNames = ["", "GND", "LOOP_MID", "LOOP_FEED", "RF_IN"];
  const expected = {
    C1: {1:"GND",2:"LOOP_MID"}, C2:{1:"LOOP_MID",2:"LOOP_FEED"},
    C3:{1:"LOOP_FEED",2:"GND"}, C4:{1:"RF_IN",2:"LOOP_FEED"},
    J1:{1:"RF_IN",2:"GND"}
  };
  const ef = (size=1.27, hide=false) => `(effects (font (size ${size} ${size}))${hide?" hide":""})`;
  const capDef = (name) => `(symbol ${q(name)}
    (pin_names (offset 0)) (in_bom yes) (on_board yes)
    (property "Reference" "C" (at 2.54 1.27 0) ${ef()})
    (property "Value" "Capacitor_1210" (at 2.54 -1.27 0) ${ef()})
    (property "Footprint" "CoilParts:C_1210_3225Metric" (at 0 0 0) ${ef(1.27,true)})
    (symbol "Capacitor_1210_0_1"
      (polyline (pts (xy -2.032 0.762) (xy 2.032 0.762)) (stroke (width 0.254) (type default)) (fill (type none)))
      (polyline (pts (xy -2.032 -0.762) (xy 2.032 -0.762)) (stroke (width 0.254) (type default)) (fill (type none))))
    (symbol "Capacitor_1210_1_1"
      (pin passive line (at 0 3.81 270) (length 3.048) (name "~" ${ef()}) (number "1" ${ef()}))
      (pin passive line (at 0 -3.81 90) (length 3.048) (name "~" ${ef()}) (number "2" ${ef()}))))`;
  const smaDef = (name) => `(symbol ${q(name)}
    (pin_names (offset 0.508)) (in_bom yes) (on_board yes)
    (property "Reference" "J" (at 0 6.35 0) ${ef()})
    (property "Value" "SMA_132134" (at 0 -6.35 0) ${ef()})
    (property "Footprint" "CoilParts:SMA_Amphenol_132134_Vertical" (at 0 0 0) ${ef(1.27,true)})
    (symbol "SMA_132134_0_1"
      (rectangle (start -2.54 3.81) (end 7.62 -3.81) (stroke (width 0.254) (type default)) (fill (type background))))
    (symbol "SMA_132134_1_1"
      (pin passive line (at -7.62 2.54 0) (length 5.08) (name "SIG" ${ef(1)}) (number "1" ${ef()}))
      (pin passive line (at -7.62 -2.54 0) (length 5.08) (name "SHIELD" ${ef(1)}) (number "2" ${ef()}))))`;
  const library = `(kicad_symbol_lib (version 20231120) (generator coil_project_generator)\n${capDef("Capacitor_1210")}\n${smaDef("SMA_132134")}\n)\n`;
  const fpLine = (a,b,layer,width) => `(fp_line (start ${a.map(f).join(" ")}) (end ${b.map(f).join(" ")}) (stroke (width ${width}) (type solid)) (layer ${q(layer)}))`;
  function capBody(angle=0, nets=null, model=true) {
    let s = `(descr "1210 / 3225 metric; nominal KiCad IPC-7351 lands; derived from KiCad library") (tags "capacitor 1210 3225") (attr smd)\n`;
    for(const [a,b] of [
      [[-1.6,-1.25],[1.6,-1.25]],[[1.6,-1.25],[1.6,1.25]],
      [[1.6,1.25],[-1.6,1.25]],[[-1.6,1.25],[-1.6,-1.25]]
    ]) s+=fpLine(a,b,"F.Fab",0.1)+"\n";
    s+=fpLine([-.711252,-1.36],[.711252,-1.36],"F.SilkS",.12)+"\n";
    s+=fpLine([-.711252,1.36],[.711252,1.36],"F.SilkS",.12)+"\n";
    for(const [a,b] of [
      [[-2.3,-1.6],[2.3,-1.6]],[[2.3,-1.6],[2.3,1.6]],
      [[2.3,1.6],[-2.3,1.6]],[[-2.3,1.6],[-2.3,-1.6]]
    ]) s+=fpLine(a,b,"F.CrtYd",.05)+"\n";
    for(let p=1;p<=2;p++) s+=`(pad "${p}" smd roundrect (at ${p===1?-1.475:1.475} 0 ${f(angle)}) (size 1.15 2.7) (layers "F.Cu" "F.Paste" "F.Mask") (roundrect_rratio 0.217391)${nets?` (net ${netNames.indexOf(nets[p])} ${q(nets[p])})`:""})\n`;
    if(model) s+=`(model "\${KIPRJMOD}/3dmodels/C_1210_3225Metric.step" (offset (xyz 0 0 0)) (scale (xyz 1 1 1)) (rotate (xyz 0 0 0)))\n`;
    return s;
  }
  function smaBody(nets=null, model=false) {
    let s=`(descr "Candidate connector: Amphenol RF 132134; verify actual lab connector before fabrication") (tags "SMA THT vertical") (attr through_hole)\n`;
    s+=`(fp_circle (center 0 0) (end 3.175 0) (stroke (width 0.1) (type solid)) (fill none) (layer "F.Fab"))\n`;
    for(const [a,b] of [
      [[-3.5,-3.5],[3.5,-3.5]],[[3.5,-3.5],[3.5,3.5]],[[3.5,3.5],[-3.5,3.5]],[[-3.5,3.5],[-3.5,-3.5]]
    ]) s+=fpLine(a,b,"F.Fab",.1)+"\n";
    for(const [a,b] of [
      [[-4.17,-4.17],[4.17,-4.17]],[[4.17,-4.17],[4.17,4.17]],
      [[4.17,4.17],[-4.17,4.17]],[[-4.17,4.17],[-4.17,-4.17]]
    ]) s+=fpLine(a,b,"F.CrtYd",.05)+"\n";
    for(const [a,b] of [
      [[-3.68,-1.8],[-3.68,1.8]],[[3.68,-1.8],[3.68,1.8]],
      [[-1.8,-3.68],[1.8,-3.68]],[[-1.8,3.68],[1.8,3.68]]
    ]) s+=fpLine(a,b,"F.SilkS",.12)+"\n";
    const pads=[[1,0,0,2.05,1.5],[2,-2.54,-2.54,2.25,1.7],[2,2.54,-2.54,2.25,1.7],[2,-2.54,2.54,2.25,1.7],[2,2.54,2.54,2.25,1.7]];
    for(const [p,x,y,d,h] of pads) s+=`(pad "${p}" thru_hole circle (at ${x} ${y}) (size ${d} ${d}) (drill ${h}) (layers "*.Cu" "*.Mask")${nets?` (net ${netNames.indexOf(nets[p])} ${q(nets[p])})`:""})\n`;
    if(model) s+=`(model "\${KIPRJMOD}/3dmodels/SMA_Amphenol_132134_Vertical.step" (offset (xyz 0 0 0)) (scale (xyz 1 1 1)) (rotate (xyz 0 0 0)))\n`;
    return s;
  }
  const fpText=(kind,txt,x,y,angle=0,layer="F.SilkS",hide=false,size=1)=>`(fp_text ${kind} ${q(txt)} (at ${f(x)} ${f(y)} ${f(angle)}) (layer ${q(layer)})${hide?" hide":""} (effects (font (size ${size} ${size}) (thickness 0.15))))`;
  const capLib=`(footprint "C_1210_3225Metric" (version 20221018) (generator coil_project_generator) (layer "F.Cu")\n${fpText("reference","REF**",0,-2.3)}\n${fpText("value","C_1210_3225Metric",0,2.3,0,"F.Fab")}\n${capBody()})\n`;
  const smaLib=`(footprint "SMA_Amphenol_132134_Vertical" (version 20221018) (generator coil_project_generator) (layer "F.Cu")\n${fpText("reference","REF**",0,-4.75)}\n${fpText("value","SMA_Amphenol_132134_Vertical",0,5,0,"F.Fab")}\n${smaBody()})\n`;

  for(const [vi,variant] of [{key:"outer_75mm",r:35,meaning:"75 mm OUTER copper diameter"},{key:"centerline_75mm",r:37.5,meaning:"75 mm CENTRELINE diameter"}].entries()) {
    let id=0;
    const uid=()=>`ba75c01${vi}-0000-4000-8000-${(++id).toString(16).padStart(12,"0")}`;
    const root=uid(), syms={}; for(const ref of Object.keys(expected)) syms[ref]=uid();
    const name="rx_coil_3t", dir="projects/"+variant.key, r=variant.r, cy=100+r, rb=r+7.5;
    const polar=(radius,deg)=>[100+radius*Math.cos(deg*Math.PI/180),100+radius*Math.sin(deg*Math.PI/180)];
    const capPlacements=[
      {ref:"C1",theta:210},{ref:"C2",theta:330},{ref:"C3",theta:90}
    ].map(a=>({...a,p:polar(r,a.theta),angle:(-a.theta-90+720)%360}));
    capPlacements.push({ref:"C4",p:[100,cy+8],angle:90});
    const comp = capPlacements.map(a=>({...a,value:"5pF",footprint:"CoilParts:C_1210_3225Metric"}));
    comp.push({ref:"J1",p:[100,cy+19],angle:0,value:"SMA_132134",footprint:"CoilParts:SMA_Amphenol_132134_Vertical"});
    let sch=`(kicad_sch (version 20231120) (generator coil_project_generator) (uuid ${root}) (paper "A4")\n(title_block (title "3T MRI Receive Coil - 123.26 MHz target") (date "2026-11-18") (rev "A.1") (comment 1 ${q(variant.meaning)}) (comment 2 "Bench prototype: geometry / SMA / substrate require lab confirmation"))\n(lib_symbols ${capDef("CoilParts:Capacitor_1210")}\n${smaDef("CoilParts:SMA_132134")})\n`;
    const text=(t,x,y,size=1.27)=>`(text ${q(t)} (at ${x} ${y} 0) (effects (font (size ${size} ${size})) (justify left bottom)) (uuid ${uid()}))\n`;
    const wire=(a,b)=>`(wire (pts (xy ${a.join(" ")}) (xy ${b.join(" ")})) (stroke (width 0) (type default)) (uuid ${uid()}))\n`;
    const routes=[
      [[80.01,66.04],[60.96,66.04],[60.96,106.68],[60.96,116.84],[92.71,116.84]],
      [[87.63,66.04],[132.08,66.04],[132.08,80.01]],
      [[132.08,87.63],[132.08,93.98],[132.08,99.06],[132.08,116.84],[100.33,116.84]],
      [[132.08,99.06],[148.59,99.06]],
      [[156.21,99.06],[163.83,99.06],[170.18,99.06]],
      [[170.18,104.14],[166.37,104.14],[166.37,127],[60.96,127],[60.96,116.84]]
    ];
    for(const route of routes) for(let i=1;i<route.length;i++)sch+=wire(route[i-1],route[i]);
    for(const p of [[60.96,116.84],[132.08,99.06]]) sch+=`(junction (at ${p.join(" ")}) (diameter 0) (color 0 0 0 0) (uuid ${uid()}))\n`;
    for(const [n,x,y] of [["GND",60.96,106.68],["LOOP_MID",109.22,66.04],["LOOP_FEED",132.08,93.98],["RF_IN",163.83,99.06]])
      sch+=`(global_label "${n}" (shape passive) (at ${x} ${y} 0) (effects (font (size 1.27 1.27)) (justify left bottom)) (uuid ${uid()}))\n`;
    const spos={C1:[83.82,66.04,90],C2:[132.08,83.82,0],C3:[96.52,116.84,270],C4:[152.4,99.06,270],J1:[177.8,101.6,0]};
    for(const c of comp) {
      const [x,y,a]=spos[c.ref], isJ=c.ref==="J1";
      const posRef=isJ?[x+2.54,y-7.62]:[x+(a===0?7.62:0),y-5.08];
      const posVal=isJ?[x+2.54,y+7.62]:[x+(a===0?7.62:0),y-2.54];
      sch+=`(symbol (lib_id ${q("CoilParts:"+(isJ?"SMA_132134":"Capacitor_1210"))}) (at ${x} ${y} ${a}) (unit 1) (in_bom yes) (on_board yes) (dnp no) (uuid ${syms[c.ref]})
       (property "Reference" ${q(c.ref)} (at ${posRef.join(" ")} 0) ${ef()})
       (property "Value" ${q(c.value)} (at ${posVal.join(" ")} 0) ${ef()})
       (property "Footprint" ${q(c.footprint)} (at ${x} ${y} 0) ${ef(1.27,true)})
       (property "Datasheet" ${q(isJ?"https://www.amphenolrf.com/en-us/part/132134/662/":"")} (at ${x} ${y} 0) ${ef(1.27,true)})
       (property "Role" ${q({C1:"Distributed capacitor",C2:"Distributed capacitor",C3:"Distributed tuning capacitor",C4:"Series matching capacitor",J1:"Candidate footprint; lab part not specified"}[c.ref])} (at ${x} ${y} 0) ${ef(1.27,true)})
       (pin "1" (uuid ${uid()})) (pin "2" (uuid ${uid()}))
       (instances (project "${name}" (path "/${root}" (reference ${q(c.ref)}) (unit 1)))))\n`;
    }
    sch+=text("THREE DISTRIBUTED CAPACITORS",60.96,48.26,2);
    sch+=text("C1, C2 and C3 lie 120 deg apart on the physical loop.",60.96,54.61);
    sch+=text("Copper arcs provide the loop inductance.",73.66,85.09);
    sch+=text("Wires here denote PCB connectivity;",73.66,90.17);
    sch+=text("they are not a lumped RF simulation model.",73.66,95.25);
    sch+=text("C3: tuning branch",85.09,124.46);
    sch+=text("C4: series match",144.78,88.9);
    sch+=text("J1: 50 ohm measurement port",190.5,99.06);
    sch+=text("1 = centre contact; 2 = shield",190.5,104.14);
    sch+=text("DESIGN AND ASSEMBLY NOTES",25.4,143.51,1.8);
    const notes=[
      "C1-C3: 1210 (3.2 x 2.5 mm), starting value 5 pF per handout. C4: 1210, provisional 5 pF start.",
      "5 pF is NOT a final resonant design value. Distributed values may also need increasing during tuning.",
      "Target: 123.26 MHz under the prescribed load. S11 < -20 dB is a measured acceptance target, not a CAD result.",
      variant.meaning+`; trace centreline ${2*r} mm; outer ${2*r+5} mm; inner ${2*r-5} mm; 5 mm trace; 35 um front copper.`,
      "Board/substrate assumption: nominal 1.6 mm FR4; no ground plane under the loop; SMA model is a candidate.",
      "Matching topology is a proposed implementation. Confirm it and the supplied SMA before manufacturing.",
      "No transmit detuning, preamplifier protection or scanner interface is included. Bench prototype only."
    ];
    notes.forEach((n,i)=>sch+=text(n,25.4,149.86+i*5.08,1.15));
    sch+=`(sheet_instances (path "/" (page "1")))\n)\n`;
    files[`${dir}/${name}.kicad_sch`]=sch;
    files[`${dir}/CoilParts.kicad_sym`]=library;
    files[`${dir}/sym-lib-table`]='(sym_lib_table (version 7) (lib (name "CoilParts") (type "KiCad") (uri "${KIPRJMOD}/CoilParts.kicad_sym") (options "") (descr "Project-local symbols")))\n';
    files[`${dir}/fp-lib-table`]='(fp_lib_table (version 7) (lib (name "CoilParts") (type "KiCad") (uri "${KIPRJMOD}/CoilParts.pretty") (options "") (descr "Project-local 1210 and candidate SMA lands")))\n';
    files[`${dir}/CoilParts.pretty/C_1210_3225Metric.kicad_mod`]=capLib;
    files[`${dir}/CoilParts.pretty/SMA_Amphenol_132134_Vertical.kicad_mod`]=smaLib;

    let pcb=`(kicad_pcb (version 20221018) (generator coil_project_generator)
      (general (thickness 1.6)) (paper "A4")
      (title_block (title "3T receive loop - 123.26 MHz target") (date "2026-11-18") (rev "A.1") (comment 1 ${q(variant.meaning)}) (comment 2 "BENCH PROTOTYPE - READ DESIGN_NOTES.md"))
      (layers (0 "F.Cu" signal) (31 "B.Cu" signal)
       (34 "B.Paste" user) (35 "F.Paste" user) (36 "B.SilkS" user) (37 "F.SilkS" user)
       (38 "B.Mask" user) (39 "F.Mask" user) (40 "Dwgs.User" user "User.Drawings") (41 "Cmts.User" user "User.Comments")
       (44 "Edge.Cuts" user) (45 "Margin" user) (46 "B.CrtYd" user "B.Courtyard") (47 "F.CrtYd" user "F.Courtyard")
       (48 "B.Fab" user) (49 "F.Fab" user))
      (setup (stackup
       (layer "F.SilkS" (type "Top Silk Screen")) (layer "F.Paste" (type "Top Solder Paste"))
       (layer "F.Mask" (type "Top Solder Mask") (thickness 0.01))
       (layer "F.Cu" (type "copper") (thickness 0.035))
       (layer "dielectric 1" (type "core") (thickness 1.53) (material "FR4") (epsilon_r 4.5) (loss_tangent 0.02))
       (layer "B.Cu" (type "copper") (thickness 0.035))
       (layer "B.Mask" (type "Bottom Solder Mask") (thickness 0.01))
       (layer "B.Paste" (type "Bottom Solder Paste")) (layer "B.SilkS" (type "Bottom Silk Screen"))
       (copper_finish "None") (dielectric_constraints no))
       (pad_to_mask_clearance 0.05) (solder_mask_min_width 0.1))
      ${netNames.map((n,i)=>`(net ${i} ${q(n)})`).join("\n")}\n`;
    const footprints=[];
    for(const c of comp) {
      let rx=0, ry=-4.1;
      if(c.ref==="C4"){rx=4;ry=0;} else if(c.ref==="J1"){rx=0;ry=5.8;} else {const pr=polar(r+5,c.theta);rx=pr[0]-c.p[0];ry=pr[1]-c.p[1];}
      // Convert desired global text offset into footprint-local coordinates.
      const a=c.angle*Math.PI/180, tx=rx*Math.cos(a)-ry*Math.sin(a), ty=rx*Math.sin(a)+ry*Math.cos(a);
      let fp=`(footprint ${q(c.footprint)} (layer "F.Cu") (tstamp ${uid()}) (at ${c.p.map(f).join(" ")} ${c.angle})
        (path "/${root}/${syms[c.ref]}")
        ${fpText("reference",c.ref,tx,ty,0)}
        ${fpText("value",c.value,0,0,0,"F.Fab",true)}
        ${c.ref==="J1"?smaBody(expected[c.ref]):capBody(c.angle,expected[c.ref])})\n`;
      pcb+=fp; footprints.push({reference:c.ref,position_mm:c.p.map(v=>+f(v)),rotation_deg:c.angle,uuid:syms[c.ref],pins:expected[c.ref]});
    }
    const track=(a,b,width,net,mask=false)=>{
      pcb+=`(segment (start ${a.map(f).join(" ")}) (end ${b.map(f).join(" ")}) (width ${width}) (layer "F.Cu") (net ${netNames.indexOf(net)}) (tstamp ${uid()}))\n`;
      if(mask)pcb+=`(gr_line (start ${a.map(f).join(" ")}) (end ${b.map(f).join(" ")}) (stroke (width ${width+.1}) (type solid)) (layer "F.Mask") (tstamp ${uid()}))\n`;
    };
    const delta=Math.asin(5/r)*180/Math.PI, arcs=[];
    for(const [a,b,n,from,to] of [[90,210,"GND","C3","C1"],[210,330,"LOOP_MID","C1","C2"],[330,450,"LOOP_FEED","C2","C3"]]) {
      const s=polar(r,a+delta),m=polar(r,(a+b)/2),e=polar(r,b-delta);
      pcb+=`(arc (start ${s.map(f).join(" ")}) (mid ${m.map(f).join(" ")}) (end ${e.map(f).join(" ")}) (width 5) (layer "F.Cu") (net ${netNames.indexOf(n)}) (tstamp ${uid()}))\n`;
      pcb+=`(gr_arc (start ${s.map(f).join(" ")}) (mid ${m.map(f).join(" ")}) (end ${e.map(f).join(" ")}) (stroke (width 5.1) (type solid)) (layer "F.Mask") (tstamp ${uid()}))\n`;
      const padWorld=(ref,p)=>{
        const c=comp.find(x=>x.ref===ref),x=p===1?-1.475:1.475,aa=c.angle*Math.PI/180;
        return [c.p[0]+x*Math.cos(aa),c.p[1]-x*Math.sin(aa)];
      };
      track(padWorld(from,2),s,1,n,true);track(e,padWorld(to,1),1,n,true);
      arcs.push({net:n,start_deg:a+delta,end_deg:b-delta,radius_mm:r,width_mm:5,from:from+".2",to:to+".1"});
    }
    const copperRoutes=[
      ["RF_IN",.8,[[100,cy+19],[100,cy+9.475]]],
      ["LOOP_FEED",1,[[100,cy+6.525],[104,cy+6.525],[104,cy],[101.475,cy]]],
      ["GND",1,[[98.525,cy],[95,cy+5],[95,cy+16.46],[97.46,cy+16.46]]],
      ["GND",1,[[95,cy+16.46],[95,cy+23],[105,cy+23],[105,cy+16.46],[102.54,cy+16.46]]],
      ["GND",1,[[97.46,cy+21.54],[97.46,cy+23]]],
      ["GND",1,[[102.54,cy+21.54],[102.54,cy+23]]]
    ];
    for(const [n,w,pts] of copperRoutes)for(let i=1;i<pts.length;i++)track(pts[i-1],pts[i],w,n);
    const grLine=(a,b,layer="Edge.Cuts",width=.05)=>{pcb+=`(gr_line (start ${a.map(f).join(" ")}) (end ${b.map(f).join(" ")}) (stroke (width ${width}) (type solid)) (layer ${q(layer)}) (tstamp ${uid()}))\n`;};
    const grText=(txt,p,size=1,layer="F.SilkS")=>{pcb+=`(gr_text ${q(txt)} (at ${p.map(f).join(" ")}) (layer ${q(layer)}) (tstamp ${uid()}) (effects (font (size ${size} ${size}) (thickness ${Math.min(.18,size*.15)}))))\n`;};
    const joinY=100+Math.sqrt(rb*rb-100), endY=cy+29;
    pcb+=`(gr_arc (start 90 ${f(joinY)}) (mid 100 ${f(100-rb)}) (end 110 ${f(joinY)}) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (tstamp ${uid()}))\n`;
    grLine([110,joinY],[110,endY]);grLine([110,endY],[90,endY]);grLine([90,endY],[90,joinY]);
    grText("3T RECEIVE COIL",[100,88.5],1.5);grText("123.26 MHz TARGET",[100,92],1);
    grText(vi===0?"75 mm OUTER / 5 mm TRACE":"75 mm CENTRE / 5 mm TRACE",[100,96],.95);
    grText("35 um FRONT Cu / REV A.1",[100,99.5],.9);
    grText("5 pF START ONLY",[100,103],.9);grText("BENCH PROTOTYPE",[100,107],.9);
    const outer=r+2.5,dimY=100-rb-5;
    grLine([100-outer,100],[100-outer,dimY-1],"Dwgs.User",.1);
    grLine([100+outer,100],[100+outer,dimY-1],"Dwgs.User",.1);
    grLine([100-outer,dimY],[100+outer,dimY],"Dwgs.User",.1);
    for(const x of [100-outer,100+outer])grLine([x-1,dimY+1],[x+1,dimY-1],"Dwgs.User",.1);
    grText(`${2*outer} mm NOMINAL OUTER COPPER`,[100,dimY-2.5],1.1,"Dwgs.User");
    pcb+=`(gr_circle (center 100 100) (end ${100+r} 100) (stroke (width 0.1) (type dash)) (fill none) (layer "Dwgs.User") (tstamp ${uid()}))\n`;
    grText(`Centreline D=${2*r} / Inner D=${2*r-5} / Width=5 mm`,[100,endY+4],1,"Dwgs.User");
    grText("C1/C2/C3: 120 deg spacing / 35 um copper",[100,endY+7],1,"Dwgs.User");
    grText("Candidate SMA 132134; substrate and diameter convention unconfirmed",[100,endY+10],.85,"Dwgs.User");
    pcb+=")\n";
    files[`${dir}/${name}.kicad_pcb`]=pcb;
    const pro={
      board:{design_settings:{
        rules:{min_clearance:.25,min_copper_edge_clearance:.5,min_hole_clearance:.25,min_track_width:.25,min_via_annular_width:.15,min_via_diameter:.6,min_through_hole_diameter:.3},
        drc_exclusions:[],rule_severities:{},track_widths:[0,.8,1,5],via_dimensions:[],diff_pair_dimensions:[],
        meta:{version:2}
      }},
      cvpcb:{},erc:{},libraries:{},meta:{filename:name+".kicad_pro",version:1},
      net_settings:{classes:[{name:"Default",clearance:.25,track_width:1,via_diameter:.8,via_drill:.4,microvia_diameter:.3,microvia_drill:.1,diff_pair_width:.2,diff_pair_gap:.25,diff_pair_via_gap:.25,wire_width:6,bus_width:12,line_style:0,pcb_color:"rgba(0, 0, 0, 0.000)",schematic_color:"rgba(0, 0, 0, 0.000)"}],meta:{version:3},net_colors:null,netclass_assignments:null,netclass_patterns:[]},
      pcbnew:{},schematic:{},text_variables:{DESIGN_STATUS:"BENCH PROTOTYPE - NOT RF VALIDATED",DIAMETER_CONVENTION:variant.meaning}
    };
    files[`${dir}/${name}.kicad_pro`]=JSON.stringify(pro,null,2)+"\n";
    const manifest={
      variant:variant.key,schematic_root_uuid:root,project:name,status:"CAD prototype; engineering confirmations and bench tuning outstanding",
      geometry:{diameter_meaning:variant.meaning,center_mm:[100,100],centerline_diameter_mm:2*r,outer_diameter_mm:2*r+5,inner_diameter_mm:2*r-5,track_width_mm:5,front_copper_thickness_mm:.035,capacitor_angles_deg:{C1:210,C2:330,C3:90},board_circle_diameter_mm:2*rb,feed_tab_width_mm:20,board_bottom_y_mm:endY,nominal_board_thickness_mm:1.6},
      components:footprints,loop_arcs:arcs,expected_pin_nets:expected,
      hole_schedule:[{diameter_mm:1.5,count:1,reference:"J1 centre"},{diameter_mm:1.7,count:4,reference:"J1 shield"}],
      assumptions:["Diameter convention must be selected before fabrication","1.6 mm FR4 is provisional","SMA Amphenol 132134 is a candidate, not a confirmed supplied part","C4 series match topology is a design proposal","5 pF values are assembly starting values, not final tuning values"],
      rf_validation:{target_hz:123260000,s11_target_db:-20,measured:false,detuning_included:false}
    };
    files[`${dir}/design_manifest.json`]=JSON.stringify(manifest,null,2)+"\n";
    files[`${dir}/BOM.csv`]='Reference,Quantity,Value,Package,Role,Selection_status\nC1,1,5 pF initial,1210 / 3225,Distributed capacitor,Final capacitance and RF-rated C0G part TBD\nC2,1,5 pF initial,1210 / 3225,Distributed capacitor,Final capacitance and RF-rated C0G part TBD\nC3,1,5 pF initial,1210 / 3225,Distributed tuning capacitor,Final capacitance and RF-rated C0G part TBD\nC4,1,5 pF provisional initial,1210 / 3225,Series matching capacitor,Added topology assumption; final value TBD\nJ1,1,SMA female 50 ohm,Amphenol 132134 vertical THT candidate,Measurement feed,Confirm supplied connector; not MRI-qualified by this design\n';
  }
  return files;
};
for (const [name, content] of Object.entries(generate())) { fs.mkdirSync(path.dirname(name), {recursive:true}); fs.writeFileSync(name,content); }

"""Rebuild the SJ-I160 import example with CadQuery 2.7 and ezdxf.

Illustrative web-handling idler, not a released manufacturing design.
All dimensions are millimetres. No hidden vendor geometry is included.
"""
from pathlib import Path
import math, json, zipfile
import cadquery as cq
import ezdxf

OUT = Path(__file__).resolve().parents[1] / 'public/samples'
OUT.mkdir(exist_ok=True)
parts = []
assembly = cq.Assembly(name='SJ-I160_Dead_Shaft_Web_Idler')

def ring(x, length, outer, inner=0):
    w = cq.Workplane('YZ', origin=(x,0,0)).circle(outer)
    if inner: w = w.circle(inner)
    return w.extrude(length)

def add(name, solid, color):
    assert solid.val().isValid(), name
    assembly.add(solid, name=name, color=cq.Color(*color))
    parts.append((name,solid))

silver=(.70,.76,.82); steel=(.43,.51,.60); blue=(.24,.39,.53); dark=(.15,.19,.23)
tube=ring(-350,700,80,72).edges('%CIRCLE').chamfer(.6)
add('01_AL6061_Hollow_Shell_D160_L700',tube,silver)
shaft=ring(-326,652,20)
for side in [-1,1]:
    shaft=shaft.union(ring(side*326,side*44,17.5)).union(ring(side*370,side*45,15))
add('02_S45C_Stationary_Stepped_Axle_L830',shaft,steel)

bolt_positions=[(55*math.cos(a*math.pi/2),55*math.sin(a*math.pi/2)) for a in range(4)]
for side,label in [(-1,'L'),(1,'R')]:
    # Removable end plug; nominal bearing bore. Fits remain a design-review item.
    plug=ring(323,27,72,21).cut(ring(326,24,36))
    cover=ring(350,6,80,25)
    for y,z in bolt_positions:
        hole=cq.Workplane('YZ',origin=(337,y,z)).circle(3.3).extrude(20)
        plug=plug.cut(hole);cover=cover.cut(hole)
    def orient(s): return s if side==1 else s.rotate((0,0,0),(0,0,1),180)
    add(f'03_{label}_Bearing_End_Plug',orient(plug),blue)
    add(f'04_{label}_Removable_End_Cover',orient(cover),steel)
    # 6207-size simplified cartridge: 35 x 72 x 17, not vendor raceway geometry.
    add(f'05_{label}_Bearing_Inner_Ring',orient(ring(326,17,23,17.5)),silver)
    add(f'06_{label}_Bearing_Outer_Ring',orient(ring(326,17,36,30)),silver)
    for i in range(10):
        theta=2*math.pi*i/10
        ball=cq.Workplane().sphere(3.5).translate((334.5,26.5*math.cos(theta),26.5*math.sin(theta)))
        add(f'07_{label}_Bearing_Ball_{i+1:02}',orient(ball),silver)
    for j,x in enumerate([326.25,342.25]):
        add(f'08_{label}_Bearing_Seal_{j+1}',orient(ring(x,.5,30,23)),dark)
    collar=ring(343,6,24,17.5)
    # Split indicates the clamp collar; screw thread is intentionally not modelled.
    collar=collar.cut(cq.Workplane().box(10,1,12).translate((346,0,22)))
    add(f'09_{label}_Split_Shaft_Collar',orient(collar),dark)
    for i,(y,z) in enumerate(bolt_positions):
        screw=ring(339,17,3).union(ring(356,6,5)).translate((0,y,z))
        socket=cq.Workplane('YZ',origin=(359,y,z)).polygon(6,5).extrude(4)
        add(f'10_{label}_M6_Cover_Screw_{i+1}',orient(screw.cut(socket)),dark)

assembly.export(str(OUT/'sj-i160-idler-assembly.step'))

# DXF is deliberately a single closed HALF SECTION of the hollow shell.
# It tests true hollow revolved geometry instead of flattening the assembly.
doc=ezdxf.new('R2010');doc.units=4
doc.layers.new('ROLL_PROFILE',dxfattribs={'color':7})
doc.layers.new('CENTER',dxfattribs={'color':4})
doc.layers.new('NOTES',dxfattribs={'color':8})
profile=[(-350,72.6),(-349.4,72),(349.4,72),(350,72.6),(350,79.4),(349.4,80),(-349.4,80),(-350,79.4)]
ms=doc.modelspace()
ms.add_lwpolyline(profile,close=True,dxfattribs={'layer':'ROLL_PROFILE'})
ms.add_line((-390,0),(390,0),dxfattribs={'layer':'CENTER'})
for i,t in enumerate(['SJ-I160 / HOLLOW SHELL HALF SECTION','OD 160 / ID 144 / FACE 700 / C0.6 / mm','Revolve 360 deg around X axis, Y=0','Import example only - see STEP for complete assembly']):
    ms.add_text(t,dxfattribs={'layer':'NOTES','height':8,'insert':(-350,118+i*14)})
doc.saveas(OUT/'sj-i160-shell-profile.dxf')

compound=cq.Compound.makeCompound([p.val() for _,p in parts])
b=compound.BoundingBox()
assert all(abs(v-e)<.01 for v,e in zip([b.xlen,b.ylen,b.zlen],[830,160,160]))
svg=cq.exporters.getSVG(compound,opts={'width':1400,'height':470,'marginLeft':35,'marginTop':25,'projectionDir':(1.4,-2.5,1.1),'showAxes':False,'showHidden':False,'strokeWidth':.6,'strokeColor':(40,61,82)})
(OUT/'sj-i160-assembly.svg').write_text(svg)
(OUT/'sj-i160-spec.json').write_text(json.dumps({'name':'SJ-I160 중공형 웹 가이드 롤','units':'mm','overall':830,'face':700,'outerDiameter':160,'innerDiameter':144,'bearingEnvelope':'35 x 72 x 17','parts':len(parts),'purpose':'CAD 업로드·구조 검토용 예제'},ensure_ascii=False,indent=2))
print(json.dumps({'parts':len(parts),'bounds':[b.xlen,b.ylen,b.zlen],'files':{p.name:p.stat().st_size for p in OUT.glob('sj-i160*')}},ensure_ascii=False))

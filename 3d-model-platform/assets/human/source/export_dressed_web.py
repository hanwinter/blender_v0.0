import bpy, json, sys, argparse
from pathlib import Path
root=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser()
parser.add_argument('--source-suffix',default='unclothed-interactive')
parser.add_argument('names',nargs='*')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
names=args.names or ['bodyFemale-realistic','bodyFemale-stylized','bodyMale-realistic','bodyMale-stylized']
ids=['head','torso','left_arm','right_arm','left_leg','right_leg','left_eye','right_eye']
report=[]
for name in names:
    bpy.ops.wm.open_mainfile(filepath=str(root/'assets/human/source'/(name+'-'+args.source_suffix+'.blend')))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    bpy.ops.object.select_all(action='DESELECT');exported=[];counts={key:0 for key in ids}
    for source in meshes:
        attr=source.data.attributes.get('human_part_index')
        if not attr:
            assert source.get('part_id') in ids,source.name
            source.select_set(True);exported.append(source);counts[source['part_id']]+=1
            continue
        source.data.update();normals=[v.normal.copy() for v in source.data.vertices]
        faces={key:[] for key in ids[:6]}
        for poly in source.data.polygons:
            index=attr.data[poly.index].value
            assert 0<=index<6
            faces[ids[index]].append(poly.index)
        for key,polys in faces.items():
            if not polys:continue
            used=sorted({v for i in polys for v in source.data.polygons[i].vertices});remap={v:i for i,v in enumerate(used)}
            mesh=bpy.data.meshes.new(source.name+'-'+key)
            mesh.from_pydata([source.data.vertices[i].co[:] for i in used],[],[tuple(remap[v] for v in source.data.polygons[i].vertices) for i in polys]);mesh.update()
            for mat in source.data.materials:mesh.materials.append(mat)
            for target_poly,source_idx in zip(mesh.polygons,polys):
                target_poly.use_smooth=True;target_poly.material_index=source.data.polygons[source_idx].material_index
            mesh.normals_split_custom_set_from_vertices([normals[i] for i in used])
            for uv in source.data.uv_layers:
                dest=mesh.uv_layers.new(name=uv.name)
                for target_poly,source_idx in zip(mesh.polygons,polys):
                    for target_loop,source_loop in zip(target_poly.loop_indices,source.data.polygons[source_idx].loop_indices):dest.data[target_loop].uv=uv.data[source_loop].uv
            obj=bpy.data.objects.new(source.name+'-'+key,mesh);bpy.context.scene.collection.objects.link(obj)
            obj.matrix_world=source.matrix_world.copy();obj['part_id']=key;obj.select_set(True);exported.append(obj);counts[key]+=1
    assert all(counts.values())
    bpy.context.view_layer.objects.active=exported[0]
    bpy.ops.export_scene.gltf(filepath=str(root/'frontend/public/models'/(name+'.glb')),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_yup=True,export_cameras=False,export_lights=False)
    report.append({'name':name,'part_mesh_counts':counts,'exported_meshes':len(exported)})
print('EXPORT_REPORT',json.dumps(report))

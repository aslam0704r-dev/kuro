from pathlib import Path
from PIL import Image
import zipfile,tarfile,io,struct,zlib
root=Path(__file__).parent.parent.parent;out=root/'work/local-fixtures'
images=[('10.png',(out/'10.png').read_bytes()),('2.png',(out/'2.png').read_bytes()),('1.png',(out/'1.png').read_bytes())]
with zipfile.ZipFile(out/'Comic.cbz','w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in images:archive.writestr(name,data)
 archive.writestr('ComicInfo.xml','<ComicInfo><Title>Metadata not executed</Title></ComicInfo>')
for name,mode in [('Comic.cbt','w'),('Comic.tar.gz','w:gz'),('Comic.tar.bz2','w:bz2'),('Comic.tar.xz','w:xz')]:
 with tarfile.open(out/name,mode) as archive:
  for path,data in images:
   member=tarfile.TarInfo(path);member.size=len(data);archive.addfile(member,io.BytesIO(data))
for name,path,data in [('unsafe.cbz','../1.png',images[0][1]),('damaged.cbz','1.png',b'<svg onload="alert(1)"/>'),('text.epub','chapter.html',b'<script>alert(1)</script>'),('large.cbz','1.png',b'0'*(13*1024*1024))]:
 with zipfile.ZipFile(out/name,'w',zipfile.ZIP_DEFLATED) as archive:archive.writestr(path,data)
with zipfile.ZipFile(out/'Comic.epub','w',zipfile.ZIP_DEFLATED) as archive:
 archive.writestr('mimetype','application/epub+zip')
 archive.writestr('META-INF/container.xml','<container><rootfiles><rootfile full-path="content.opf"/></rootfiles></container>')
 archive.writestr('content.opf','<package><manifest><item id="p1" href="first.xhtml"/><item id="p2" href="second.xhtml"/><item id="p3" href="third.xhtml"/></manifest><spine><itemref idref="p1"/><itemref idref="p2"/><itemref idref="p3"/></spine></package>')
 for name,page in [('first.xhtml','10.png'),('second.xhtml','1.png'),('third.xhtml','2.png')]:archive.writestr(name,'<html xmlns="http://www.w3.org/1999/xhtml"><body><img src="images/'+page+'"/></body></html>')
 for path,data in images:archive.writestr('images/'+path,data)
pdf_images=[Image.open(out/(str(n)+'.png')).convert('RGB') for n in [1,2,10]]
pdf_images[0].save(out/'Comic.pdf',save_all=True,append_images=pdf_images[1:]);(out/'broken.pdf').write_bytes(b'%PDF-1.7\nnot a PDF')
def broken_image_pdf(width=800,height=1200):
 stream=b'not-a-jpeg';contents=b'q 300 0 0 450 0 0 cm /Im0 Do Q'
 objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 450] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>',f'<< /Type /XObject /Subtype /Image /Width {width} /Height {height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length {len(stream)} >>'.encode()+b'\nstream\n'+stream+b'\nendstream',f'<< /Length {len(contents)} >>'.encode()+b'\nstream\n'+contents+b'\nendstream']
 result=bytearray(b'%PDF-1.7\n');offsets=[]
 for n,obj in enumerate(objects,1):offsets.append(len(result));result+=f'{n} 0 obj\n'.encode()+obj+b'\nendobj\n'
 offset=len(result);result+=b'xref\n0 6\n0000000000 65535 f \n'+b''.join(f'{v:010d} 00000 n \n'.encode() for v in offsets)+f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{offset}\n%%EOF\n'.encode();return result
(out/'bad-image.pdf').write_bytes(broken_image_pdf());(out/'oversized-image.pdf').write_bytes(broken_image_pdf(8000,8000))
for kind in ['JPEG','WEBP','GIF','BMP']:
 ext={'JPEG':'jpg','WEBP':'webp','GIF':'gif','BMP':'bmp'}[kind];pdf_images[0].save(out/('Page.'+ext),format=kind)
# A standards-compliant RAR4 stored archive: real headers, file CRC and EOF.
def header(typ,flags,payload):
 block=struct.pack('<BHH',typ,flags,7+len(payload))+payload
 return struct.pack('<H',zlib.crc32(block)&0xffff)+block
rar=bytearray(b'Rar!\x1a\x07\x00');rar+=header(0x73,0,b'\x00'*6)
for path,data in images:
 name=path.encode();payload=struct.pack('<IIBIIBBHI',len(data),len(data),2,zlib.crc32(data),0,20,0x30,len(name),0x20)+name
 rar+=header(0x74,0x8000,payload)+data
rar+=header(0x7b,0,b'');(out/'Comic.cbr').write_bytes(rar)
multipart=bytearray(rar)
for start,flags in [(7,0x101),(len(multipart)-7,1)]:
 struct.pack_into('<H',multipart,start+3,flags);length=struct.unpack_from('<H',multipart,start+5)[0];struct.pack_into('<H',multipart,start,zlib.crc32(multipart[start+2:start+length])&0xffff)
(out/'Renamed.cbr').write_bytes(multipart)
def vint(n):
 b=bytearray()
 while True:
  q=n&127;n>>=7;b.append(q|(128 if n else 0))
  if not n:return bytes(b)
def rar5_header(typ,flags,data):
 contents=vint(typ)+vint(flags)+data;covered=vint(len(contents))+contents;return struct.pack('<I',zlib.crc32(covered))+covered
rar5=bytearray(b'Rar!\x1a\x07\x01\x00')+rar5_header(1,0,vint(0))
for path,data in images:
 name=path.encode();payload=vint(len(data))+vint(4)+vint(len(data))+vint(32)+struct.pack('<I',zlib.crc32(data))+vint(0)+vint(0)+vint(len(name))+name
 rar5+=rar5_header(2,2,payload)+data
rar5+=rar5_header(5,0,vint(0));(out/'Comic-rar5.cbr').write_bytes(rar5)
try:
 import py7zr
 with py7zr.SevenZipFile(out/'Comic.cb7','w') as archive:
  for path,data in images:archive.write(out/path,arcname=path)
except ImportError:print('Optional 7z fixture requires py7zr.')
print('Comic archive, PDF and image fixtures generated.')

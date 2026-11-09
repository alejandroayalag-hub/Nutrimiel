# Recetario inicial (platillos de su menú PDF de NutriMind). Uso: python3 datos-iniciales/platillos.py <base_api> <token> datos-iniciales
import json, subprocess, sys
B, T, D = sys.argv[1:4]
P = [
 ('TÉ VERDE','004',[('Agua','300ml','')]),
 ('OMELETTE CON VERDURAS','006',[('Huevo entero fresco','100g','2 piezas'),('Clara de huevo','66g','2 piezas'),('Jitomate','10g','1 rebanada'),('Cebolla picada','5g','1 cucharada'),('Champiñón fresco','10g','0.1 taza'),('Cilantro','1g','')]),
 ('TORTILLA DE MAÍZ TORTIREGIAS','007',[('Tortiregias','52g','4 piezas')]),
 ('MANZANA COCIDA CON CANELA','008',[('Manzana','106g','1 pieza')]),
 ('PESCADO EMPAPELADO','009',[('Filete de pescado','170g',''),('Pimiento rojo o verde','45g','½ taza'),('Calabacita','55g','½ pieza'),('Espinaca','30g','½ taza')]),
 ('AGUACATE','010',[('Aguacate','31g','⅓ pieza')]),
 ('ARROZ O QUINOA','012',[('Arroz cocido','130.7g','⅔ taza')]),
 ('GELATINA LIGHT CON FRUTA','015',[('Gelatina Light','500g','2 tazas'),('Fresas O 1 reb de piña','60g','5 piezas')]),
 ('MOLLETE CON PAN DE CAJA','016',[('Pan de caja integral','60g','2 piezas'),('Pechuga de pollo o Pavo','75g','2 ½ cucharadas'),('Frijoles de la olla','86g','½ taza'),('Pico de Gallo','140g','2 cucharadas')]),
 ('LICUADO CON LECHE DE ALMENDRAS','017',[('Leche de almendras o coco sin azúcar','250ml','1 vaso mediano'),('Fresas o frutos rojos o negros','72g','6 piezas')]),
]
def curl(*a): return json.loads(subprocess.check_output(['curl','-sf','-H',f'Authorization: Bearer {T}',*a]))
out = {}
for nombre, img, ings in P:
    foto = curl('-F', f'foto=@{D}/p{img}.jpg;type=image/jpeg', f'{B}/planes/fotos')['foto']
    body = {'nombre': nombre, 'foto': foto, 'ingredientes': [dict(alimento=a, cantidad=c, porcion=p) for a, c, p in ings]}
    out[nombre] = curl('-H', 'content-type: application/json', '-d', json.dumps(body), f'{B}/planes/platillos')
    print('✓', nombre)


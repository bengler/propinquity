# preliminary script for building files for web (should be separate stage)
import pandas as pd
import json
from PIL import Image
from PIL.Image import LANCZOS

# create json files with the necessary fields
collection = "painting"
initial_filename = "../data/painting/painting.csv"
output_json = pd.read_csv(initial_filename, encoding='utf-8') \
				.transpose().to_dict().values()

# load embedding coordinates
output_embeddings = pd.read_csv("../data/painting/embeddings.csv", header=None).transpose().to_dict().values()
for e,emb in enumerate(output_embeddings):
    output_json[e]['x'] = emb[1]
    output_json[e]['y'] = emb[2]

json_string = json.dumps(output_json, indent=2)
of = open("painting.js","w")
of.write("var collection = "+json_string)
of.close()

# create tiled image for webgl (test with 100 by 100 images)
print "drawing out"
S = 3200 # size of canvas
tiles = Image.new("RGB",(S,S))
s = 100 # size of every tile
for i in xrange(1024):
    filename = "../data/painting/images/"+str(output_json[i]['sequence_id']).zfill(4)+".jpg"
    try:
    	I = Image.open(filename)
    	I = I.resize((100,100),resample=LANCZOS)
    except:
    	print "image %s could not be loaded" % filename
    	continue

    left = (i % 32)*100
    upper = (i / 32)*100
    right = left + 100
    lower = upper + 100
    tiles.paste(I,(left, upper, right, lower))
tiles.save("tiled_map_32x32_100.jpg")

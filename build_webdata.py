import pandas as pd
import json
from PIL import Image
from PIL.Image import LANCZOS
import re
import math

def build_web_files(options):
	print "- Embedding %s" % options['process_id']

	# create json files with the necessary fields
	process = options['process_id']
	initial_filename = "data/%s/%s.csv" % (process, process)
	orig_json = pd.read_csv(initial_filename, encoding='utf-8') \
					.transpose().to_dict().values()

	# load embedding coordinates
	output_embeddings = pd.read_csv("data/%s/embeddings.csv" % process, 
									header=None).transpose().to_dict().values()
	for e,emb in enumerate(output_embeddings):
		orig_json[e]['x'] = emb[1]
		orig_json[e]['y'] = emb[2]
	# center coordinates
	x_mean = sum(entry['x'] for entry in orig_json)/len(orig_json)
	y_mean = sum(entry['y'] for entry in orig_json)/len(orig_json)
	for entry in orig_json:
		entry['x'] -= x_mean
		entry['y'] -= y_mean

	output_json = []

	for entry in orig_json:
		if 'image_downloaded' in entry and 'embedded' in entry:
			# fix yearstring
			if entry['year_start'] == entry['year_end']:
				entry['yearstring'] = str(int(entry['year_start']))
			else:
				year_start = str(int(entry['year_start'])) if not math.isnan(entry['year_start']) else ''
				year_end = str(int(entry['year_end'])) if not math.isnan(entry['year_end']) else ''
				entry['yearstring'] = year_start+"-"+year_end
				if len(entry['yearstring']) == 1:
					entry['yearstring'] = ''
			
			# remove all text "[]" from title
			entry['title'] = re.sub('\[.*?\]','', entry['title']).strip()

			# change name order
			names = entry['artist'].split(",")
			if len(names) > 1:
				entry['artist'] = names[1].strip()+" "+names[0].strip()

			del entry['embedded']
			del entry['image_downloaded']
			del entry['year_start']
			del entry['year_end']
			output_json.append(entry)

	json_string = json.dumps(output_json, indent=2)
	of = open("data/%s/%s.js" % (process, process),"w")
	of.write("var collection = "+json_string)
	of.close()

	# create tiled image for webgl (test with 100 by 100 images)
	print "drawing out"
	S = 4000 # size of canvas
	tiles = Image.new("RGB",(S,S))
	s = 100 # size of every tile
	added_images = 0
	for i,entry in enumerate(output_json):
		if added_images == 1600:
			break
		filename = "data/%s/images/%s.jpg" % (process ,str(entry['sequence_id']).zfill(4))
		try:
			I = Image.open(filename)
			I = I.resize((100,100),resample=LANCZOS)
		except:
			print "image %s could not be loaded" % filename
			continue

		left = (i % 40)*100
		upper = (i / 40)*100
		right = left + 100
		lower = upper + 100
		tiles.paste(I,(left, upper, right, lower))
		added_images += 1
	tiles.save("data/%s/tiled_map_40x40_100.jpg" % process)

if __name__ == "__main__":
	build_web_files({'process_id' : 'painting'})